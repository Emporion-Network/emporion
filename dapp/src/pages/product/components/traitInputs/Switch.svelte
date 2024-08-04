<script lang="ts">
    export let value:boolean=false;

    const toggle = ()=>{
        value = !value;
    }
</script>

<button class="toggle" class:on={value} on:click={toggle}></button>

<style lang="scss">
    .toggle{
        background-color: var(--gray-a6);
        height: 1.6rem;
        width: 3.2rem;
        border: none;
        border-radius: 2rem;
        position: relative;
        cursor: pointer;
        &::after{
            content: "";
            width: calc(1.6rem - 2px);
            height: calc(1.6rem - 2px);
            border-radius: 1.6rem;
            background-color: var(--gray-10);
            position: absolute;
            top: 1px;
            left: 1px;
            transition: all 100ms ease-in-out;
        }
        &.on{
            background-color: var(--gray-a8);
            &::after{
                background-color: var(--gray-12);
                left: 50%;
            }
        }
    }
</style>