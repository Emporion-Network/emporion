<script lang="ts">
    import { trapFocus } from "../directives";
    let contentEl: HTMLElement;
    let isVisible = false;
    let text = '';
    let yes = ""
    let no = ""
    let res:(r:boolean) => void = ()=>{}
    export const alert = async (msg:string, nyes="Confirm", nno="Cancel")=>{
        text = msg;
        yes = nyes;
        no = nno;
        isVisible = true;
        return new Promise<boolean>((resolve)=>{
            res = (r:boolean)=>{
                resolve(r);
                isVisible = false;
            };
        })
    }
    const handleClickOutside = (e: MouseEvent) => {
        if (!e.target) return;
        let t = e.target as Node;
        if (contentEl.contains(t) || t === contentEl) {
            return;
        }
        isVisible = false;
    };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if isVisible}
    <div class="alert-modal" on:click={handleClickOutside} use:trapFocus>
        <div class="content" bind:this={contentEl}>
            <p>{text}</p>
            <div class="buttons">
                <button class="button-1" on:click={()=>res(true)}>{yes}</button>
                <button class="button-2" on:click={()=>res(false)}>{no}</button>
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    .alert-modal {
        background-color: var(--black-a4);
        color: var(--gray-12);
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 90;
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        outline: none;
        .content{
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap:1rem;
            width: 40%;
            height: 30%;
            padding: 1rem;
            background-color: var(--gray-1);
            border-radius: 5px;
            border: 1px solid var(--gray-3);
            position: relative;
            p{
                font-weight: bold;
            }
            .buttons{
                display: flex;
                gap:1rem;
            }
        }
    }
</style>