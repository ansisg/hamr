import * as ort from "onnxruntime-web";

export class GPT {
  constructor() {
    this.session = null;
  }

  async load(modelPath) {
    ort.env.wasm.wasmPaths = '/hamr/ort/'

    this.session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ["webgpu", "wasm"],
      graphOptimizationLevel: "all",
    });
  }

  async logits(ids) {
    const input = new ort.Tensor(
      "int64",
      BigInt64Array.from(ids, (x) => BigInt(x)),
      [1, ids.length],
    );

    const outputs = await this.session.run({
      input_ids: input,
    });

    const logits = outputs.logits;

    /*
     * logits shape:
     *
     * [1, sequence_length, vocab_size]
     */

    const vocabSize = logits.dims[2];
    const sequenceLength = logits.dims[1];

    const start = (sequenceLength - 1) * vocabSize;

    return logits.data.slice(start, start + vocabSize);
  }
}
