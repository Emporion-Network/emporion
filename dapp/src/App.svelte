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
    import UserShow from "./pages/user/UserShow.svelte";
    import { user } from "./stores/user";
    import { ENV } from "./utils";
    import Storybook from "./pages/storybook/Storybook.svelte";
    import Chat from "./pages/user/Chat.svelte";

    watchPrices();
    onMount(() => {
        return clean;
    });
</script>

<Route match="/">
    <Home></Home>
</Route>
<Route match="/product">
    <ProductShow></ProductShow>
</Route>
<Route match="/products">
    <ProductIndex />
</Route>
{#if $user}
    <Route match="/create">
        <ProductCreate />
    </Route>
    <Route match="/account">
        <UserShow />
    </Route>
    <Route match="/messages">
        <Chat/>
    </Route>
{/if}
{#if ENV.DEV}
    <Route match="/storybook">
        <Storybook/>
    </Route>
{/if}
<Notifications />
<Cart></Cart>
