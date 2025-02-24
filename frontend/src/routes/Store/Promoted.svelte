<script lang="ts">
  import type { WithSkeleton } from '@/lib/utils';

  let props: WithSkeleton<{
    title: string
  }> = $props();
</script>

{#if props.skeleton}
  <div class="promoted skeleton">
    <div class="skeleton-title">
      <div class="skeleton"></div>
      <div class="skeleton"></div>
    </div>
    <button class="skeleton-button" aria-label={''}>
      <i class="ri-loader-4-line"></i>
    </button>
  </div>
{/if}

<style lang="scss">
  @use "../../mixins" as m;
  .promoted {
    width: 100%;
    grid-column: 1/-1;
    height: 360px;
    background-color: var(--neutral-2);
    border-radius: 3px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 1rem;
    gap: 1rem;
    .skeleton-title {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
      div {
        height: 2rem;
        width: 53%;
        background-color: var(--neutral-4);
        border-radius: 3px;
        &:nth-of-type(2) {
          width: 23%;
        }
      }
      @include m.media("<=phone") {
        div {
          width: 100%;
          &:nth-of-type(2) {
            width: 53%;
          }
        }
      }
    }
    .skeleton-button {
      width: 300px;
    }
  }
</style>
