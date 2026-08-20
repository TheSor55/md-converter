/**
 * converters/video.js
 * Extracts audio track from video files using the browser's Web Audio API,
 * encodes it to WAV PCM, and feeds it into the transcription workflow.
 */

import { WhisperProvider, GeminiProvider } from './audio.js';

export async function convertVideo(file, providerName, apiKey, onProgress) {
  if (typeof onProgress === 'function') onProgress(5);
  
  const arrayBuffer = await file.arrayBuffer();
  if (typeof onProgress === 'function') onProgress(15);
  
  // Create offline AudioContext to decode audio data from the video file
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  
  let audioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    throw new Error(`Failed to decode audio track from video file: ${err.message}. Ensure the video file has a valid audio stream.`);
  }
  
  if (typeof onProgress === 'function') onProgress(45);
  
  // Convert AudioBuffer to WAV blob
  const wavBlob = bufferToWav(audioBuffer);
  if (typeof onProgress === 'function') onProgress(60);
  
  // Transcribe wavBlob using appropriate provider
  const wavFile = new File([wavBlob], `${file.name.replace(/\.[^.]+$/, '')}.wav`, { type: 'audio/wav' });
  
  let provider;
  if (providerName === 'whisper') {
    provider = new WhisperProvider();
  } else if (providerName === 'gemini') {
    provider = new GeminiProvider();
  } else {
    throw new Error('Please select an external API provider (OpenAI Whisper or Gemini) in the settings.');
  }
  
  return await provider.transcribe(wavFile, apiKey, (pct) => {
    // Map API transcription progress (0-100) to overall video progress (60-100)
    const overallPct = 60 + Math.round(pct * 0.4);
    if (typeof onProgress === 'function') onProgress(overallPct);
  });
}

// Convert AudioBuffer to WAV format
function bufferToWav(audioBuffer) {
  const numOfChan = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // 1 = raw PCM
  const bitDepth = 16;
  
  let result;
  if (numOfChan === 2) {
    result = interleave(audioBuffer.getChannelData(0), audioBuffer.getChannelData(1));
  } else {
    result = audioBuffer.getChannelData(0);
  }
  
  return createWavBlob(result, numOfChan, sampleRate, bitDepth);
}

function interleave(inputL, inputR) {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;
  
  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function createWavBlob(samples, numChannels, sampleRate, bitDepth) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);
  
  floatTo16BitPCM(view, 44, samples);
  
  return new Blob([view], { type: 'audio/wav' });
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
