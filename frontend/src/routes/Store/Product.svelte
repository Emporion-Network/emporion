<script lang="ts">
    import Rating from '@/lib/Rating.svelte';
    import type { WithSkeleton } from '@/lib/utils';

    let props: WithSkeleton<{
      skeleton?: false
      title: string
    }> = $props();
</script>

<div class="product">
    {#if props.skeleton}
        <div class="skeleton-img skeleton"></div>
        <div class="info">
            <div class="skeleton-title">
                <div class="skeleton"></div>
                <div class="skeleton"></div>
            </div>
            <Rating skeleton />
            <button class="skeleton-button" aria-label="{''}">
                <i class="ri-loader-4-line"></i>
            </button>
        </div>
    {/if}
</div>

<style lang="scss">
    .product {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--neutral-6);
        border-radius: 5px;
        overflow: hidden;
        .skeleton-img {
            width: 100%;
            aspect-ratio: 1/1;
            background-color: var(--neutral-2);
        }
        .skeleton-title {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            div {
                min-height: 1.3rem;
                margin-bottom: 0.5rem;
                border-radius: 3px;
                &:nth-of-type(2) {
                    width: 63%;
                }
            }
        }
        .info {
            display: flex;
            flex-direction: column;
            width: 100%;
            background-color: var(--neutral-3);
            padding: 1rem;
            gap: 0.5rem;
        }
    }
</style>
