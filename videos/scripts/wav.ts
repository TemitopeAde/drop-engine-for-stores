// Minimal 16-bit PCM WAV helpers for the audio scripts.
import { readFileSync, writeFileSync } from "node:fs";

export const RATE = 48000;

/** Seconds of audio in a PCM WAV, read from its header. */
export function wavDuration(path: string) {
  const data = readFileSync(path);
  let offset = 12;
  let byteRate = 0;
  while (offset < data.length) {
    const id = data.toString("ascii", offset, offset + 4);
    const size = data.readUInt32LE(offset + 4);
    if (id === "fmt ") byteRate = data.readUInt32LE(offset + 16);
    if (id === "data") return size / byteRate;
    offset += 8 + size + (size % 2);
  }
  throw new Error(`No data chunk in ${path}`);
}

/** Writes stereo float samples (-1..1) as 16-bit PCM, with a soft clip. */
export function writeWav(path: string, left: Float32Array, right: Float32Array = left) {
  const frames = left.length;
  const buffer = Buffer.alloc(44 + frames * 4);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + frames * 4, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(RATE, 24);
  buffer.writeUInt32LE(RATE * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(frames * 4, 40);
  for (let i = 0; i < frames; i++) {
    buffer.writeInt16LE(Math.round(Math.tanh(left[i]) * 32767), 44 + i * 4);
    buffer.writeInt16LE(Math.round(Math.tanh(right[i]) * 32767), 46 + i * 4);
  }
  writeFileSync(path, buffer);
}
