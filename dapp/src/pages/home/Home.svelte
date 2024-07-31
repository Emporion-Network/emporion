<script lang="ts">
    import { onMount } from "svelte";
    import { fancyBorder } from "../../lib/directives";
    import Logo from "../../lib/Logo.svelte";
    import Atom from "../../assets/Atom.svelte";
    import Nolus from "../../assets/Nolus.svelte";
    import Axelar from "../../assets/Axelar.svelte";
    import Osmo from "../../assets/Osmo.svelte";
    import Dydx from "../../assets/Dydx.svelte";
    import Neutron from "../../assets/Neutron.svelte";
    import BuyerAnimation from "./components/BuyerAnimation.svelte";
    let lines: HTMLElement;

    let animate = () => {
        if (!lines) return;
        let l = Array.from(lines.children) as unknown as HTMLHtmlElement[];
        l.forEach((l, i) => {
            let y = l.style.getPropertyValue("--pos") || `0%`;
            let py = parseInt(y) + 1;
            py = py > 100 ? Math.random() * 10 : py;
            l.style.setProperty("--pos", `${py}%`);
        });
        requestAnimationFrame(animate);
    };

    onMount(() => {
        animate();
    });
</script>

<div class="hero">
    <menu>
        <Logo></Logo>
        <div class="links fancy-border" use:fancyBorder>
            <button>Home</button>
            <button>About</button>
            <button>Blog</button>
            <button>Comunity</button>
            <button>Explore</button>
        </div>
        <button class="fancy-border" use:fancyBorder>Login</button>
    </menu>
    <div class="content">
        <h2>SIMPLE TRUST</h2>
        <h1>Transform Your Wealth With Emporion</h1>
        <div class="buttons">
            <button class="fancy-border" use:fancyBorder>
                Open App
                <i class="ri-arrow-right-up-line"></i>
            </button>
            <button class="secondary"> Learn more </button>
        </div>
        <svg
            width="25vw"
            viewBox="0 0 882 357"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="top-left"
        >
            <path
                d="M0 255H515.659C537.608 255 558.948 247.779 576.386 234.449L880.5 2"
                stroke="url(#paint0_linear_185_43)"
                stroke-width="4"
            />
            <defs>
                <linearGradient
                    id="paint0_linear_185_43"
                    x1="22"
                    y1="255"
                    x2="881"
                    y2="2"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stop-color="white" stop-opacity="0.2" />
                    <stop offset="1" stop-color="white" stop-opacity="0.0" />
                </linearGradient>
            </defs>
        </svg>

        <svg
            width="25vw"
            viewBox="0 0 882 357"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="bottom-left"
        >
            <path
                d="M0 255H515.659C537.608 255 558.948 247.779 576.386 234.449L880.5 2"
                stroke="url(#paint0_linear_185_43)"
                stroke-width="4"
            />
            <defs>
                <linearGradient
                    id="paint0_linear_185_43"
                    x1="22"
                    y1="255"
                    x2="881"
                    y2="2"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stop-color="white" stop-opacity="0.2" />
                    <stop offset="1" stop-color="white" stop-opacity="0.0" />
                </linearGradient>
            </defs>
        </svg>

        <svg
            width="25vw"
            viewBox="0 0 882 357"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="top-right"
        >
            <path
                d="M0 255H515.659C537.608 255 558.948 247.779 576.386 234.449L880.5 2"
                stroke="url(#paint0_linear_185_43)"
                stroke-width="4"
            />
            <defs>
                <linearGradient
                    id="paint0_linear_185_43"
                    x1="22"
                    y1="255"
                    x2="881"
                    y2="2"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stop-color="white" stop-opacity="0.2" />
                    <stop offset="1" stop-color="white" stop-opacity="0.0" />
                </linearGradient>
            </defs>
        </svg>

        <svg
            width="25vw"
            viewBox="0 0 882 357"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="bottom-right"
        >
            <path
                d="M0 255H515.659C537.608 255 558.948 247.779 576.386 234.449L880.5 2"
                stroke="url(#paint0_linear_185_43)"
                stroke-width="4"
            />
            <defs>
                <linearGradient
                    id="paint0_linear_185_43"
                    x1="22"
                    y1="255"
                    x2="881"
                    y2="2"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stop-color="white" stop-opacity="0.2" />
                    <stop offset="1" stop-color="white" stop-opacity="0.0" />
                </linearGradient>
            </defs>
        </svg>

        <div class="lines" bind:this={lines}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    </div>
</div>
<div class="buyer section">
    <h1>Explore a curated list of verified sellers</h1>
    <BuyerAnimation></BuyerAnimation>
</div>
<div class="seller section">
    <div class="steps">
        <div>Get access to milions of potemtial buyers</div>
        <div>Each sucessful transaction increases your refundable amount</div>
        <div>You can pick what currencies you accept</div>
        <div>Your currencies are securly stored on an escrow</div>
        <div>To reduce sellers risk exposure, each seller decides what oreders to process</div>
        <div>In case of a dispute, Emporion bares a portion of the lost funds</div>
    </div>
</div>
<div class="investors section">
    <div class="steps">
        <div>By providing liquidity investors earn a portion of the generated fees</div>
        <div>The fees are distributed on a scedual decided by the community</div>
        <div>Provided liquidity is used towards refunds</div>
        <div>Emporion investors decide the amount of risk the platform is willing to take</div>
    </div>
</div>
<div class="live-distribution section">

</div>
<div class="about">
    <h1>Integrated with</h1>
    <div class="logos">
        <Atom></Atom>
        <Osmo></Osmo>
        <Axelar></Axelar>
        <Nolus></Nolus>
        <Dydx></Dydx>
        <Neutron></Neutron>
    </div>
</div>

<style lang="scss">
    h1 {
        font-size: 52px;
        background: linear-gradient(
            to right,
            #afbbff61 0%,
            #fff 20%,
            #fff 70%,
            #fbd69e3a 100%
        );
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        font-family: "Stardom-Regular";
        max-width: 60vw;
        text-align: center;
    }
    .hero {
        padding: 3% 5%;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        position: relative;

        &::before {
            position: absolute;
            background-image: url("/bg.png");
            content: "";
            width: 100%;
            height: 100%;
            left: 0;
            top: 0;
            background-size: cover;
            opacity: 0.1;
        }

        menu {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: rgba(255, 255, 255, 0.361);
            z-index: 1;

            button {
                background-color: transparent;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 0.8rem 2rem;
                &:hover {
                    color: rgba(255, 255, 255, 0.9);
                }
            }
            .links {
                display: flex;
                padding: 0rem 2rem;
                border-radius: 5rem;
                align-items: center;
                justify-content: center;
                button {
                    flex: 1;
                }
            }
        }
        .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2;
            gap: 1rem;
            .top-left {
                position: absolute;
                top: 15vh;
                left: 0;
            }
            .top-right {
                position: absolute;
                top: 15vh;
                right: 0;
                transform: scaleX(-1);
            }
            .bottom-right {
                position: absolute;
                bottom: 0vh;
                right: 0;
                transform: scale(-1, -1);
            }
            .bottom-left {
                position: absolute;
                bottom: 0vh;
                left: 0;
                transform: scaleY(-1);
            }
            h2 {
                color: #fff;
                font-size: x-small;
                background-color: rgba(255, 255, 255, 0.108);
                padding: 0.5em 1em;
                border: 1px solid #ffffff16;
                border-radius: 2em;
            }
            .buttons {
                display: flex;
                gap: 2rem;
                button {
                    margin-top: 2rem;
                    padding: 0.7rem 2rem;
                    background-color: #191919;
                    border: none;
                    color: #fff;
                    cursor: pointer;
                    border-radius: 2rem;
                    font-weight: 700;
                    &:hover {
                        background-color: #212121;
                    }
                    &.secondary {
                        background-color: #fff;

                        color: #191919;
                        --bg: #ffffff;
                        &:hover {
                            background-color: #eeeeee;
                        }
                    }
                }
            }

            .lines {
                display: flex;
                height: 40vh;
                position: absolute;
                bottom: 0;
                gap: 40px;
                z-index: -1;
                div {
                    width: 1px;
                    background-color: rgba(255, 255, 255, 0.1);
                    position: relative;
                    --pos: 0%;
                    overflow: hidden;
                    &::after {
                        top: var(--pos);
                        width: 3px;
                        left: -0.5px;
                        content: "";
                        background-image: linear-gradient(
                            to top,
                            #679aff3e 0%,
                            #307cff1d var(--pos)
                        );
                        height: 30%;
                        position: absolute;
                        border-radius: 5px;
                        clip-path: polygon(0% 100%, 50% 0%, 50% 0%, 100% 100%);
                    }
                }
            }
        }
    }

    .section{
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: center;
    }

    .about {
       
        .logos {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3rem;

            :global(svg) {
                width: 30px;
                opacity: 0.4;
            }
        }
    }
</style>
