<script lang="ts">
    import { onMount } from "svelte";
    import ProductCreate from "./pages/product/ProductCreate.svelte";
    import { watchPrices, clean } from "./stores/coins";
    import Notifications from "./lib/Notifications.svelte";
    watchPrices()
    onMount(()=>{
        return clean
    })
</script>

<ProductCreate></ProductCreate>
<Notifications></Notifications>

