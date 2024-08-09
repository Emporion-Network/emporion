<script lang="ts">
    import { tick } from "svelte";
    export let onSwap:(idxA:number, idxB:number)=>void;

    const swap = async (dir:"up"|"down", e:HTMLElement)=>{
        if(dir === "up"){
            if(e.previousElementSibling){
                const idx = Array.from(e.parentNode?.children||[]).indexOf(e);
                onSwap(idx, idx - 1);
                await tick();
                return true;
            }
        } else {
            if(e.nextElementSibling){
                const idx = Array.from(e.parentNode?.children||[]).indexOf(e);
                onSwap(idx, idx + 1);
                await tick();
                return true;
            }
        }
        return false;
    }
</script>
<div class="drag">
    <slot {swap}></slot>
</div>

<style lang="scss">
    .drag{
        position: relative;
    }
</style>