import { createMiddleware } from 'hono/factory';
import { findClosestLanguage, type SupportedLanguage } from '@common';

export const lang = createMiddleware<{
  Variables: {
    lang: SupportedLanguage
  }
}>(async (c, next) => {
  const prefered = (c.req.header('Accept-Language') || 'en').split(',')
    .map((lang) => {
      const parts = lang.trim().split(';');
      const languageCode = parts[0];
      const q = parts.length > 1 && parts[1].startsWith('q=') ? parseFloat(parts[1].substring(2)) : 1;
      return { code: languageCode, q };
    })
    .sort((a, b) => b.q - a.q).map(a => a.code);
  const lang = findClosestLanguage(prefered);
  c.set('lang', lang);
  await next();
});
