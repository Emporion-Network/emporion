import { Result } from ".";

export interface Autocomplete {
  req: { description: string }
  res: Result<string[]>
  method: 'post'
  path: '/autocomplete'
}

export interface AddressAutocomplete {
  req: string,
  res: Result<string[]>,
  method: 'get',
  path: `/address-autocomplete?q=${string}`
}