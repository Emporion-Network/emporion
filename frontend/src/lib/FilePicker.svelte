<script lang="ts">
  import ButtonGroup from "@/lib/ButtonGroup.svelte";
  import FileUploader from "@/lib/FileUploader.svelte";
  import { user } from "@/stores/user.svelte";
  import type { FileMetaRes } from "@common";
  import TagInput from "./TagInput.svelte";
  import Input from "./Input.svelte";
  import Modal from "./Modal.svelte";
  import { onMount } from "svelte";
  let show: "gallery" | "upload" = $state("gallery");
  let isOpen = $state(false);
  let files: FileMetaRes[] = $state([]);
  let filter = $state("");
  let filtered = $derived.by(() => {
    return files.filter((f) => {
      return (
        f.name.toLocaleLowerCase().includes(filter.toLocaleLowerCase()) ||
        f.tags.some((t) => {
          return t.toLocaleLowerCase().includes(filter.toLocaleLowerCase());
        }) ||
        filter === ""
      );
    });
  });
  let selected: FileMetaRes | null = $state(null);
  $effect(() => {
    if (isOpen) {
      updateFiles();
    }
  });
  const diff = () => {
    let a = files.find((f) => f.path === selected?.path);
    let b = selected;
    return (
      a?.name == b?.name &&
      a?.tags.length == b?.tags.length &&
      a?.tags.every((t, i) => t == b?.tags[i])
    );
  };
  const update = async () => {
    if (!selected) return;
    if (diff()) return;
    await user.updateFileMeta(selected?.path.split("/")[1], {
      name: selected.name,
      tags: selected.tags,
    });
    let f = files.find((f) => f.path === selected?.path)!;
    f.name = selected.name;
    f.tags = selected.tags;
  };
  const onfile = (path: string | undefined) => {
    isOpen = false;
    selected = null;
    document.dispatchEvent(
      new CustomEvent("filepicked", {
        detail: path,
      }),
    );
  };

  let upload = async (files: File[]) => {
    const meta = files.map((f) => ({
      name: f.name.split(".").slice(0, -1).join("."),
      tags: [],
    }));
    await user.uploadFiles(files, meta);
    await updateFiles();
    show = "gallery";
  };
  const updateFiles = async () => {
    if (!user.address) return;
    let resp = await user.getFiles(user.address);
    if (!resp.error) {
      files = resp.result;
    }
  };

  onMount(() => {
    const handleFileEvent = () => {
      isOpen = true;
    };
    document.addEventListener("pickfile", handleFileEvent);
    return () => {
      document.removeEventListener("pickfile", handleFileEvent);
    };
  });
</script>

<Modal bind:open={isOpen} onclose={() => onfile(undefined)}>
  <div class="file-explorer">
    <div class="search-bar">
      <ButtonGroup options={["upload", "gallery"] as const} bind:value={show}>
        {#snippet optionRenderer(v)}
          {#if v === "upload"}
            <i class="ri-upload-2-line"></i>
          {:else}
            <i class="ri-gallery-view-2"></i>
          {/if}
          {v}
        {/snippet}
      </ButtonGroup>
      {#if show == "gallery"}
        <div class="search">
          <input placeholder="Search..." type="text" bind:value={filter} />
          {#if filter.length > 0}
            <button aria-label="clear search" onclick={() => (filter = "")}>
              <i class="ri-close-line"></i>
            </button>
          {:else}
            <button aria-label="search">
              <i class="ri-search-line"></i>
            </button>
          {/if}
        </div>
      {/if}
    </div>
    {#if show == "upload"}
      <FileUploader onchange={upload} />
    {:else}
      <div class="wpr">
        <div class="files">
          {#each filtered as file}
            <button
              class="file"
              class:selected={selected?.path === file.path}
              onclick={() => (selected = { ...file })}
            >
              <img src="{user.root}/files/{file.path}" alt={file.name} />
              <span>{file.name}</span>
            </button>
          {/each}
        </div>
        <div class="preview">
          {#if selected}
            <img src="{user.root}/files/{selected.path}" alt={selected.name} />
            <Input
              type="textarea"
              placeholder="Name"
              label="Name"
              bind:value={selected.name}
              onchange={update}
            />
            <TagInput label="Tags" bind:value={selected.tags} onchange={update}
            ></TagInput>
            <div class="buttons">
              <button
                class="primary-accent-button"
                disabled={!selected}
                onclick={() => onfile(`${user.root}/files/${selected!.path}`)}
                >Select</button
              >
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</Modal>

<style lang="scss">
  .file-explorer {
    display: flex;
    flex-direction: column;
    width: max-content;
    border-radius: 3px;
    overflow: hidden;
    border: 1px solid var(--neutral-6);
    width: 800px;
    height: calc(500px + 2.5rem);
    background-color: var(--neutral-2);
    .search-bar {
      display: flex;
      background-color: var(--neutral-3);
      justify-content: space-between;
      align-items: center;
      padding: 0 1rem;
      .search {
        display: flex;
        border: 1px solid var(--neutral-6);
        padding: 0.1rem 0rem 0.1rem 0.5rem;
        border-radius: 3px;
        &:hover {
          border-color: var(--neutral-10);
        }
        &:focus-within {
          border-color: var(--main-10);
          button {
            color: var(--neutral-12);
          }
        }
        input {
          color: var(--neutral-12);
        }
        button {
          color: var(--neutral-10);
          cursor: pointer;
        }
        button,
        input {
          border: none;
          outline: none;
          background-color: transparent;
        }
      }
    }
    .wpr {
      height: 500px;
      display: flex;
      border-top: 1px solid var(--neutral-6);
      background-color: var(--neutral-2);
      .preview {
        width: 300px;
        padding: 0.5rem;
        --parent-bg: var(--neutral-2);
        display: flex;
        flex-direction: column;
        gap: 1rem;
        img {
          height: 30%;
          width: 100%;
          object-fit: contain;
        }
        .buttons {
          display: flex;
          align-self: flex-end;
          margin-top: auto;
          gap: 1rem;
          padding: 0.5rem 0;
          button {
            height: auto;
          }
        }
        border-left: 1px solid var(--neutral-6);
      }
    }
    .files {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      align-items: start;
      align-content: start;
      gap: 0.5rem;
      overflow-y: auto;
      height: 500px;
      width: 500px;
      padding: 0.5rem;
      border-radius: 3px;
      .file {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 0.5rem;
        background-color: transparent;
        outline: none;
        border: 1px solid transparent;
        color: inherit;
        border-radius: 3px;
        &.selected {
          border-color: var(--main-8);
          background-color: var(--main-a1);
        }
        &:hover {
          background-color: var(--neutral-3);
          cursor: pointer;
        }
        span {
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2; /* number of lines to show */
          line-clamp: 2;
          -webkit-box-orient: vertical;
          text-align: center;
        }
        img {
          width: 50px;
          height: 50px;
          object-fit: contain;
        }
      }
    }
  }
</style>
