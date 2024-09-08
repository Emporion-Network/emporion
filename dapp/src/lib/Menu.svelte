<script lang="ts">
    import { goTo, href } from "../stores/location";
    import Logo from "./Logo.svelte";
    import Wallet from "./Wallet.svelte";
    const link = new URL($href.href);
    link.pathname = `/products`;
    link.search = '';
</script>
<div class="menu">
    <div class="left">
        <button on:click|stopPropagation={goTo(link.href)}><Logo/></button>
    </div>
    <slot></slot>
    <Wallet></Wallet>
</div>

<style lang="scss">
    .menu {
       display: flex;
       justify-content: flex-end;
       width: 100%;
       padding: 2rem 5%;
       align-items: center;
       gap: 2rem;
       .left{
           margin-right: auto;
            button{
                background-color: transparent;
                border: none;
                cursor: pointer;
            }
       }
   }
</style>