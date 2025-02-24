export const template = (text: string) => ({
  messages: [
    {
      role: 'system',
      content: 'You are a product description autocompletion agent. You will be given a partial product description you are currently writing in a language. Your task is to fill in the rest of the description.',
    },
    {
      role: 'user',
      content: 'iphon',
    },
    {
      role: 'assistant',
      content: 'iphone 14 pro max',
    },
    {
      role: 'user',
      content: 'winter',
    },
    {
      role: 'assistant',
      content: 'winter coat for men',
    },
    {
      role: 'user',
      content: text,
    },
  ],
  model: 'llama-3.3-70b-versatile',
  max_tokens: 100,
});
