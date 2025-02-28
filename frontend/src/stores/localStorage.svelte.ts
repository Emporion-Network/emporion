export const storage = <V>(key: string, d?: V) => {
  if (d) localStorage.setItem(key, JSON.stringify(d));
  return {
    set(v: V) {
      localStorage.setItem(key, JSON.stringify(v));
    },
    get() {
      const item = localStorage.getItem(key);
      if (!item) {
        return;
      }
      return JSON.parse(item) as V;
    },
    exists() {
      return localStorage.getItem(key) !== null;
    },
    clear() {
      localStorage.removeItem(key);
    },
  };
};


export class Storage<T> {
  value: T = $state<T>()!;
  key: string;
  constructor(key: string, d: T) {
    this.key = key;
    if (localStorage.getItem(key) !== null) {
      this.value = JSON.parse(localStorage.getItem(key)!);
    } else {
      localStorage.setItem(key, JSON.stringify(d));
      this.value = d;
    }
    $effect(() => {
      localStorage.setItem(key, JSON.stringify(this.value));
    });
  }
  clear() {
    localStorage.removeItem(this.key);
  }
}