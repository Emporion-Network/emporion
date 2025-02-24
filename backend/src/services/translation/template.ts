export const template = (message: string) => ({
  messages: [
    {
      role: 'system',
      content: 'You are a multilingual translation agent. You will be given JSON objects in the form {"<source_language>":"<text>", "<target_language>":""}. Your task is to fill in the "<target_language>" field with the translated text.',
    },
    {
      role: 'user',
      content: '{"fr":"Bonjour", "en":""}',
    },
    {
      role: 'assistant',
      content: '{"en":"Hello"}',
    },
    {
      role: 'user',
      content: '{"es":"¿Cómo estás?", "de":""}',
    },
    {
      role: 'assistant',
      content: '{"de":"Wie geht es dir?"}',
    },
    {
      role: 'user',
      content: '{"zh":"谢谢", "ar":""}',
    },
    {
      role: 'assistant',
      content: '{"ar":"شكراً"}',
    },
    {
      role: 'user',
      content: '{"en":"Good morning", "ja":""}',
    },
    {
      role: 'assistant',
      content: '{"ja":"おはようございます"}',
    },
    {
      role: 'user',
      content: '{"en":"Goodbye", "ja":""}',
    },
    {
      role: 'assistant',
      content: '{"ja":"さようなら"}',
    },
    {
      role: 'user',
      content: message,
    },
  ],
  response_format: {
    type: 'json_object',
  },
  model: 'llama-3.3-70b-versatile',
  temperature: 1,
  max_tokens: 1024,
  top_p: 1,
  stream: false,
  stop: null,
});
