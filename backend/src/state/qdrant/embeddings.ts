import { pipeline } from '@huggingface/transformers';
const extractor = await pipeline('feature-extraction', 'mixedbread-ai/mxbai-embed-large-v1', {
  dtype: 'fp32',
});

/**
 * Embed document to vector
 * @param text - text to embed
 * @returns
 **/
export const embedDocument = async (text: string): Promise<number[]> => {
  const output = await extractor(text, { pooling: 'cls' });
  return Array.from(output.data) as number[];
};

/**
 * Embed query to vector
 * Should be used for searching
 * @param text - text to embed
 * @returns
 **/
export const embedQuery = async (text: string): Promise<number[]> => {
  const output = await extractor(`Represent this sentence for searching relevant passages: ${text}`, { pooling: 'mean' });
  return Array.from(output.data) as number[];
};
