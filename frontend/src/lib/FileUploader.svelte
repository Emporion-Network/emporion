<script lang="ts">
  import { type ChangeEventHandler } from "svelte/elements";
  import { type Snippet } from "svelte";
  import { getTranslator } from "@/stores/translate.svelte";
  const t = getTranslator();
  let {
    onchange,
    children,
  }: {
    children?: Snippet<[]>;
    onchange?: (files: File[]) => void;
  } = $props();

  let cls = $state("");

  let inputEl: HTMLInputElement;

  const change: ChangeEventHandler<HTMLInputElement> = (evt) => {
    const newfiles = Array.from(evt.currentTarget.files || []);
    evt.currentTarget.value = "";
    onchange?.(newfiles);
  };
  const ondrop = (e: DragEvent) => {
    e.preventDefault();
    let files = [...(e.dataTransfer?.files || [])];
    onchange?.(files);
  };
  const ondragover = (e: Event) => {
    e.preventDefault();
    cls = "dragover";
  };
  const ondragend = () => {
    cls = "";
  };
  const onclick = () => {
    inputEl.click();
  };
  const onkeydown = (e: KeyboardEvent) => {
    if (["Enter", " "].includes(e.key)) onclick();
  };
</script>

<div
  class="file-uploader {cls}"
  {ondrop}
  {ondragover}
  {ondragend}
  {onclick}
  {onkeydown}
  tabindex="0"
  role="button"
>
  <input
    bind:this={inputEl}
    onchange={change}
    type="file"
    multiple
    accept="image/*"
    tabindex="-1"
  />
  {#if children}
    {@render children?.()}
  {:else}
    <h2>{t.t("tame_giant_raven_wish")}</h2>
    <button class="button-secondary">{t.t("tasty_stale_insect_kick")}</button>
  {/if}
</div>

<style lang="scss">
  h2 {
    text-align: center;
  }
  .file-uploader {
    min-height: 160px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    border-radius: 2px;
    outline: none;
    position: relative;
    user-select: none;
    gap: 1rem;
    margin-top: 0.5rem;

    &:focus-visible,
    &.dragover {
      border: 1px solid var(--main-10);
    }
    input {
      opacity: 0;
      pointer-events: none;
      position: absolute;
    }
  }
</style>
