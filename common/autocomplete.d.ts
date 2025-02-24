import { Result } from ".";

export interface Autocomplete {
  req: { description: string }
  res: Result<string[]>
  method: 'post'
  path: '/autocomplete'
}