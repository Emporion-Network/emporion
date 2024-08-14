<script lang="ts">
    import { onMount } from "svelte";
    import ProductCreate from "./pages/product/ProductCreate.svelte";
    import { watchPrices, clean } from "./stores/coins";
    import Notifications from "./lib/Notifications.svelte";
    import Route from "./lib/Route.svelte";
    import Home from "./pages/home/Home.svelte";
    import ProductShow from "./pages/product/ProductShow.svelte";
    import ProductIndex from "./pages/product/ProductIndex.svelte";
    import Cart from "./lib/Cart.svelte";

    watchPrices()
    onMount(()=>{
        return clean
    })

</script>

<Route match="/">
 <Home></Home>
</Route>
<Route match="/create">
    <ProductCreate/>
</Route>
<Route match="/product">
    <ProductShow></ProductShow>
</Route>
<Route match="/products">
    <ProductIndex/>
</Route>
<Notifications/>
<Cart></Cart>
