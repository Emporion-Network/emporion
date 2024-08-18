<script lang="ts">
    import { onMount } from "svelte";
    import Atom from "../../../assets/Atom.svelte";
    import Osmo from "../../../assets/Osmo.svelte";
    import Axelar from "../../../assets/Axelar.svelte";
    import Dydx from "../../../assets/Dydx.svelte";
    import Neutron from "../../../assets/Neutron.svelte";
    import Nolus from "../../../assets/Nolus.svelte";
    import AnimatableNumber from "../../../lib/AnimatableNumber.svelte";
    import {
        aminateProp,
        fadeIn,
        fadeOut,
        inseries,
        onevent,
        scrollTo,
        together,
        wait,
    } from "../../../utils";
    import BuyerAnimationCell from "./BuyerAnimationCell.svelte";
    import AnimatableTitle from "../../../lib/AnimatableTitle.svelte";
    import { fancyBorder } from "../../../directives";
    import Vault from "../../../assets/Vault.svelte";

    let grid: HTMLElement;
    let picker: HTMLElement;
    let pickCoinButton: HTMLElement;
    let explore: HTMLElement;
    let pickCoin: HTMLElement;
    let riskSlider: HTMLElement;
    let priceEl: HTMLElement;
    let distribution: HTMLElement;
    let nextBtn: HTMLElement;
    let stepCount: HTMLElement;
    let distributionBtns:HTMLElement;

    let setNb: (n: number, t: number) => Promise<any>;
    let setNbBuyer: (n: number, t: number) => Promise<any>;
    let setNbSeller: (n: number, t: number) => Promise<any>;
    let setStep: (n: string, t: number) => Promise<void>;
    let toggleLock:()=>Promise<void>;
    let setLockValue:(v:number,d:number)=>Promise<void>
    const setL = (el: HTMLElement, from: number, to: number, d: number) =>
        aminateProp("--l", from, to, "%")(el, d);

    const animateEl = (e: HTMLElement, d = 500) => {
        return new Promise((resolve) => {
            let a = 0;
            e.classList.add("animate");
            let st: number;
            let sp = 0;
            let ed = Math.PI * 2;
            const animate = (s: number) => {
                if (!e) return;
                if (!st) st = s;
                let t = s - st;
                let pct = Math.min(t / d, 1);
                if (pct === 1) {
                    e.classList.remove("animate");
                    resolve(true);
                    return;
                }
                a = sp + ed * pct;
                let x = Math.cos(a);
                let y = Math.sin(a);
                e.style.setProperty(`--border-pos`, `${x * 100}% ${y * 100}%`);
                requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        });
    };
    const hover = async (e: HTMLElement, ms = 200) => {
        e.classList.add("hover");
        await wait(ms);
        e.classList.remove("hover");
    };

    const toggleHover = (e: HTMLElement) => {
        e.classList.toggle("hover");
    };

    const toggleOpacity = (e:HTMLElement)=>{
        if(e.style.getPropertyValue("opacity")){
            e.style.removeProperty("opacity")
        } else {
            e.style.setProperty("opacity", "1")
        }
    }

    const setNbStep = (nb: number) => {
        let s = Array.from(stepCount.children) as HTMLElement[];
        s.forEach((e) => e.classList.remove("active"));
        s[nb].classList.add("active");
    };

    const animateExplore = async () => {
        const c = Array.from(grid.children) as HTMLElement[];
        setNbStep(0);
        await fadeIn(explore, 500);
        await together(
            inseries(async () => {
                await hover(c[0]);
                await hover(c[1]);
                await hover(c[2]);
                await hover(c[3]);
                await hover(c[4]);
                await hover(c[5]);
                await hover(c[6], 300);
            }),
            setStep(
                `Choose amongst a large selection of products, and sellers. And use your favorite coins for secure payements`,
                800,
            ),
        );
        await onevent(nextBtn, "click");
        setNbStep(1);
        await together(
            inseries(async () => {
                await scrollTo(c[7], 400, "top", -3);
                await hover(c[7]);
                await hover(c[8]);
                await hover(c[9]);
                await hover(c[10]);
                await hover(c[8], 500);
                await hover(c[7], 500);
            }),
            setStep(
                `All reviews are stored on the blockchain, for an unbiased feedbacks`,
                800,
            ),
        );
        await onevent(nextBtn, "click");
        setNbStep(2);
        await animateEl(c[7]);
        await fadeOut(explore, 200);
    };
    const animatePicker = async () => {
        const c = Array.from(picker.children) as HTMLElement[];
        const sliderHandl = riskSlider.children[0] as HTMLElement;
        setStep("", 0);
        await setNb(1.59, 0);
        await fadeIn(pickCoin, 500);

        toggleHover(sliderHandl);
        await together(
            inseries(async () => {
                await together(
                    setL(riskSlider, 50, 73, 500),
                    setNbBuyer(73, 500),
                    setNbSeller(27, 500),
                );
                await onevent(nextBtn, "click");
                setNbStep(3);
            }),
            setStep(
                `Select a faire amount of risk you are willing to incure`,
                500,
            ),
        );
        await together(
            inseries(async () => {
                await together(
                    setL(riskSlider, 70, 23, 500),
                    setNbBuyer(23, 500),
                    setNbSeller(77, 500),
                );
                await wait(500);
                await together(
                    setL(riskSlider, 23, 50, 200),
                    setNbBuyer(50, 200),
                    setNbSeller(50, 200),
                );
                await onevent(nextBtn, "click");
                setNbStep(4);
            }),
            setStep(
                `This will be the amount each of you and the seller wold get in case of a dispute`,
                500,
            ),
        );
        toggleHover(sliderHandl);
        toggleHover(priceEl);
        await setStep(
            `Pick form the list of available crypto curencies you want to use for the payement`,
            500,
        );

        await together(setNb(19.94, 200), scrollTo(c[1], 200));

        await wait(200);

        await together(setNb(14.53, 200), scrollTo(c[2], 200));

        await wait(200);

        await together(setNb(7.49, 200), scrollTo(c[3], 200));

        await wait(200);
        await onevent(nextBtn, "click");
        setNbStep(5);

        await together(setNb(20.94, 200), scrollTo(c[4], 200));

        await wait(200);

        await together(setNb(1.59, 200), scrollTo(c[0], 200));

        toggleHover(priceEl);
        await hover(pickCoinButton, 200);
        await animateEl(pickCoinButton, 500);
        await fadeOut(pickCoin, 200);
    };
    const animateVault = async () => {
        setStep(``, 0);
        setLockValue(0, 0);
        await fadeIn(distribution, 500);
        setLockValue(7, 500);
        setStep(`Your assets are sent to a secure vault`, 1000)
        await onevent(nextBtn, 'click');
        setStep(`You can can top up your order with different coins`, 1000)
        await setLockValue(26, 800);
        await onevent(nextBtn, 'click');
        setStep(`The assets will only be available to the seller once you confirm the transaction`, 1000)
        await toggleLock();
        toggleOpacity(distributionBtns);
        await onevent(nextBtn, 'click');
        await together(
            toggleLock(),
            setLockValue(0, 700),
        )


    };
    onMount(async () => {
        await animateExplore();
        await animatePicker();
        await animateVault();
    });
</script>

<div class="container">
    <div class="animation">
        <div class="explore" bind:this={explore}>
            <div class="grid" bind:this={grid}>
                {#each { length: 20 } as _}
                    <BuyerAnimationCell></BuyerAnimationCell>
                {/each}
            </div>
        </div>
        <div class="pick-coin" bind:this={pickCoin}>
            <div class="risk">
                <div class="buyer">
                    <AnimatableNumber bind:set={setNbBuyer}></AnimatableNumber>
                    %
                </div>
                <div class="slider hover" bind:this={riskSlider}>
                    <div class="value"></div>
                </div>
                <div class="seller">
                    <AnimatableNumber bind:set={setNbSeller}></AnimatableNumber>
                    %
                </div>
            </div>
            <div class="wpr">
                <div class="price" bind:this={priceEl}>
                    <AnimatableNumber bind:set={setNb}></AnimatableNumber>
                    <div class="picker" bind:this={picker}>
                        <Atom></Atom>
                        <Osmo></Osmo>
                        <Axelar></Axelar>
                        <Dydx></Dydx>
                        <Neutron></Neutron>
                        <Nolus></Nolus>
                    </div>
                </div>
                <div bind:this={pickCoinButton} class="button fancy-border">
                    Proceed
                </div>
            </div>
        </div>
        <div class="distribution" bind:this={distribution}>
            <Vault bind:toggleLock={toggleLock} bind:setValue={setLockValue}></Vault>
            <div class="btns" bind:this={distributionBtns}>
                <button>Approve Order</button>
                <button>Dispute Order</button>
            </div>
        </div>
    </div>
    <div class="steps">
        <AnimatableTitle bind:set={setStep}></AnimatableTitle>
        <div class="controls">
            <div class="step-count" bind:this={stepCount}>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <button
                class="next-checkpoint fancy-border"
                use:fancyBorder
                bind:this={nextBtn}>Got it</button
            >
        </div>
    </div>
</div>

<style lang="scss">
    .container {
        padding: 0 5%;
        width: 100%;
        display: flex;
        align-items: center;
        .steps {
            width: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            height: 50vh;
            position: relative;

            .controls {
                display: flex;
                position: absolute;
                width: 100%;
                display: flex;
                bottom: 0;
                align-items: center;
                justify-content: flex-end;
                bottom: 0;
                .next-checkpoint {
                    padding: 0.7rem 2rem;
                    background-color: transparent;
                    --bd: #83a8ff;
                    --bg: #1f1f1f;
                    cursor: pointer;
                    border: none;
                    color: #fff;
                }
                .step-count {
                    position: absolute;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 2px;
                    margin-left: auto;
                    margin-right: auto;
                    :global(.active) {
                        background-color: #ffffff;
                    }
                    div {
                        width: 6px;
                        height: 6px;
                        border-radius: 6px;
                        background-color: #ffffff2b;
                    }
                }
            }
            :global(.title) {
                max-width: 90%;
                text-align: center;
                min-height: 1rem;
            }
        }
    }
    .animation {
        height: 50vh;
        width: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        .explore {
            opacity: var(--opacity, 0);
            display: flex;
            flex-direction: column;
            gap: 1rem;
            max-height: 100%;
            width: 100%;
            .grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                flex: 1;
                overflow: hidden;
                gap: 1rem;
                width: 100%;
                padding: 1px;
                position: relative;
                :global(.animate) {
                    --bg: #151515;
                    --border-size: 100%;
                }
                :global(.hover) {
                    --bg: #151515;
                }
            }
            &::after {
                content: "";
                width: 100%;
                z-index: 1;
                position: absolute;
                bottom: 0;
                left: 0;
                height: 10%;
                background-image: linear-gradient(to bottom, #00000000, #000);
            }
        }
        .pick-coin {
            opacity: var(--opacity, 0);

            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            gap: 1rem;
            :global(.hover) {
                --bg: #151515;
            }
            :global(.animate) {
                --bg: #151515;
                --border-size: 100%;
            }

            .wpr {
                display: flex;
                gap: 2rem;
            }

            .risk {
                height: 30px;
                width: 70%;
                --h: 1rem;
                --fs: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                .buyer,
                .seller {
                    display: flex;
                    color: #ffffff;
                    justify-content: center;
                    align-items: center;
                }
                .slider {
                    --l: 50%;
                    flex: 1;
                    height: 7px;
                    background-image: linear-gradient(
                        to left,
                        #ff6969,
                        #91ff6f,
                        #ff6969
                    );
                    border-radius: 7px;
                    position: relative;
                    :global(.hover) {
                        border: 2px solid #83a8ff !important;
                    }
                    .value {
                        position: absolute;
                        left: var(--l);
                        top: -4px;
                        width: 16px;
                        height: 16px;
                        background-color: #ffffff;
                        border-radius: 16px;
                        border: 2px solid #000000;
                    }
                }
            }

            :global(.price.hover) {
                border: 1px solid #83a8ff;
            }
            :global(.price.hover > .picker) {
                border-left: 1px solid #83a8ff;
            }

            .price {
                display: flex;
                justify-content: center;
                align-items: center;
                border: 1px solid #ffffffa5;
                max-width: max-content;
                border-radius: 5px;
                gap: 1rem;
                padding-left: 0.5rem;
                --h: 50px;
                --fs: 48px;

                :global(.number) {
                    justify-content: end;
                    width: 160px;
                }
                :global(svg) {
                    max-width: 50px;
                    min-height: 50px;
                    padding: 0.5rem;
                }
                .picker {
                    max-height: 50px;
                    gap: 1rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: center;
                    overflow: hidden;
                    border-left: 1px solid #ffffffa5;
                }
            }
            .button {
                font-size: 25px;
                padding: 0.7rem 3rem;
                color: #ffffff;
                --bd: #83a8ff;
                border-radius: 5px;
                --border-radius: 5px;
                align-self: center;
            }
        }

        .distribution {
            opacity: var(--opacity, 0);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            gap:1rem;
            .btns{
                opacity: 0;
                display: flex;
            }
        }

        & > div {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
    }
</style>
