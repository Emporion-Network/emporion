<script lang="ts">
    export let rating:[rating:number, totalRatings:number];
    let [avg, totalRatings] = rating;
</script>
<div class="rating">
    <div class="stars" style="--p:{100*avg/5}%">
        <i class="ri-star-fill"></i>
        <i class="ri-star-fill"></i>
        <i class="ri-star-fill"></i>
        <i class="ri-star-fill"></i>
        <i class="ri-star-fill"></i>
    </div>
    <button class="button-link-2">{totalRatings} ratings</button>
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