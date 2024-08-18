<script lang="ts">
    export let min: number = 0;
    export let max: number = 10;
    export let step: number = 1;
    export let value: number = min;
    export let active = false
</script>

<div class="slider" class:active style="--p:{(value - min) / (max - min)}">
    <input type="range" {min} {max} {step} 
    bind:value 
    on:mousedown={()=>active = true} 
    on:mouseup={()=>active=false} 
    on:mouseleave={()=>active = false} />
    <button class="handle"></button>
</div>

<style lang="scss">
    .slider {
        position: relative;
        min-height: 10px;
        background-color: var(--gray-3);
        border-radius: 10px;
        border: 1px solid var(--gray-6);
        flex:1;
        &.active{
            cursor: grabbing;
        }

        &::before{
            content: "";
            width: calc(var(--p) * (100% - 10px));
            height: 100%;
            background-color: var(--indigo-10);
            border-radius: 20px;
            position: absolute;
            left: 0;
            top:0;
        }
        &:focus-within{
            .handle{
                outline: 2px solid var(--gray-12);
                outline-offset: 2px;
            }
        }
        .handle {
            width: 20px;
            height: 20px;
            background-color: var(--gray-5);
            border: none;
            border-radius: 20px;
            position: absolute;
            left: calc(var(--p) * (100% - 10px));
            top: 50%;
            transform: translate(calc(-1 * var(--p) * 50%), -50%);
            pointer-events: none;
            border: 1px solid var(--gray-7);
        }
        input {
            opacity: 0;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            cursor: inherit;
            cursor: pointer;
        }
    }
</style>
