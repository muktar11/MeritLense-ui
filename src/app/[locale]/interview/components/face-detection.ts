const MODEL_URL = "/models";

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
        await Promise.all([
          // TinyFaceDetector: fast, used for the repeated in-interview presence
          // checks where speed matters more than precision.
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          // SsdMobilenetv1: slower but meaningfully more accurate under
          // imperfect lighting/angle - used for the one-time identity match,
          // where accuracy matters far more than the extra load time.
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
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
