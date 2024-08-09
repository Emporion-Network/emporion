<script lang="ts">
    export let swap: (dir: "up" | "down", e: HTMLElement) => Promise<boolean>;
    let top = 0;

    let element: HTMLElement;
    let moving = false;
    let previousTouch: Touch | null;
    let topH: null | number;
    let bottomH: null | number;

    const updateLimits = () => {
        if (element.previousElementSibling) {
            topH =
                element.previousElementSibling.getBoundingClientRect().height;
        } else {
            topH = null;
        }
        if (element.nextElementSibling) {
            bottomH = element.nextElementSibling.getBoundingClientRect().height;
        } else {
            bottomH = null;
        }
    };
    function onMouseDown(e:MouseEvent|TouchEvent) {
        moving = true;
        if ("touches" in e) {
            const touch = e.touches[0];
            previousTouch = touch;
        }
        updateLimits();
    }

    const onMouseMove = async (e:MouseEvent|TouchEvent & { movementX: number; movementY: number }) => {
        if (moving) {
            const dir = Math.sign(top + e.movementY);
            if (dir > 0 && bottomH === null) {
                top = 0;
                return;
            }
            if (dir < 0 && topH === null) {
                top = 0;
                return;
            }
            top += e.movementY;
            const limit = dir <= 0 ? topH : bottomH;
            if (limit && Math.abs(top) > limit) {
                let swaped;
                if (top > 0) {
                    swaped = await swap("down", element);
                } else {
                    swaped = await swap("up", element);
                }
                if (!swaped) {
                    moving = false;
                } else {
                    top = 0;
                    updateLimits();
                }
            }
        }
    };

    function touchMove(x: TouchEvent) {
        const e = x as TouchEvent & { movementX: number; movementY: number };
        const touch = e?.touches[0];
        if (previousTouch) {
            e.movementX = touch.pageX - previousTouch.pageX;
            e.movementY = touch.pageY - previousTouch.pageY;
            onMouseMove(e);
        }

        previousTouch = touch;
    }

    function onMouseUp() {
        if (moving) {
            moving = false;
            previousTouch = null;
            top = 0;
        }
    }
    function dragger(node: HTMLElement) {
        node.addEventListener("touchstart", onMouseDown, { passive: true });
        node.addEventListener("mousedown", onMouseDown, { passive: true });
        return {
            destroy: () => {
                node.removeEventListener("mousedown", onMouseDown);
                node.removeEventListener("touchstart", onMouseDown);
            },
        };
    }
</script>

<div class="draggable" class:moving bind:this={element} style="top: {top}px;">
    <slot {dragger} {moving} />
</div>

<svelte:window
    on:mouseup={onMouseUp}
    on:mousemove={onMouseMove}
    on:touchmove={touchMove}
    on:touchend={onMouseUp}
/>

<style lang="scss">
    .draggable {
        position: relative;
        &.moving {
            z-index: 99;
        }
    }
</style>
