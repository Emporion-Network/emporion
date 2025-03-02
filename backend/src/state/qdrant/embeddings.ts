import { pipeline } from '@huggingface/transformers';
const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
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
