const MODEL_URL = "/models";

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
        // SsdMobilenetv1 (~5.6MB) that was here briefly - a real candidate
        // hit a load failure that traced back to Azure Static Web Apps
        // serving large model files extremely slowly (confirmed directly:
        // a multi-MB file transferring at ~30-50KB/s, sometimes not
        // completing at all). A large binary sitting in the critical path
        // of "can this candidate even start their interview" is a
        // reliability risk that isn't worth the accuracy gain - see
        // IDENTITY_DETECTOR_TUNING above for how detection accuracy is
        // instead improved by tuning this same lightweight model.
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        return faceapi;
      } catch (err) {
        // Don't cache a failed load - a network blip loading ~13MB of model
        // weights is often transient, and caching the rejection would make
        // every future call (including a candidate's own retry) replay the
        // same failure forever instead of actually trying again.
        modelsLoadingPromise = null;
        throw err;
      }
    })();
  }
  return modelsLoadingPromise;
}
