import type { Result } from '.';

export interface Translate {
  req: Record<string, string>
  res: Result<Record<string, string>>
  method: 'post'
  path: '/translate'
}
