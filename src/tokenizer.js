// src/tokenizer.js

import createSentencePiece from "@mailwoman/sentencepiece-wasm";

export class Tokenizer {
  constructor() {
    this.sp = null;
    this.eos = null;
    this.vocab = null;
    this.module = null;
  }

  async load(modelPath) {
    this.module = await createSentencePiece();

    this.sp = new this.module.SentencePieceProcessor();

    const response = await fetch(modelPath);

    const bytes = new Uint8Array(await response.arrayBuffer());

    /*
     * Load serialized SentencePiece ModelProto
     */
    this.sp.loadFromSerializedProto(bytes);

    console.log("SentencePiece loaded", this.sp);

    /*
     * These bindings expose the C++ names.
     * Check exact names:
     */
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(this.sp)));

    this.eos = this.sp.eosId ? this.sp.eosId() : 2; // SentencePiece default EOS
  }

  encode(text) {
    /*
     * encodeWithOffsets returns more info.
     * Usually:
     *
     * {
     *   ids: [...],
     *   pieces: [...]
     * }
     */

    const result = this.sp.encodeWithOffsets(text);

    console.log("RAW ENCODE RESULT:", result);
    if (Array.isArray(result)) {
      return result;
    }

    return result.ids;
  }

  decode(ids) {
    const vector = new this.module.IntVector();

    for (const id of ids) {
      vector.push_back(Number(id));
    }

    try {
      return this.sp.decodeIds(vector);
    } finally {
      vector.delete();
    }
  }

  eosId() {
    return this.eos;
  }

  vocabSize() {
    /*
     * SentencePiece normally exposes
     * GetPieceSize().
     *
     * Check the prototype dump.
     */
    if (this.sp.getPieceSize) {
      return this.sp.getPieceSize();
    }

    if (this.sp.vocabSize) {
      return this.sp.vocabSize();
    }

    return 32000;
  }
}
