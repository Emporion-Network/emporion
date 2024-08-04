<script lang="ts">
    export let value:string="";
    export let placeholder:string="";
</script>
<input bind:value placeholder="{placeholder}"/>

<style lang="scss">
    input{
        flex:1;
        background-color: var(--gray-2);
        font-size: 1rem;
        color: var(--gray-12);
        border: 1px solid var(--gray-6);
        border-radius: 3px;
        padding: 0.5rem;
        min-height: 3rem;
        &:hover{
            border-color: var(--gray-7);
        }
    }
</style>