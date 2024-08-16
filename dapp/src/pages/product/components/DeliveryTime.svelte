<script lang="ts" context="module">
    export const DAY = 86400;
</script>
<script lang="ts">
    import Slider from "../../../lib/Slider.svelte";
    export let value = 7*DAY;
    const s = (n:number)=> n > 1 ? "s" :"";
    const toStr = (t:number)=>{
        const days = t/DAY;
        if(days % 7 == 0){
            const weeks = days/7
            return `${weeks} week${s(weeks)}`
        }
        if(days % 30 == 0){
            const monts = days/30
            return `${monts} month${s(monts)}`
        }
        return `${days} day${s(days)}`
    }
</script>

<div class="wpr">
    <Slider min={DAY} max={60*DAY} step={DAY} bind:value={value}></Slider>
    <span style="--p:{value/(60*DAY)}">{toStr(value)}</span>
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