import { fromBech32, toBech32 } from '@cosmjs/encoding';


export function ngrams(str: string) {
  return str.split(/\B|\b/u).reduce((acc, c) => {
    let ret = '';
    if (acc[acc.length - 1]) {
      ret += acc[acc.length - 1];
    }
    ret += c.toLocaleLowerCase();
    acc.push(ret);
    return acc;
  }, [] as string[]);
};

export function humanTimeLeft(locale: string, d: Date) {
  const now = new Date();
  const rtf1 = new Intl.RelativeTimeFormat(locale, { style: 'short' });

  let diff = d.getTime() - now.getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  diff -= months * 1000 * 60 * 60 * 24 * 30;
  const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  diff -= weeks * 1000 * 60 * 60 * 24 * 7;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * 1000 * 60 * 60 * 24;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * 1000 * 60 * 60;
  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * 1000 * 60;
  const seconds = Math.floor(diff / 1000);
  if (months != 0) {
    return rtf1.format(months, 'months');
  }
  if (weeks != 0) {
    return rtf1.format(weeks, 'weeks');
  }
  if (days != 0) {
    return rtf1.format(days, 'days');
  }
  if (hours != 0) {
    return rtf1.format(hours, 'hours');
  }
  if (minutes != 0) {
    return rtf1.format(minutes, 'minutes');
  }
  if (seconds != 0) {
    return rtf1.format(seconds, 'seconds');
  }
}

export const blur = () => {
  let e = document.createElement('input');
  e.setAttribute('style', 'position:absolute;scale(0.01);top:0;');
  document.body.append(e)
  e.focus();
  e.remove();
}


export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) { }
}


export function findMap<T, R>(arr: T[], cb: (v: T) => R) {
  for (const i of arr) {
    const ret = cb(i);
    if (ret) return ret;
  }
}

export function bechToBech(address: string, prefix: string) {
  return toBech32(prefix, fromBech32(address).data);
}

export function getImageData(src: string): Promise<ImageData> {
  return new Promise((resolve) => {
    const c = document.createElement('canvas');
    c.width = 200;
    c.height = 200;
    const ctx = c.getContext('2d')!;
    const i = new Image();
    i.crossOrigin = '';
    i.onload = () => {
      ctx.drawImage(i, 0, 0, 200, 200);
      resolve(ctx.getImageData(0, 0, 200, 200));
    };
    i.src = src;
  });
}

export async function getAvgColor(src: string) {
  const { data } = await getImageData(src);
  let color = [
    data[0],
    data[1],
    data[2],
  ];
  for (let i = 0; i < data.length - 4; i += 4) {
    color = [
      color[0] + data[i + 0],
      color[1] + data[i + 1],
      color[2] + data[i + 2],
    ];
  }
  return [
    Math.floor(color[0] / (data.length / 4)),
    Math.floor(color[1] / (data.length / 4)),
    Math.floor(color[2] / (data.length / 4)),
  ];
}

export async function getBgColor(src: string) {
  const { data } = await getImageData(src);
  const w = 200;
  const h = 200;
  /// get color of 1px around the border
  const color = [
    data[0],
    data[1],
    data[2],
  ]
  for (let i = 0; i < w; i++) {
    color[0] += data[i * 4 + 0];
    color[1] += data[i * 4 + 1];
    color[2] += data[i * 4 + 2];
  }
  for (let i = 0; i < h; i++) {
    color[0] += data[i * 4 * w + 0];
    color[1] += data[i * 4 * w + 1];
    color[2] += data[i * 4 * w + 2];
  }
  for (let i = 0; i < w; i++) {
    color[0] += data[(h - 1) * 4 * w + i * 4 + 0];
    color[1] += data[(h - 1) * 4 * w + i * 4 + 1];
    color[2] += data[(h - 1) * 4 * w + i * 4 + 2];
  }
  for (let i = 0; i < h; i++) {
    color[0] += data[i * 4 + (w - 1) * 4 + 0];
    color[1] += data[i * 4 + (w - 1) * 4 + 1];
    color[2] += data[i * 4 + (w - 1) * 4 + 2];
  }
  return [
    Math.floor(color[0] / (w * h * 4 + w * 2 + h * 2)),
    Math.floor(color[1] / (w * h * 4 + w * 2 + h * 2)),
    Math.floor(color[2] / (w * h * 4 + w * 2 + h * 2)),
  ];
}

export type WithSkeleton<T> = { skeleton: true } | (T & { skeleton?: false });

export const getKeys = Object.keys as <T extends object>(obj: T) => (keyof T)[];

export const wait = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const typeStr = async (v: string, cb: (v: string) => void, speed = 50) => {
  let acc = '';
  for (const i of v) {
    acc += i;
    cb(acc);
    await wait(10 + Math.floor(Math.random() * speed));
  }
};

export const pickImages = (multiple = true) => {
  return new Promise<File[]>((resolve) => {
    const el = document.createElement('input');
    el.type = 'file';
    el.multiple = multiple;
    el.accept = 'image/*';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    el.onchange = (evt: any) => {
      const newfiles = Array.from(evt.currentTarget?.files || []) as File[];
      resolve(newfiles);
    };
    el.click();
  });
};

export const getFile = () => {
  return new Promise<string | undefined>(resolve => {
    //@ts-expect-error
    document.addEventListener('filepicked', (e: CustomEvent<string>) => {
      resolve(e.detail)
    }, { once: true })
    document.dispatchEvent(new CustomEvent('pickfile'))
  })
}

export const intersect = <T>(...arrs: T[][]) => {
  if (arrs.length === 0) {
    return [];
  }
  let result = new Set(arrs[0]);
  for (let i = 1; i < arrs.length; i++) {
    result = new Set([...result].filter(x => arrs[i].includes(x)));
  }
  return [...result];
};

export const looseEq = (a: any, b: any) => {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!looseEq(a[i], b[i])) return false;
    }
    return true;
  } else if (typeof a === 'object') {
    if (Object.keys(a).length !== Object.keys(b).length) return false;
    for (let k in a) {
      if (!looseEq(a[k], b[k])) return false;
    }
    return true;
  } else {
    return a === b;
  }
}
