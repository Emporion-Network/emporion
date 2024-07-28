<script lang="ts">
    import { wait } from "../lib/utils";

    export const toggleLock = async () => {
        if (!c1.style.getPropertyValue("transform")) {
            let h = lock.getBoundingClientRect().height;
            c1.style.setProperty("transform", `rotate(${90}deg)`);
            c2.style.setProperty("transform", `rotate(${90}deg)`);
            await wait(400);
            ellipse.style.setProperty("transform", "scale(2)");
            await wait(400);
            lock.style.setProperty("transform", `translateY(${h * 0.7}px)`);
            await wait(400);
            t1.style.setProperty("transform", `translateY(${h}px)`);
            t2.style.setProperty("transform", `translateY(${-h}px)`);
        } else {
            t1.style.removeProperty("transform");
            t2.style.removeProperty("transform");
            await wait(400);
            lock.style.removeProperty("transform");
            await wait(400);
            ellipse.style.removeProperty("transform");
            await wait(400);
            c1.style.removeProperty("transform")
            c2.style.removeProperty("transform");
        }
    };

    export const setValue = async (p: number, d: number) => {
        const nbi = 26;
        let s = "url(#paint8_radial_19_29)";
        let e = svgE.querySelector(`[fill="${s}"]`) as Element;
        let si = Array.from(svgE.children).indexOf(e);
        let idx: number[] = [];
        let prevV = 0;
        for (let i = si; i < si + nbi; i++) {
            idx.push(i);
            const el = svgE.children[i] as HTMLElement;
            if (!el.style.getPropertyValue("fill")) {
                prevV = i;
            }
        }
        if(prevV - si > p){
            idx.reverse()
        }
        const w = d / nbi;
        for await (const i of idx) {
            const el = svgE.children[i] as HTMLElement;
            if (i - si < p) {
                el.style.removeProperty("fill");
            } else {
                el.style.setProperty("fill", "#000000");
            }
            await wait(w);
        }
        if (p >= nbi) {
            lock.setAttribute("fill", "#D3E179");
            lockB.setAttribute("fill", "#D3E179");
        }
    };
    let lock: SVGPathElement;
    let lockB: SVGPathElement;
    let svgE: SVGElement;
    let ellipse: SVGEllipseElement;
    let c1: SVGPathElement;
    let c2: SVGPathElement;
    let t1: SVGPathElement;
    let t2: SVGPathElement;
</script>

<svg
    width="70%"
    height="70%"
    viewBox="0 0 590 590"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    bind:this={svgE}
>
    <rect x="12" y="135.459" width="568" height="319.082" fill="black" />
    <path
        d="M1 143.486C1 64.7901 64.5788 1 143 1H447C525.421 1 589 64.7901 589 143.486V281.959H1V143.486Z"
        fill="url(#paint0_radial_19_29)"
        stroke="url(#paint1_radial_19_29)"
        stroke-width="2"
        bind:this={t1}
    />
    <path
        d="M1 446.513V311.051H589V446.513C589 525.21 525.421 589 447 589H143C64.5788 589 1 525.21 1 446.513Z"
        fill="url(#paint2_radial_19_29)"
        stroke="url(#paint3_radial_19_29)"
        stroke-width="2"
        bind:this={t2}
    />
    <ellipse
        cx="295"
        cy="296.003"
        rx="250"
        ry="250.85"
        fill="url(#paint4_radial_19_29)"
    />
    <ellipse cx="295" cy="295" rx="159" ry="159.541" fill="black" />
    <ellipse
        style="transform-origin:50%"
        bind:this={ellipse}
        cx="296"
        cy="295.736"
        rx="70"
        ry="69.7364"
        fill="#191919"
    />
    <path
        d="M427.373 290.927C425.01 219.832 366.873 162.927 295.5 162.927C224.127 162.927 165.99 219.832 163.627 290.927L221.913 290.927C224.478 251.837 256.893 220.927 296.503 220.927C336.114 220.927 368.529 251.837 371.093 290.927L427.373 290.927Z"
        fill="url(#paint5_radial_19_29)"
        bind:this={c1}
        style="transform-origin:50.3% 50%"
    />
    <path
        d="M221.986 301.927C225.032 340.543 257.231 370.927 296.503 370.927C335.776 370.927 367.974 340.543 371.021 301.927L427.291 301.927C423.916 372.085 366.202 427.927 295.5 427.927C224.798 427.927 167.084 372.085 163.709 301.927L221.986 301.927Z"
        fill="url(#paint6_radial_19_29)"
        bind:this={c2}
        style="transform-origin:50.3% 50%"
    />
    <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M294.5 538.826C428.429 538.826 537 429.886 537 295.502C537 161.117 428.429 52.1768 294.5 52.1768C160.571 52.1768 52 161.117 52 295.502C52 429.886 160.571 538.826 294.5 538.826ZM295.026 434.318C371.723 434.318 433.898 372.168 433.898 295.502C433.898 218.835 371.723 156.685 295.026 156.685C218.329 156.685 156.154 218.835 156.154 295.502C156.154 372.168 218.329 434.318 295.026 434.318Z"
        fill="url(#paint7_radial_19_29)"
    />
    <path
        d="M110.631 273.955C109.907 280.205 104.271 284.683 98.0424 283.957C91.8134 283.231 87.3504 277.576 88.074 271.326C88.7975 265.076 94.4336 260.597 100.663 261.323C106.891 262.049 111.354 267.705 110.631 273.955Z"
        fill="url(#paint8_radial_19_29)"
    />
    <path
        d="M121.783 227.519C121.06 233.769 115.423 238.247 109.194 237.521C102.966 236.795 98.5025 231.14 99.2261 224.89C99.9496 218.639 105.586 214.161 111.815 214.887C118.044 215.613 122.507 221.269 121.783 227.519Z"
        fill="url(#paint9_radial_19_29)"
    />
    <path
        d="M143.687 185.109C142.963 191.359 137.327 195.837 131.098 195.111C124.869 194.385 120.406 188.73 121.13 182.479C121.853 176.229 127.489 171.751 133.718 172.477C139.947 173.203 144.41 178.858 143.687 185.109Z"
        fill="url(#paint10_radial_19_29)"
    />
    <path
        d="M175.068 149.192C174.345 155.442 168.709 159.92 162.48 159.194C156.251 158.468 151.788 152.813 152.511 146.563C153.235 140.313 158.871 135.835 165.1 136.561C171.329 137.287 175.792 142.942 175.068 149.192Z"
        fill="url(#paint11_radial_19_29)"
    />
    <path
        d="M214.105 121.854C213.381 128.104 207.745 132.582 201.516 131.856C195.287 131.13 190.824 125.475 191.548 119.225C192.271 112.975 197.907 108.497 204.136 109.223C210.365 109.949 214.828 115.604 214.105 121.854Z"
        fill="url(#paint12_radial_19_29)"
    />
    <path
        d="M258.527 104.684C257.803 110.934 252.167 115.413 245.938 114.687C239.709 113.961 235.246 108.305 235.97 102.055C236.693 95.805 242.33 91.3268 248.559 92.0528C254.787 92.7788 259.25 98.4341 258.527 104.684Z"
        fill="url(#paint13_radial_19_29)"
    />
    <path
        d="M305.754 98.6803C305.03 104.93 299.394 109.409 293.165 108.683C286.936 107.957 282.473 102.301 283.197 96.0512C283.92 89.8011 289.556 85.3229 295.785 86.0489C302.014 86.7749 306.477 92.4302 305.754 98.6803Z"
        fill="url(#paint14_radial_19_29)"
    />
    <path
        d="M353.039 104.192C352.316 110.442 346.68 114.92 340.451 114.194C334.222 113.468 329.759 107.813 330.482 101.563C331.206 95.3128 336.842 90.8346 343.071 91.5606C349.3 92.2866 353.763 97.9419 353.039 104.192Z"
        fill="url(#paint15_radial_19_29)"
    />
    <path
        d="M397.637 120.898C396.914 127.148 391.277 131.626 385.048 130.9C378.82 130.174 374.357 124.519 375.08 118.269C375.804 112.018 381.44 107.54 387.669 108.266C393.898 108.992 398.361 114.647 397.637 120.898Z"
        fill="url(#paint16_radial_19_29)"
    />
    <path
        d="M436.954 147.827C436.231 154.077 430.595 158.556 424.366 157.83C418.137 157.104 413.674 151.448 414.397 145.198C415.121 138.948 420.757 134.47 426.986 135.196C433.215 135.922 437.678 141.577 436.954 147.827Z"
        fill="url(#paint17_radial_19_29)"
    />
    <path
        d="M468.706 183.416C467.982 189.666 462.346 194.144 456.117 193.418C449.888 192.692 445.425 187.037 446.149 180.787C446.872 174.536 452.509 170.058 458.737 170.784C464.966 171.51 469.429 177.166 468.706 183.416Z"
        fill="url(#paint18_radial_19_29)"
    />
    <path
        d="M491.047 225.594C490.324 231.844 484.688 236.322 478.459 235.596C472.23 234.87 467.767 229.215 468.49 222.965C469.214 216.715 474.85 212.236 481.079 212.962C487.308 213.688 491.771 219.344 491.047 225.594Z"
        fill="url(#paint19_radial_19_29)"
    />
    <path
        d="M502.68 271.913C501.956 278.163 496.32 282.641 490.091 281.915C483.862 281.189 479.399 275.534 480.123 269.284C480.846 263.034 486.482 258.555 492.711 259.281C498.94 260.007 503.403 265.663 502.68 271.913Z"
        fill="url(#paint20_radial_19_29)"
    />
    <path
        d="M502.927 319.677C502.203 325.927 496.567 330.406 490.338 329.68C484.109 328.954 479.646 323.298 480.37 317.048C481.093 310.798 486.729 306.32 492.958 307.046C499.187 307.772 503.65 313.427 502.927 319.677Z"
        fill="url(#paint21_radial_19_29)"
    />
    <path
        d="M491.774 366.114C491.051 372.364 485.415 376.842 479.186 376.116C472.957 375.39 468.494 369.735 469.217 363.485C469.941 357.235 475.577 352.757 481.806 353.482C488.035 354.208 492.498 359.864 491.774 366.114Z"
        fill="url(#paint22_radial_19_29)"
    />
    <path
        d="M469.871 408.523C469.147 414.773 463.511 419.251 457.282 418.525C451.053 417.799 446.59 412.144 447.314 405.894C448.037 399.644 453.673 395.166 459.902 395.892C466.131 396.618 470.594 402.273 469.871 408.523Z"
        fill="url(#paint23_radial_19_29)"
    />
    <path
        d="M438.489 444.441C437.765 450.691 432.129 455.169 425.9 454.443C419.671 453.717 415.208 448.062 415.932 441.811C416.655 435.561 422.291 431.083 428.52 431.809C434.749 432.535 439.212 438.19 438.489 444.441Z"
        fill="url(#paint24_radial_19_29)"
    />
    <path
        d="M399.453 471.778C398.729 478.028 393.093 482.506 386.864 481.78C380.635 481.054 376.172 475.399 376.896 469.149C377.619 462.899 383.255 458.421 389.484 459.147C395.713 459.873 400.176 465.528 399.453 471.778Z"
        fill="url(#paint25_radial_19_29)"
    />
    <path
        d="M355.03 488.948C354.307 495.198 348.671 499.677 342.442 498.951C336.213 498.225 331.75 492.569 332.473 486.319C333.197 480.069 338.833 475.591 345.062 476.317C351.291 477.043 355.754 482.698 355.03 488.948Z"
        fill="url(#paint26_radial_19_29)"
    />
    <path
        d="M307.804 494.952C307.081 501.202 301.444 505.68 295.215 504.954C288.987 504.228 284.524 498.573 285.247 492.323C285.971 486.073 291.607 481.594 297.836 482.32C304.065 483.046 308.528 488.702 307.804 494.952Z"
        fill="url(#paint27_radial_19_29)"
    />
    <path
        d="M260.518 489.441C259.794 495.691 254.158 500.169 247.929 499.443C241.7 498.717 237.237 493.062 237.961 486.811C238.684 480.561 244.321 476.083 250.549 476.809C256.778 477.535 261.241 483.19 260.518 489.441Z"
        fill="url(#paint28_radial_19_29)"
    />
    <path
        d="M215.921 472.735C215.197 478.985 209.561 483.463 203.332 482.737C197.103 482.011 192.64 476.356 193.364 470.106C194.087 463.856 199.723 459.378 205.952 460.104C212.181 460.83 216.644 466.485 215.921 472.735Z"
        fill="url(#paint29_radial_19_29)"
    />
    <path
        d="M176.603 445.805C175.88 452.055 170.244 456.533 164.015 455.807C157.786 455.081 153.323 449.426 154.046 443.176C154.77 436.926 160.406 432.447 166.635 433.173C172.864 433.899 177.327 439.555 176.603 445.805Z"
        fill="url(#paint30_radial_19_29)"
    />
    <path
        d="M144.851 410.216C144.128 416.467 138.492 420.945 132.263 420.219C126.034 419.493 121.571 413.837 122.294 407.587C123.018 401.337 128.654 396.859 134.883 397.585C141.112 398.311 145.575 403.966 144.851 410.216Z"
        fill="url(#paint31_radial_19_29)"
    />
    <path
        d="M122.51 368.038C121.787 374.288 116.151 378.766 109.922 378.04C103.693 377.314 99.2298 371.659 99.9534 365.409C100.677 359.159 106.313 354.68 112.542 355.406C118.771 356.132 123.234 361.788 122.51 368.038Z"
        fill="url(#paint32_radial_19_29)"
    />
    <path
        d="M110.878 321.72C110.155 327.97 104.518 332.448 98.2895 331.722C92.0605 330.996 87.5975 325.341 88.321 319.091C89.0446 312.841 94.6807 308.362 100.91 309.088C107.139 309.814 111.602 315.47 110.878 321.72Z"
        fill="url(#paint33_radial_19_29)"
    />
    <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M281.714 278.946C281.714 270.633 288.43 263.895 296.714 263.895C304.999 263.895 311.714 270.633 311.714 278.946V282.529H303.857V278.229C303.857 274.271 300.659 271.062 296.714 271.062C292.769 271.062 289.571 274.271 289.571 278.229V293.28H281.714V278.946Z"
        fill="#424242"
        bind:this={lock}
    />
    <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M284 290C279.582 290 276 293.582 276 298V317.119C276 321.537 279.582 325.119 284 325.119H308C312.418 325.119 316 321.537 316 317.119V298C316 293.582 312.418 290 308 290H284ZM296.5 312C298.985 312 301 309.985 301 307.5C301 305.015 298.985 303 296.5 303C294.015 303 292 305.015 292 307.5C292 309.985 294.015 312 296.5 312Z"
        fill="#424242"
        bind:this={lockB}
    />
    <defs>
        <radialGradient
            id="paint0_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(295 141.479) rotate(90) scale(293.787 612.577)"
        >
            <stop offset="0.00601705" />
            <stop offset="1" stop-color="#222222" />
        </radialGradient>
        <radialGradient
            id="paint1_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(295 169.5) rotate(-90) scale(190.674 922.942)"
        >
            <stop offset="0.836185" stop-color="#131313" />
            <stop offset="1" stop-color="#999999" />
        </radialGradient>
        <radialGradient
            id="paint2_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(295 310) rotate(90) scale(430.687 907.684)"
        >
            <stop offset="0.00601705" />
            <stop offset="0.936955" stop-color="#222222" />
        </radialGradient>
        <radialGradient
            id="paint3_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(295 350.5) rotate(90) scale(262 1281.83)"
        >
            <stop offset="0.89361" stop-color="#131313" />
            <stop offset="1" stop-color="#999999" />
        </radialGradient>
        <radialGradient
            id="paint4_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(295 296.003) rotate(90) scale(284.464 283.5)"
        >
            <stop offset="0.841436" />
            <stop offset="1" stop-color="#666666" />
        </radialGradient>
        <radialGradient
            id="paint5_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(295.927 295.927) rotate(180) scale(138.971 139.632)"
        >
            <stop offset="0.930437" stop-color="#191919" />
            <stop offset="0.994797" stop-color="#7F7F7F" />
        </radialGradient>
        <radialGradient
            id="paint6_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(295.927 295.927) rotate(180) scale(138.971 139.632)"
        >
            <stop offset="0.930437" stop-color="#191919" />
            <stop offset="0.994797" stop-color="#7F7F7F" />
        </radialGradient>
        <radialGradient
            id="paint7_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(294.5 295.502) rotate(89.545) scale(251.862 251.008)"
        >
            <stop offset="0.952778" stop-color="#121212" />
            <stop offset="1" stop-color="#787878" />
        </radialGradient>
        <radialGradient
            id="paint8_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(99.104 272.621) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint9_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(110.256 226.185) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint10_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(132.16 183.775) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint11_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(163.542 147.858) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint12_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(202.578 120.52) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint13_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(247 103.35) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint14_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(294.227 97.3465) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint15_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(341.512 102.858) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint16_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(386.11 119.564) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint17_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(425.427 146.493) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint18_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(457.179 182.082) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint19_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(479.52 224.26) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint20_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(491.153 270.579) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint21_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(491.4 318.344) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint22_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(480.247 364.78) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint23_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(458.344 407.189) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint24_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(426.962 443.107) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint25_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(387.926 470.444) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint26_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(343.503 487.615) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint27_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(296.277 493.618) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint28_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(248.991 488.107) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint29_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(204.394 471.401) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint30_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(165.076 444.471) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint31_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(133.324 408.883) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint32_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(110.983 366.704) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
        <radialGradient
            id="paint33_radial_19_29"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(99.3511 320.386) rotate(99.4308) scale(9.15434 9.32132)"
        >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#CBDB60" />
        </radialGradient>
    </defs>
</svg>

<style lang="scss">
    path,
    ellipse {
        transition: all 200ms ease-in-out;
    }
</style>
