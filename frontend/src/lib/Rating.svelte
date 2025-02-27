<script lang="ts">
  import { getLocation } from "../stores/location.svelte";
  import { getTranslator } from "../stores/translate.svelte";
  import type { WithSkeleton } from "./utils";
  type Rating =
    | {
        type: "short";
        avg_rating: number;
        url?: string;
      }
    | {
        type: "long";
        avg_rating: number;
        nb_ratings: number;
        url?: string;
      }
    | {
        type: "editable";
        value?: number;
      };

  let { goTo } = getLocation();
  let t = getTranslator();
  let {
    // @ts-expect-error
    value = $bindable(),
    ...props
  }: WithSkeleton<Rating> = $props();

  const setValue = (v: number) => () => {
    value = v;
  };

  const handleRedirect = (url: string) => () => {
    goTo(url);
  };
</script>

{#if props.skeleton}
  <div class="rating skeleton">
    {#each { length: 5 } as _}
      <i class="ri-star-fill"></i>
    {/each}
  </div>
{:else}
  <div class="rating">
    {#if props.type == "editable"}
      {#each { length: 5 } as _, i}
        <button
          aria-label={`${i} ${t.t("less_sleek_nils_read")}`}
          onclick={setValue(i)}
        >
          <i class="ri-star-fill" class:selected={i <= value}></i>
        </button>
      {/each}
    {:else}
      <button
        aria-label={`${props.avg_rating}/5 ${t.t("less_sleek_nils_read")}`}
        onclick={() => props.url && handleRedirect(props.url)}
      >
        <div class="stars" style="--r:{(100 * props.avg_rating) / 5}%">
          {#each { length: 5 } as _, i}
            <i class="ri-star-fill" class:selected={i + 1 < props.avg_rating}
            ></i>
          {/each}
        </div>
        {#if props.type == "long"}
          <span class="small">
            {props.avg_rating}/5 ({props.nb_ratings}
            {t.t("fancy_known_peacock_pray")})
          </span>
        {/if}
      </button>
    {/if}
  </div>
{/if}

<style lang="scss">
  .rating {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: max-content;
    gap: 0.5rem;
    font-size: 1em;
    &.skeleton {
      background-clip: text;
      color: transparent;
    }
    button {
      background-color: transparent;
      color: inherit;
      border: none;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 0.5em;
    }
    .stars {
      display: flex;
      gap: 0.3em;
      color: transparent;
      background: linear-gradient(
        to right,
        var(--neutral-12) 0%,
        var(--neutral-12) var(--r),
        transparent var(--r)
      );
      -webkit-text-stroke-color: var(--neutral-12);
      -webkit-text-stroke-width: 1.5px;
      background-clip: text;
      -webkit-background-clip: text;
    }
    .small {
      font-size: 0.8em;
      font-weight: 600;
      color: var(--neutral-11);
    }
  }
</style>
