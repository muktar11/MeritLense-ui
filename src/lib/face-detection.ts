// Azure Static Web Apps was confirmed (directly, via curl against
// production) to serve large model binaries extremely slowly and
// unreliably - even the ~6.4MB face recognition model, which is required
// and can't be shrunk away, sometimes failed to fully transfer at all.
// jsDelivr is a real CDN built for exactly this (serving npm package
// assets at scale) and measured dramatically faster/more consistent in
// the same test. Pinned to the installed package version so an upstream
// release can't silently change what gets served. The local /models copy
// is kept only as a fallback if the CDN itself is unreachable (e.g. a
// corporate firewall blocking jsdelivr.net).
const CDN_MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model";
const LOCAL_MODEL_URL = "/models";

// TinyFaceDetector defaults (inputSize 416, scoreThreshold 0.5) are tuned
// for speed over accuracy. For the one-time identity check specifically,
// a larger inputSize (more detail preserved, still far lighter than
// switching detector models entirely) and a lower scoreThreshold (catches
// borderline detections instead of silently returning zero faces) trade a
// bit of speed for meaningfully better detection under imperfect lighting -
// without adding any extra model weights to load.
export const IDENTITY_DETECTOR_TUNING = { inputSize: 512, scoreThreshold: 0.3 };

// @vladmandic/face-api's bundled type declarations expose `tf` as a much
// narrower type than what's actually available at runtime (the full
// TensorFlow.js core API, including setBackend/ready) - this is just enough
// of that real shape to call them without resorting to `any`.
interface TfBackendControls {
  setBackend(name: string): Promise<boolean>;
  ready(): Promise<void>;
}

let modelsLoadingPromise: Promise<typeof import("@vladmandic/face-api")> | null = null;

// @vladmandic/face-api defaults to TensorFlow.js's "wasm" backend, which
// needs its own .wasm binary served correctly - Next.js doesn't bundle that
// automatically, so it 404s and leaves the backend uninitialized. WebGL (with
// a plain-JS "cpu" fallback) needs no extra binary assets and is well
// supported in browsers, so we force it explicitly before loading models.
export async function ensureModelsLoaded() {
  if (!modelsLoadingPromise) {
    modelsLoadingPromise = (async () => {
      try {
        const faceapi = await import("@vladmandic/face-api");
        const tf = faceapi.tf as unknown as TfBackendControls;
        try {
          await tf.setBackend("webgl");
        } catch {
          await tf.setBackend("cpu");
        }
        await tf.ready();
        // Deliberately only TinyFaceDetector (~200KB), not the heavier
        // SsdMobilenetv1 (~5.6MB) that was here briefly - not worth the
        // extra weight over tuning this lighter model (see
        // IDENTITY_DETECTOR_TUNING above).
        const loadFrom = (url: string) =>
          Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(url),
            faceapi.nets.faceLandmark68Net.loadFromUri(url),
            faceapi.nets.faceRecognitionNet.loadFromUri(url),
          ]);
        try {
          await loadFrom(CDN_MODEL_URL);
        } catch {
          await loadFrom(LOCAL_MODEL_URL);
        }
        return faceapi;
      } catch (err) {
        // Don't cache a failed load (even after the CDN-then-local
        // fallback above) - caching a rejection would make every future
        // call, including a candidate's own retry, replay the same
        // failure forever instead of actually trying again.
        modelsLoadingPromise = null;
        throw err;
      }
    })();
  }
  return modelsLoadingPromise;
}

// Below same confidence, TinyFaceDetector did find *a* face but isn't
// confident about it - in practice this correlates strongly with the kind
// of blurry/low-res/poorly-lit passport scans that later defeat the real
// selfie-vs-passport match at interview time. Deliberately higher than
// IDENTITY_DETECTOR_TUNING.scoreThreshold (0.3, which only gates whether a
// detection is returned at all) - this is a stricter bar used to actually
// reject an upload, not just decide whether a face exists at all.
const LOW_CONFIDENCE_SCORE_THRESHOLD = 0.6;

// Detector confidence alone doesn't reliably catch every bad passport scan -
// a face can be detected with reasonable confidence even when it's visually
// obscured (e.g. printed under a security-pattern overlay, motion blur, poor
// scan resolution). Laplacian-variance is a standard, cheap sharpness proxy:
// sharp edges produce a high-variance response, blur flattens it out. Run
// only on the detected face crop (not the whole document) so background
// texture/print patterns elsewhere on the page don't skew the result.
const BLUR_VARIANCE_THRESHOLD = 50;

export type PassportPhotoQualityStatus =
  | "ok"
  | "no-face"
  | "multiple-faces"
  | "low-quality"
  | "skipped";

export interface PassportPhotoQualityResult {
  status: PassportPhotoQualityStatus;
  faceCount: number;
}

// Best-effort, client-side-only hint shown at upload time so candidates
// catch an unusable passport photo before it ever reaches an interview -
// by then it's too late to ask them to re-upload. Deliberately never
// throws: any failure (model load, image decode) just skips the hint
// rather than blocking a candidate-creation form on a heuristic.
export async function checkPassportPhotoQuality(file: File): Promise<PassportPhotoQualityResult> {
  if (!file.type.startsWith("image/")) {
    // PDF passports can't be rasterized in the browser without pulling in
    // a full PDF renderer - the backend already converts PDF passports to
    // PNG for the real verification step, so this upload-time hint simply
    // doesn't apply to them.
    return { status: "skipped", faceCount: 0 };
  }

  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(file);
    const image = await loadImage(objectUrl);
    const faceapi = await ensureModelsLoaded();
    const detections = await faceapi.detectAllFaces(
      image,
      new faceapi.TinyFaceDetectorOptions(IDENTITY_DETECTOR_TUNING)
    );

    if (detections.length === 0) return { status: "no-face", faceCount: 0 };
    if (detections.length > 1) return { status: "multiple-faces", faceCount: detections.length };

    const detection = detections[0];
    const lowConfidence = detection.score < LOW_CONFIDENCE_SCORE_THRESHOLD;
    const blurry = computeBlurVariance(image, detection.box) < BLUR_VARIANCE_THRESHOLD;
    return { status: lowConfidence || blurry ? "low-quality" : "ok", faceCount: 1 };
  } catch {
    return { status: "skipped", faceCount: 0 };
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function computeBlurVariance(
  image: HTMLImageElement,
  box: { x: number; y: number; width: number; height: number }
): number {
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Infinity; // can't evaluate - don't reject on a canvas failure

  ctx.drawImage(image, box.x, box.y, box.width, box.height, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const gray = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const o = i * 4;
    gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }

  // 4-neighbor discrete Laplacian at every interior pixel, then the
  // variance of that edge-response map - the classic cheap blur metric.
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = y * size + x;
      const lap = gray[idx - 1] + gray[idx + 1] + gray[idx - size] + gray[idx + size] - 4 * gray[idx];
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }
  const mean = sum / count;
  return sumSq / count - mean * mean;
}
