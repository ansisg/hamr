Training:
100M links from commoncrawl (https://commoncrawl.org/url-index)
500K links from reddit outbound links dataset, manually adjusted to reduce biases (https://github.com/smythp/reddit_links_dataset)
Tokenized into a 32k vocabulary using SentencePiece (https://github.com/google/sentencepiece)
Training data is preprocessed into tokens and dumped in one file separated by EOS, random segments sampled during training
~3B tokens total training data
Model:
Llama style GPT, SwiGLU and RMSNorm, Rotary embeddings
12 layers, 8 heads, 512 hidden dim, 256 context window
Trained for 30B tokens total
Exported into .onnx for browser use
