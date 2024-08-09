<script lang="ts">
    import { onMount } from "svelte";
    import ProductCreate from "./pages/product/ProductCreate.svelte";
    import { watchPrices, clean } from "./stores/coins";
    import Notifications from "./lib/Notifications.svelte";
    import Route from "./lib/Route.svelte";
    import Home from "./pages/home/Home.svelte";
    import ProductShow from "./pages/product/ProductShow.svelte";

    watchPrices()
    onMount(()=>{
        return clean
    })

</script>

<Route match="/">
 <Home></Home>
</Route>
<Route match="/create">
    <ProductCreate></ProductCreate>
</Route>
<Route match="/product">
    <ProductShow></ProductShow>
</Route>
<Notifications></Notifications>
