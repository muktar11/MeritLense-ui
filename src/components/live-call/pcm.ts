// PCM16 mono @ 16kHz is the format the backend's Azure Speech pipeline
// expects (see LiveCallJoinResult.media.input_format). AudioContext's native
// sampleRate is whatever the device/browser gives us (typically 44.1kHz or
// 48kHz) even when a sampleRate hint is passed to the constructor - browsers
// aren't required to honor it - so every frame gets resampled down here
// regardless. This is a plain nearest-neighbor decimation, not a proper
// anti-aliased resampler; it's simple and "good enough" for speech
// recognition, not broadcast-quality audio.
export function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

export function downsampleTo16k(input: Float32Array, inputSampleRate: number): Int16Array {
  if (inputSampleRate === 16000) {
    return floatTo16BitPCM(input);
  }
  const ratio = inputSampleRate / 16000;
  const outputLength = Math.floor(input.length / ratio);
  const resampled = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    resampled[i] = input[Math.floor(i * ratio)];
  }
  return floatTo16BitPCM(resampled);
}
