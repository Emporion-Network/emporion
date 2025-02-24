<script lang="ts">
    import { type Snippet, untrack } from 'svelte';
    import { wait } from './utils';
    let {
      targetEl = $bindable(),
      step = $bindable(),
      disabledNext,
      steps,
      help,
      ondone,
      point = $bindable(),
    }: {
      steps: {
        stepName: string
        in?: (prevStep: number, curStep: number) => void | Promise<void>
      }[]
      targetEl: HTMLElement | null
      point: (e: HTMLElement | null) => void
      step: number
      help: Snippet<[(typeof steps)[number]]>
      disabledNext: boolean
      ondone: () => void
    } = $props();

    let currStep = $derived(steps[step]);
    let currEl = $state(new DOMRect());
    let size = $state(new DOMRect());
    let visible = $state(true);
    let tutoEl: HTMLElement | undefined = $state();
    let contentEl: HTMLElement | undefined = $state();
    let pointerPos = $state({ x: -20, y: -20 });
    let click = $state(false);

    $effect(() => {
      size;
      targetEl;
      untrack(() => {
        setPosition();
      });
    });

    const setPosition = () => {
      if (!(targetEl && tutoEl)) {
        currEl = new DOMRect(0, 0, 0, -25);
        tutoEl?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        return;
      };
      let targetRect = targetEl?.getBoundingClientRect();
      let tutoRect = tutoEl?.getBoundingClientRect();

      targetEl.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      let x = targetRect.x - tutoRect.x;
      let y = targetRect.y - tutoRect.y;
      let w = targetRect.width;
      let h = targetRect.height;

      currEl = new DOMRect(x, y, w, h);
    };

    const close = () => {
      visible = false;
      ondone();
    };
    const next = async () => {
      let prevStep = step;
      step++;
      disabledNext = true;
      await currStep.in?.(prevStep, step);
      disabledNext = false;
    };

    point = async (e: HTMLElement | null) => {
      if (!e) {
        pointerPos = {
          x: -50,
          y: -50,
        };
        return;
      }
      if (!tutoEl) return;
      let tutoRect = tutoEl?.getBoundingClientRect();
      let targetRect = e?.getBoundingClientRect();
      let x = targetRect.x - tutoRect.x;
      let y = targetRect.y - tutoRect.y;
      pointerPos = {
        x: x + targetRect.width / 2,
        y: y + targetRect.height / 2,
      };
      await wait(200);
      click = true;
      await wait(200);
      click = false;
    };
</script>

{#if visible}
    <div
        class="tuto"
        style:--x="{currEl.x - 10}px"
        style:--y="{currEl.y - 10}px"
        style:--w="{currEl.width + 20}px"
        style:--h="{currEl.height + 20}px"
        bind:contentRect={size}
        bind:this={tutoEl}
    >
        <div class="wpr" class:hide={currEl.height <= 0}>
            <div class="help" bind:this={contentEl}>
                <button class="skip" onclick={close}> Skip tutorial </button>
                <div class="content">
                    {@render help(currStep)}
                </div>
                <div class="buttons">
                    {#if step < steps.length - 1}
                        <button onclick={next} disabled={disabledNext}>
                            Next <i class="ri-arrow-right-line"></i>
                        </button>
                    {:else}
                        <button class="done" onclick={close}>
                            Get started
                        </button>
                    {/if}
                </div>
            </div>
        </div>
        <div
            class="pointer"
            style:--x="{pointerPos.x}px"
            style:--y="{pointerPos.y}px"
            class:click
        ></div>
    </div>
{/if}

<style lang="scss">
    .tuto {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        &::before {
            content: "";
            background-color: var(--black-a9);
            // transition: all 200ms ease-in-out;
            clip-path: polygon(
                0% 0%,
                0% 100%,
                var(--x) 100%,
                var(--x) var(--y),
                calc(var(--x) + var(--w)) var(--y),
                calc(var(--x) + var(--w)) calc(var(--y) + var(--h)),
                var(--x) calc(var(--y) + var(--h)),
                var(--x) 100%,
                100% 100%,
                100% 0%
            );
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 1;
        }

        .pointer {
            width: 20px;
            height: 20px;
            border-radius: 20px;
            position: absolute;
            background-color: var(--main-a7);
            content: "";
            left: 20px;
            top: 20px;
            z-index: 2;
            transition: all 200ms ease-in-out;
            left: calc(var(--x) - 2px);
            top: calc(var(--y) - 2px);
            &.click {
                animation: click 200ms ease-in forwards;
            }
            @keyframes click {
                0% {
                    box-shadow: 0 0 0 0px var(--main-a10);
                    background-color: var(--main-a10);
                }
                100% {
                    box-shadow: 0 0 0 20px var(--main-a1);
                }
            }
        }

        .wpr {
            position: absolute;
            left: calc(var(--x) - 2px);
            top: calc(var(--y) - 2px);
            width: calc(var(--w) + 4px);
            height: calc(var(--h) + 4px);
            border: 1px solid var(--main-11);
            border-radius: 3px;
            transition: all 200ms ease-in-out;
            z-index: 1;
            &.hide{
                border: none;
                .help{
                    display: none;
                }
            }
            .help {
                position: absolute;
                top: 0%;
                left: 100%;
                width: 400px;
                margin-left: 1rem;
                padding: 1rem;
                background-color: var(--neutral-2);
                border-radius: 3px;
                border: 1px solid var(--neutral-6);
                display: flex;
                flex-direction: column;
                gap: 1rem;
                position: relative;
                padding-top: 1.5rem;
                .skip {
                    position: absolute;
                    background-color: transparent;
                    right: 0;
                    top: 0;
                    border: none;
                    color: var(--neutral-10);
                    padding: 0.5rem;
                    cursor: pointer;
                    &:hover {
                        color: var(--neutral-11);
                    }
                }
                .buttons {
                    display: flex;
                    gap: 1rem;
                    button {
                        background-color: var(--neutral-3);
                        border: 1px solid var(--neutral-6);
                        color: var(--neutral-12);
                        border-radius: 3px;
                        cursor: pointer;
                        outline: none;
                        &:hover {
                            background-color: var(--neutral-4);
                            border: 1px solid var(--neutral-7);
                        }
                        &.done {
                            background-color: var(--main-3);
                            border: 1px solid var(--main-6);
                            &:hover {
                                background-color: var(--main-4);
                                border: 1px solid var(--main-7);
                            }
                        }
                        &:disabled {
                            background-color: transparent;
                            border: 1px solid var(--neutral-6);
                            color: var(--neutral-6);
                            cursor: default;
                        }
                    }
                }
            }
        }
    }
</style>
