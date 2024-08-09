<script lang="ts">
    import Logo from "./Logo.svelte";
    import Wallet from "./Wallet.svelte";
</script>
<div class="menu">
    <div class="left">
        <Logo></Logo>
    </div>
    <Wallet></Wallet>
</div>

<style lang="scss">
    .menu {
       display: flex;
       justify-content: flex-end;
       width: 100%;
       padding: 2rem 5%;
       align-items: center;
       .left{
           margin-right: auto;
       }
   }
</style>