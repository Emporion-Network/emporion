<script lang="ts">
    import type { Snippet } from 'svelte';

    let {
      opened = $bindable(),
      head,
      children,
    }: {
      opened: boolean
      children: Snippet
      head: Snippet<[boolean]>
    } = $props();

    const toggle = () => {
      opened = !opened;
    };
</script>

<div class="collapsable" class:opened>
    <button class="head" class:opened onclick={toggle}>
        {@render head(opened)}
        <i class="ri-arrow-down-s-line arrow"></i>
    </button>
    <div class="content" class:opened>
        {@render children()}
    </div>
</div>

<style lang="scss">
    .collapsable {
        display: flex;
        flex-direction: column;
        interpolate-size: allow-keywords;
    }
    :global(.collapsable:not(.collapsable + .collapsable)) {
        border-top: 1px solid var(--neutral-4);
    }
    :global(.collapsable.opened + .collapsable > .head) {
        border-top-color: var(--neutral-4);
    }
    .head {
        width: 100%;
        background-color: var(--neutral-2);
        outline: none;
        border: none;
        color: var(--neutral-12);
        display: flex;
        border-bottom: 1px solid var(--neutral-4);
        border-top: 1px solid transparent;
        padding: 0.5rem 1rem;
        justify-content: space-between;
        align-items: center;
        outline: none;
        cursor: pointer;
        position: relative;
        &:hover{
          background-color: var(--neutral-3);
        }

        i.arrow {
            display: block;
            transition: transform 200ms ease-in-out;
        }
        &.opened {
            i.arrow  {
                transform: rotate(-180deg);
            }
        }
    }
    .content {
        overflow: hidden;
        transition-property: height padding;
        transition-duration: 250ms;
        transition-timing-function: ease-in-out;
        --parent-bg: var(--neutral-1);
        background-color: var(--parent-bg);
        height: 0;
        &.opened {
            height: auto;
        }
    }
</style>
