import { Tokenizer } from "./tokenizer.js";
import { GPT } from "./model.js";
import { ArithmeticCoder } from "./arithmetic-coder.js";
import { BitstreamAlphabet } from "./bitstream-alphabet.js";
export let coder = null;
export async function initialize() {

  const tokenizer = new Tokenizer();
  await tokenizer.load("/hamr/model/sentencepiece_32k.model");
  console.log("Vocabulary size:", tokenizer.vocabSize());
  const model = new GPT();

  await model.load("/hamr/model/gpt.onnx");
  coder = new ArithmeticCoder({
    precision: 64,
    freqPrecision: 32,
    tokenizer,
    model,
  });
}

export async function compress(input, alphabet) {
  const bits = await coder.encode(input);
  console.log("Bits:", bits);
  const alphabet_encoder = new BitstreamAlphabet(alphabet);
  const output = alphabet_encoder.encode(bits);
  return output;
}
export async function decompress(input, alphabet) {
  const alphabet_decoder = new BitstreamAlphabet(alphabet);
  const bits = alphabet_decoder.decode(input);
  const decoded = await coder.decode(bits);
  return decoded;
}
