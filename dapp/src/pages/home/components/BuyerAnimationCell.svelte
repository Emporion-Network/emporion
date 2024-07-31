<script lang="ts">
    let s = Math.random() * 3 + 2;
    let ps = Math.floor(Math.random()*3);
</script>

<div class="fancy-border">
    <div class="img"></div>
    <div class="stars">
        {#each { length: 5 } as _, i}
            {#if s >= i}
                <i class="ri-star-s-fill"></i>
            {:else}
                <i class="ri-star-s-line"></i>
            {/if}
        {/each}
    </div>
    <div class="p">
        <div></div>
        {#each { length: ps } as _}
            <div></div>
        {/each}
    </div>
</div>

<style lang="scss">
    .fancy-border {
        background-color: #ffffff10;
        aspect-ratio: 1;
        border-radius: 5px;
        --border-radius: 5px;
        --bd: #83a8ff;
        display: flex;
        flex-direction: column;
        padding: 1rem;
        gap: 2px;
        .img {
            width: 100%;
            height: 70%;
            background-color: #ffffff10;
            border-radius: 2px;
        }
        .stars {
            display: flex;
            color: #ffffff10;
            font-size: small;
            flex-wrap: wrap;
        }
        .p {
            display: flex;
            flex-direction: column;
            gap: 5px;
            div {
                height: 6px;
                background-color: #ffffff10;
                &:first-of-type {
                    width: 70%;
                    height: 6px;
                }
            }
        }
    }
</style>
