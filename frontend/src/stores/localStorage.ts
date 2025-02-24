export const storage = <V>(key: string) => {
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
