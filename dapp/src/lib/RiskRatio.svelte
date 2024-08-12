<script lang="ts">
    import Slider from "./Slider.svelte";
    import Tooltip from "./Tooltip.svelte";
    export let value = 50;
</script>

<div class="container">
    <div class="wpr">
        <Slider min={0} max={100} step={1} bind:value={value}></Slider>
        <span style="--p:{value}%">{value}%</span>
    </div>
    <Tooltip text="{value}% is how much of the price you would get in case of a dispute">
        <i class="ri-information-line"></i>
    </Tooltip>
</div>


<style lang="scss">
    .container{
        display: flex;
        gap:1rem;
        align-items: center;
        margin-top: 2rem;
    }
    .wpr{
        display: flex;
        flex:1;
        position: relative;
        span{
            position: absolute;
            top:-100%;
            left: var(--p);
            transform: translate(-50%, -100%);
        }
    }
</style>