export class BitstreamAlphabet {
  constructor(alphabet) {
    this.alphabet = [...alphabet];

    if (this.alphabet.length < 2) {
      throw new Error("Alphabet must have at least 2 symbols");
    }

    if (new Set(this.alphabet).size !== this.alphabet.length) {
      throw new Error("Alphabet contains duplicate symbols");
    }

    this.base = BigInt(this.alphabet.length);

    this.lookup = new Map(this.alphabet.map((c, i) => [c, i]));
  }

  /*
   * Encode arbitrary bits into arbitrary-base
   * symbols, preserving every bit exactly.
   */
  encode(bits) {
    if (!bits.length) {
      return "";
    }

    /*
     * Represent:
     *
     *   1 + bitstream
     *
     * as a BigInt.
     *
     * The leading 1 prevents loss of leading
     * zero bits during base conversion.
     */
    let value = 1n;

    for (const bit of bits) {
      value = (value << 1n) | BigInt(bit);
    }

    /*
     * Convert BigInt to base-N.
     */
    const digits = [];

    while (value > 0n) {
      const digit = Number(value % this.base);

      digits.push(this.alphabet[digit]);

      value /= this.base;
    }

    return digits.reverse().join("");
  }

  decode(text) {
    if (!text.length) {
      return [];
    }

    /*
     * Convert base-N back to BigInt.
     */
    let value = 0n;
    let position = 0;

    while (position < text.length) {
      let match;
      let digit;

      // Alphabet entries are ordered longest-first.
      for (const sequence of this.alphabet) {
        if (text.startsWith(sequence, position)) {
          match = sequence;
          digit = this.lookup.get(sequence);
          break;
        }
      }

      if (digit === undefined) {
        throw new Error(`Invalid character: "${text[position]}"`);
      }

      value = value * this.base + BigInt(digit);
      position += match.length;
    }

    /*
     * Convert back to bits.
     */
    const bits = [];

    while (value > 1n) {
      bits.push(Number(value & 1n));
      value >>= 1n;
    }

    bits.reverse();

    return bits;
  }
}
