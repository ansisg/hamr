Training: <br/>
100M links from commoncrawl (https://commoncrawl.org/url-index) <br/>
500K links from reddit outbound links dataset, manually adjusted to reduce biases (https://github.com/smythp/reddit_links_dataset) <br/>
Tokenized into a 32k vocabulary using SentencePiece (https://github.com/google/sentencepiece) <br/>
Training data is preprocessed into tokens and dumped in one file separated by EOS, random segments sampled during training <br/>
~3B tokens total training data <br/>
Model: <br/>
Llama style GPT, SwiGLU and RMSNorm, Rotary embeddings <br/>
12 layers, 8 heads, 512 hidden dim, 256 context window <br/>
Trained for 30B tokens total <br/>
Exported into .onnx for browser use <br/>
