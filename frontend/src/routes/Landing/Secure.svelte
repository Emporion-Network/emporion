<script lang="ts">
  import { intersect } from "@/lib/actions.svelte";
  import { onMount } from "svelte";

  let el: HTMLElement;

  const color = ([x, y, z, a]: number[]) => {
    return `rgb(${Math.floor(x * 255)}, ${Math.floor(y * 255)}, ${Math.floor(z * 255)}, ${a})`;
  };

  const clamp = (x: number, min: number, max: number) => {
    return Math.min(Math.max(x, min), max);
  };

  const abs = Math.abs;
  const floor = Math.floor;
  const pow = Math.pow;
  const sin = Math.sin;
  const sqrt = Math.sqrt;
  const cos = Math.cos;
  const random = Math.random;

  const mix = (x: number, y: number, a: number) => {
    return x * (1 - a) + y * a;
  };

  const mod = (x: number, y: number) => {
    return x - y * Math.floor(x / y);
  };

  const length = (v: number[]) => {
    return Math.sqrt(v.reduce((acc, cur) => acc + cur * cur, 0));
  };

  const hsb2rgb = (c: [number, number, number]) => {
    return [0.0, 4.0, 2.0].map((v) => {
      let r = clamp(abs(mod(c[0] * 6.0 + v, 6) - 3) - 1.0, 0, 1);
      r = r * r * (3.0 - 2.0 * r);
      return c[2] * mix(1, r, c[1]);
    });
  };

  const smoothstep = (x: number, min: number, max: number) => {
    return (x - min) / (max - min);
  };

  const brightness = ([x, y, z]: number[]) => {
    return (x + y + z) / 3;
  };

  const randChar = () => {
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[
      floor(random() * 62)
    ];
  };

  const draw = ({
    el,
    x,
    y,
    w,
    h,
    iTime,
    mx,
    my,
  }: {
    el: HTMLElement;
    x: number;
    y: number;
    w: number;
    h: number;
    iTime: number;
    mx: number;
    my: number;
  }) => {
    let p = [(2 * x - w) / (h + 20), (2 * y - h) / h];
    let m = [(2 * mx - w) / (h + 20), (2 * my - h) / h];

    let r = length(p) * 0.6;
    let clr = [0.894, 0.106, 0.137];

    let a = pow(r, 2);
    let b = sin(r * 0.8 - 0.6);
    let c = sin(r + 0.1);
    let s = sin(a - iTime * 1 + b) * c;

    clr = clr.map((v) => v * abs(5.0 / (s * 10.8)) - 0.01);

    let mp = clamp(
      1 - smoothstep(length([p[0] - m[0], p[1] - m[1]]), 0.0, 0.2),
      0,
      1,
    );
    clr = clr.map((v) => 1 * mp + v);

    el.style.color = `${color([...clr, 0.6])}`;
    if (brightness(clr) > 1) {
      el.innerText = randChar();
    }
  };

  let start: number;
  let pxls: HTMLElement[] = [];
  let mouseX: number = 0;
  let mouseY: number = 0;
  let loaded = false;
  const animate = (timestamp: number) => {
    if (!el) return;
    if (loaded) {
      if (start === undefined) {
        start = timestamp;
        pxls = Array.from(el.children) as HTMLElement[];
      }
      const elapsed = (timestamp - start) / 1000;
      const c = el.firstElementChild!.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      let w = floor(r.width / c.width);
      let h = floor(r.height / c.height);

      const mX = clamp(floor((mouseX - r.left) / c.width), 0, w);
      const mY = clamp(floor((mouseY - r.top) / c.height), 0, h);
      for (let i = 0; i < pxls.length; i++) {
        let pxl = pxls[i];
        let x = i % w;
        let y = Math.floor(i / w);
        draw({
          el: pxl,
          x,
          y,
          w,
          h,
          iTime: elapsed,
          mx: mX,
          my: mY,
        });
      }
    }

    requestAnimationFrame(animate);
  };
  const updateMousePos = (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  };

  const load = () => {
    loaded = true;
  };

  const unload = () => {
    loaded = false;
  };

  onMount(() => {
    requestAnimationFrame(animate);
  });
</script>

<svelte:document on:mousemove={updateMousePos} />
<div
  class="itms"
  bind:this={el}
  use:intersect={"0%"}
  onexit={unload}
  onenter={load}
>
  {#each { length: 5800 } as _}
    <span>{randChar()}</span>
  {/each}
</div>

<style lang="scss">
  .itms {
    font-family: var(--font-mono);
    word-break: break-all;
    cursor: default;
    color: var(--white-a2);
    line-height: 1rem;
    font-size: 1rem;
    position: relative;
    text-align: justify;
    user-select: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, 0.65rem);
    &::after {
      content: "";
      position: absolute;
      top: -5%;
      left: 0;
      width: 100%;
      height: 110%;
      pointer-events: none;
      user-select: none;

      background: radial-gradient(
          ellipse closest-side at center,
          rgba(0, 0, 0, 0),
          rgba(0, 0, 0, 1) 120%
        ),
        linear-gradient(
          to bottom,
          rgba(0, 0, 0, 1),
          rgba(0, 0, 0, 0),
          rgba(0, 0, 0, 1)
        );
    }
  }
</style>
