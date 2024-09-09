<script lang="ts">
    export let rating:[number, number, number, number, number, number];
    export let small = false;
    export let showTotal = true;
    let [avg, totalRatings] = rating.reduce((acc, c, i) => {
        acc[0] += c*i;
        acc[1] += c;
        return acc;
    }, [0, 0] as [number, number]);
</script>
<div class="rating">
    <div class="stars" style="--p:{small ? 100 : 100*avg/5}%">
        <i class="ri-star-fill"></i>
        {#if !small}
        <i class="ri-star-fill"></i>
        <i class="ri-star-fill"></i>
        <i class="ri-star-fill"></i>
        <i class="ri-star-fill"></i>
        {/if}
    </div>
    {#if showTotal}
    <button class="button-link-2">{totalRatings} ratings</button>
    {/if}
</div>


<style lang="scss">
    .rating{
        display: flex;
        gap:0.5rem;
    }
    .stars{
        background-clip: text;
        color: transparent;
        background-image: linear-gradient(to right, var(--orange-10) var(--p), var(--gray-9) var(--p));
        display: flex;
        width: max-content;
    }
</style>