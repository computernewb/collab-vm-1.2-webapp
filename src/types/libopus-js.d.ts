declare module 'libopus.js' {
    /** 
     * OpusDecoder transforms Ogg/Opus packets into raw Int16 PCM samples 
     */
    export class OpusDecoder {
      constructor(sampleRate: number, channels: number);
      /** decode one Opus packet → PCM16 */
      decode(data: Uint8Array): Int16Array;
    }
  }