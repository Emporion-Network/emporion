<script lang="ts">
    import Slider from "../../../lib/Slider.svelte";
    import { DAY, msToStr } from "../../../lib/utils";
    export let value = 7*DAY;
   
</script>

<div class="wpr">
    <Slider min={DAY} max={60*DAY} step={DAY} bind:value={value}></Slider>
    <span style="--p:{value/(60*DAY)}">{msToStr(value)}</span>
</div>

<style lang="scss">
    .wpr{
        display: flex;
        flex-direction: column;
        position: relative;
        margin-bottom: 2rem;
        span{
            align-self: flex-end;
            color: var(--gray-12);
            background-color: var(--gray-3);
            padding: 0 1rem;
            position: absolute;
            pointer-events: none;
            top:110%;
            left: calc(var(--p)  * 100%);
            transform: translate(-50%, 50%);
            min-width: max-content;
        }
    }
</style>