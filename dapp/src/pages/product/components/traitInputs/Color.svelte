<script lang="ts">
    import type { FormEventHandler } from "svelte/elements";

    export let value="#eeeeeeff";
    let formated = value;
    let el:HTMLInputElement;

    const handleInput = (e:Parameters<FormEventHandler<HTMLInputElement>>[0])=>{
        let val = e.currentTarget.value;
        if(val.startsWith('#')){
            val = val.slice(1);
        }
        if(!val.match(/^#?[0-9a-f]*$/i)){
            e.currentTarget.value = formated;
            return;
        }
        if(!val.startsWith('#')){
            val = '#' + val;
        }
        if(val.length > 9){
            val = val.slice(0, 9)
        }
        formated = val.toLocaleLowerCase();
        e.currentTarget.value = formated;

        if(formated.length == 4){
            value = '#' + formated.slice(1).split('').map(e => e.repeat(2)).join('') + 'ff';
        } else if(formated.length == 7){
            value = formated + 'ff';
        } else if(formated.length == 9) {
            value =  formated;
        }
    }

    const handleOut = (e:FocusEvent)=>{
        if(formated.length == 4){
            el.value = '#' + formated.slice(1).split('').map(e => e.repeat(2)).join('') + 'ff';
        } else if(formated.length == 7){
            el.value = formated + 'ff';
        } else if(formated.length !== 9) {
            el.value = '#eeeeeeff';
        }
        value = el.value;
    }

</script>

<div class="input" style="--color:{value}" tabindex="0" role="textbox">
    <div class="color"></div>
    <input type="text" bind:this={el} on:input={handleInput} on:blur={handleOut} value="{formated}">
</div>

<style lang="scss">
    .input{
        display: flex;
        background-color: var(--gray-2);
        width: max-content;
        border: 1px solid var(--gray-6);
        border-radius: 3px;
        overflow: hidden;
        

        &:hover{
            border: 1px solid var(--gray-7);
            .color{
            border-right: 1px solid var(--gray-7);
            }
        }
        input{
            outline: none;
            border: none;
            background-color: transparent;
            color: var(--gray-12);
            padding-left: 1rem;
            width: 12ch;
        }
        .color{
            min-width: 3rem;
            min-height: 3rem;
            background-color: var(--color);
            border-right: 1px solid var(--gray-6);
        }
    }
</style>