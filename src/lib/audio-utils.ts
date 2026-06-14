/**
 * @fileOverview Audio processing utilities for DubbiOvi client ASR.
 */

/**
 * Extracts the audio track from a local video file, downsamples it to 16kHz mono PCM,
 * and encodes it into a standard WAV blob.
 * 
 * @param videoFile The local video file object.
 * @returns A promise that resolves to a WAV audio Blob.
 */
export async function extractAudioTrack(videoFile: File): Promise<Blob> {
  const arrayBuffer = await videoFile.arrayBuffer();
  
  // Create browser AudioContext
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Web Audio API is not supported in this browser.');
  }
  
  const audioContext = new AudioContextClass();
  
  let decodedBuffer: AudioBuffer;
  try {
    decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error('Audio decoding failed:', error);
    throw new Error('Failed to decode video audio track. The audio format or codec may be unsupported.');
  } finally {
    await audioContext.close();
  }
  
  const targetSampleRate = 16000;
  const duration = decodedBuffer.duration;
  
  // Render downsampled mono audio using OfflineAudioContext
  const offlineCtx = new OfflineAudioContext(1, duration * targetSampleRate, targetSampleRate);
  
  const source = offlineCtx.createBufferSource();
  source.buffer = decodedBuffer;
  source.connect(offlineCtx.destination);
  source.start();
  
  const renderedBuffer = await offlineCtx.startRendering();
  
  // Convert rendered Buffer to 16-bit mono WAV format
  return bufferToWav(renderedBuffer);
}

/**
 * Encodes an AudioBuffer into a WAV Blob.
 */
function bufferToWav(buffer: AudioBuffer): Blob {
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  
  // Get mono audio samples (merge to mono if channels > 1)
  let result: Float32Array;
  if (buffer.numberOfChannels === 1) {
    result = buffer.getChannelData(0);
  } else {
    const chan0 = buffer.getChannelData(0);
    const chan1 = buffer.getChannelData(1);
    result = new Float32Array(chan0.length);
    for (let i = 0; i < chan0.length; i++) {
      result[i] = (chan0[i] + chan1[i]) / 2;
    }
  }
  
  const bufferLength = result.length * 2; // 16-bit is 2 bytes per sample
  const wavBuffer = new ArrayBuffer(44 + bufferLength);
  const view = new DataView(wavBuffer);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + bufferLength, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, 1, true);
  /* channel count (mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channels * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* chunk length */
  view.setUint32(40, bufferLength, true);
  
  // Write 16-bit PCM audio samples
  floatTo16BitPCM(view, 44, result);
  
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
