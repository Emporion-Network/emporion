<script lang="ts">
    import { onMount } from "svelte";
    import ProductCreate from "./pages/product/ProductCreate.svelte";
    import { watchPrices, clean } from "./stores/coins";
    import Notifications from "./lib/Notifications.svelte";
    import Wallet from "./lib/Wallet.svelte";
    import Logo from "./lib/Logo.svelte";
    watchPrices()
    onMount(()=>{
        return clean
    })
</script>

<div class="menu">
    <div class="left">
        <Logo></Logo>
    </div>
    <Wallet></Wallet>
</div>
<ProductCreate></ProductCreate>
<Notifications></Notifications>

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