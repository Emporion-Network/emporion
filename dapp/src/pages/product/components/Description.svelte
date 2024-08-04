<script lang="ts">
    export let value:string="";
    export let placeholder="";
    export let rows=2;
</script>
<textarea bind:value rows="{rows}" placeholder="{placeholder}"></textarea>

<style lang="scss">
    textarea{
        resize: none;
        width: 100%;
        background-color: var(--gray-2);
        font-size: 1rem;
        color: var(--gray-12);
        border: 1px solid var(--gray-6);
        border-radius: 3px;
        padding: 0.5rem;
        font-weight: bold;
        &:hover{
            border-color: var(--gray-7);
        }
    }
</style>