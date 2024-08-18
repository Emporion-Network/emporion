<script lang="ts">
    import Slider from "./Slider.svelte";
    import Tooltip from "./Tooltip.svelte";
    export let value = 50;
</script>

<div class="container">
    <div class="label">
        <Tooltip
            text="In the event of a dispute, you will receive {value}% of the product's price."
        >
            <i class="ri-information-line"></i>
        </Tooltip>
        Risk share
    </div>
    <div class="wpr">
        <Slider min={0} max={100} step={1} bind:value></Slider>
        <span style="--p:{value}%">{value}%</span>
    </div>
    <p>
        Please set a reasonable Risk Share percentage to increase the likelihood
        that the seller will accept your order. An excessively high Risk Share
        might affect the seller's willingness to proceed.
    </p>
</div>

<style lang="scss">
    .container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
        margin-bottom: 2rem;
        p {
            color: var(--orange-12);
            background-color: var(--orange-a2);
            padding: 0.5rem 1rem;
            border-radius: 5px;
            border: 1px solid var(--orange-7);
        }
    }
    .wpr {
        display: flex;
        flex: 1;
        position: relative;
        width: 100%;
        margin-bottom: 1.2rem;
        span {
            position: absolute;
            top: 100%;
            left: calc(var(--p) + 6px);
            transform: translate(-50%, 20%);
        }
        
    }
</style>
