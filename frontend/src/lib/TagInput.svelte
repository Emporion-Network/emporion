<script lang="ts">
  import { getTranslator } from "@/stores/translate.svelte";
  import { tick } from "svelte";
  const t = getTranslator();
  let {
    value = $bindable(),
    label,
    onchange = () => {},
  }: {
    label: string;
    value: string[];
    onchange?: () => void;
  } = $props();
  type Cursor = { value: string };
  type Tag = { text: string };
  let tags: (Tag | Cursor)[] = $state([
    ...value.map((e) => ({ text: e })),
    { value: "" },
  ]);
  let ignore = false;

  const splice = (...params: Parameters<(typeof tags)["splice"]>) => {
    ignore = true;
    tags.splice(...params);
    value = tags.filter((e) => "text" in e).map((e) => e.text);
    onchange();
    tick().then(() => {
      ignore = false;
    });
  };

  let cursorEl: HTMLInputElement = $state(null!);
  const focusCursor = async (n = 0) => {
    await tick();
    cursorEl.focus();
    cursorEl.selectionStart = n;
    cursorEl.selectionEnd = n;
  };
  const handleKeys = (e: KeyboardEvent) => {
    if (["Enter"].includes(e.key)) {
      let cursorIdx = tags.findIndex((v) => "value" in v);
      let cursor = tags[cursorIdx] as Cursor;
      if (cursor.value.trim() == "") return;
      let v = cursor.value.trim();
      cursor.value = "";
      splice(cursorIdx, 0, { text: v });
      e.preventDefault();
      focusCursor();
    }
    if (e.key == "ArrowLeft" && cursorEl.selectionStart == 0) {
      // Go left
      let cursorIdx = tags.findIndex((v) => "value" in v);
      if (cursorIdx === 0) return;
      let cursor = tags[cursorIdx] as Cursor;
      let prev = tags[cursorIdx - 1] as Tag;
      if (cursor.value.trim() == "") {
        splice(cursorIdx - 1, 2, { value: prev.text });
      } else {
        splice(
          cursorIdx - 1,
          2,
          { value: prev.text },
          { text: cursor.value.trim() },
        );
      }
      focusCursor(prev.text.length);
      e.preventDefault();
    }
    if (
      e.key == "ArrowRight" &&
      cursorEl.selectionStart == cursorEl.value.length
    ) {
      let cursorIdx = tags.findIndex((v) => "value" in v);
      if (cursorIdx == tags.length - 1) return;
      let cursor = tags[cursorIdx] as Cursor;
      let next = tags[cursorIdx + 1] as Tag;
      if (cursor.value.trim() == "") {
        splice(cursorIdx, 2, { value: next.text });
      } else {
        splice(
          cursorIdx,
          2,
          { text: cursor.value.trim() },
          { value: next.text },
        );
      }
      focusCursor(0);
      e.preventDefault();
    }
    if (e.key == "Backspace" && cursorEl.value.length == 0) {
      let cursorIdx = tags.findIndex((v) => "value" in v);
      if (cursorIdx == 0) return;
      splice(cursorIdx - 1, 1);
      focusCursor(0);
    }
  };
  const select = (tag: Tag) => (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let tagIdx = tags.indexOf(tag);
    let cursorIdx = tags.findIndex((e) => "value" in e);
    let cursor = tags[cursorIdx] as Cursor;
    if (cursor.value.trim() == "") {
      splice(cursorIdx, 1);
    } else {
      splice(cursorIdx, 1, { text: cursor.value });
    }
    splice(tagIdx, 1, { value: tag.text });
    let t = e.target as HTMLElement;
    const rect = t.getBoundingClientRect();
    const p = (e.clientX - rect.left) / rect.width;
    let char = Math.ceil(p * tag.text.length);
    focusCursor(char);
  };
  const removeTag = (tag: Tag) => () => {
    splice(tags.indexOf(tag), 1);
  };
  const handleFocusOut = async (e: FocusEvent) => {
    await tick();
    if (
      !e.currentTarget ||
      (e.currentTarget as HTMLElement).contains(document.activeElement)
    )
      return;
    let cursorIdx = tags.findIndex((e) => "value" in e);
    let cursor = tags[cursorIdx] as Cursor;
    if (cursor.value.trim() === "") {
      splice(cursorIdx, 1);
    } else {
      splice(cursorIdx, 1, { text: cursor.value.trim() });
    }
    splice(tags.length, 0, { value: "" });
  };

  $effect(() => {
    value;
    if (ignore) return;
    tags = [...value.map((e) => ({ text: e })), { value: "" }];
  });
</script>

<div
  class="tag-input {tags.length > 1 ? 'has-value' : ''}"
  onclick={(e) =>
    e.target === e.currentTarget &&
    document.activeElement != cursorEl &&
    focusCursor(cursorEl.value.length)}
  onkeypress={() => {}}
  onfocusout={handleFocusOut}
  role="textbox"
  tabindex="0"
>
  <div class="label">{label}</div>
  {#each tags as tag}
    {#if "value" in tag}
      <input
        type="text"
        class="cursor"
        bind:value={tag.value}
        bind:this={cursorEl}
        onkeydown={handleKeys}
        aria-labelledby={label}
      />
    {:else}
      <div class="tag">
        <span
          onclick={select(tag)}
          onkeydown={() => {}}
          role="button"
          tabindex="0"
          >{#each tag.text as char}
            <span>{char}</span>
          {/each}</span
        >
        <button onclick={removeTag(tag)} aria-labelledby="{t.t("aware_yummy_stingray_pause")}">
          <i class="ri-close-line"></i>
        </button>
      </div>
    {/if}
  {/each}
</div>

<style lang="scss">
  .tag-input {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
    border: 1px solid var(--neutral-6);
    border-radius: 3px;
    padding: 0.5rem;
    padding-top: 1rem;
    cursor: text;
    min-height: calc(var(--height-2) + 1rem);
    position: relative;
    .label {
      position: absolute;
      color: var(--neutral-10);
      top: 0%;
      transform: translateY(calc(50% + 0.25rem));
      background-color: var(--parent-bg);
      transition: all 200ms ease-in-out;
      transition:
        transform 100ms ease-in-out,
        top 100ms ease-in-out;
    }
    &.has-value {
      .label {
        transform: translateY(-50%) scale(0.8);
        top: 0;
      }
    }
    &:focus-within {
      .label {
        transform: translateY(-50%) scale(0.8);
        top: 0;
        color: var(--main-10);
      }
    }
    &:hover {
      border-color: var(--neutral-8);
    }
    &:focus-within {
      border-color: var(--main-10);
    }

    .cursor {
      field-sizing: content;
      outline: none;
      padding: 0;
      background-color: transparent;
      border: 0;
      color: var(--neutral-12);
    }
    .tag {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      border: none;
      padding: 0 0 0 0.7rem;
      background-color: var(--main-a3);
      border-radius: 1rem;
      min-width: 3rem;
      color: var(--neutral-12);
      gap: 0.1rem;
      button {
        border: none;
        background-color: transparent;
        border-radius: 1rem;
        aspect-ratio: 1/1;
        color: inherit;
        cursor: pointer;
        &:hover {
          background-color: var(--main-a4);
        }
      }
      &:hover {
        background-color: var(--main-a4);
      }
    }
  }
</style>
