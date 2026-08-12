const ZERO = 0n;
const ONE = 1n;

export class ArithmeticCoder {
  constructor({ precision = 64, freqPrecision = 32, tokenizer, model }) {
    this.precision = precision;
    this.freqPrecision = freqPrecision;

    this.MAX_RANGE = ONE << BigInt(precision);
    this.HALF = this.MAX_RANGE >> 1n;
    this.QUARTER = this.HALF >> 1n;
    this.THREE_QUARTER = this.QUARTER * 3n;

    this.tokenizer = tokenizer;
    this.model = model;

    this.vocabSize = tokenizer.vocabSize();
  }

  buildCDF(probs) {
    const total = 1n << BigInt(this.freqPrecision);

    const freqs = new Array(probs.length);

    for (let i = 0; i < probs.length; i++) {
      /*
       * Python:
       *
       * max(1, int(p * total))
       *
       * Convert total to Number here because probabilities
       * are float32 and total is 2^32.
       */
      const f = Math.floor(probs[i] * Number(total));

      freqs[i] = BigInt(Math.max(1, f));
    }

    let sum = ZERO;

    for (const f of freqs) {
      sum += f;
    }

    const diff = total - sum;

    let largest = 0;

    for (let i = 1; i < freqs.length; i++) {
      if (freqs[i] > freqs[largest]) {
        largest = i;
      }
    }

    freqs[largest] += diff;

    const cdf = new Array(freqs.length + 1);
    cdf[0] = ZERO;

    for (let i = 0; i < freqs.length; i++) {
      cdf[i + 1] = cdf[i] + freqs[i];
    }

    return cdf;
  }

  outputBit(bits, bit, state) {
    bits.push(bit);

    while (state.pending > 0) {
      bits.push(1 - bit);
      state.pending--;
    }
  }

  async probabilities(context) {
    const logits = await this.model.logits(context);

    /*
     * softmax(logits)
     */
    let max = -Infinity;

    for (const x of logits) {
      if (x > max) max = x;
    }

    const probs = new Float64Array(logits.length);

    let sum = 0;

    for (let i = 0; i < logits.length; i++) {
      const p = Math.exp(logits[i] - max);
      probs[i] = p;
      sum += p;
    }

    for (let i = 0; i < probs.length; i++) {
      probs[i] /= sum;
    }

    return probs;
  }

  async encode(text) {
    let low = ZERO;
    let high = this.MAX_RANGE - ONE;

    const state = {
      pending: 0,
    };

    const bits = [];

    const output = (bit) => {
      this.outputBit(bits, bit, state);
    };

    const eos = this.tokenizer.eosId();

    const ids = [eos, ...this.tokenizer.encode(text), eos];

    console.log(`Encoding ${ids.length} symbols`);

    for (let i = 1; i < ids.length; i++) {
      const context = ids.slice(Math.max(0, i - 256), i);

      const probs = await this.probabilities(context);

      const cdf = this.buildCDF(probs);

      const symbol = ids[i];
      const total = cdf[cdf.length - 1];

      const span = high - low + ONE;

      high = low + (span * cdf[symbol + 1]) / total - ONE;

      low = low + (span * cdf[symbol]) / total;

      while (true) {
        if (high < this.HALF) {
          output(0);
        } else if (low >= this.HALF) {
          output(1);

          low -= this.HALF;
          high -= this.HALF;
        } else if (low >= this.QUARTER && high < this.THREE_QUARTER) {
          state.pending++;

          low -= this.QUARTER;
          high -= this.QUARTER;
        } else {
          break;
        }

        low <<= 1n;
        high = (high << 1n) | ONE;
      }
    }

    state.pending++;

    if (low < this.QUARTER) {
      output(0);
    } else {
      output(1);
    }

    return bits;
  }

  async decode(bits) {
    let low = ZERO;
    let high = this.MAX_RANGE - ONE;
    let value = ZERO;

    let bitIndex = 0;

    const readBit = () => {
      if (bitIndex >= bits.length) {
        return 0;
      }

      return bits[bitIndex++];
    };

    /*
     * Initialize the coding interval.
     */
    for (let i = 0; i < this.precision; i++) {
      value <<= 1n;
      value |= BigInt(readBit());
    }

    const eos = this.tokenizer.eosId();

    const symbols = [eos];

    while (true) {
      /*
       * Python uses:
       *
       * context = symbols
       *
       * and then GPT(...).
       *
       * But GPT is limited to 256 tokens.
       */
      const context = symbols.slice(-256);

      const probs = await this.probabilities(context);

      const cdf = this.buildCDF(probs);
      const total = cdf[cdf.length - 1];

      const span = high - low + ONE;

      const scaled = ((value - low + ONE) * total - ONE) / span;

      /*
       * Find:
       *
       * cdf[symbol] <= scaled < cdf[symbol + 1]
       */
      let lo = 0;
      let hi = cdf.length - 1;

      while (lo < hi) {
        const mid = (lo + hi) >> 1;

        if (cdf[mid + 1] <= scaled) {
          lo = mid + 1;
        } else {
          hi = mid;
        }
      }

      const symbol = lo;

      symbols.push(symbol);

      if (symbol === eos) {
        break;
      }

      high = low + (span * cdf[symbol + 1]) / total - ONE;

      low = low + (span * cdf[symbol]) / total;

      while (true) {
        if (high < this.HALF) {
          // nothing
        } else if (low >= this.HALF) {
          low -= this.HALF;
          high -= this.HALF;
          value -= this.HALF;
        } else if (low >= this.QUARTER && high < this.THREE_QUARTER) {
          low -= this.QUARTER;
          high -= this.QUARTER;
          value -= this.QUARTER;
        } else {
          break;
        }

        low <<= 1n;
        high = (high << 1n) | ONE;

        value <<= 1n;
        value |= BigInt(readBit());
      }
    }

    return this.tokenizer.decode(symbols.slice(1, -1));
  }
}
