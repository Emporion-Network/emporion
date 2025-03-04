<script>
  import NavBar from "@/lib/NavBar.svelte";
  import Footer from "@/lib/Footer.svelte";
  import Route from "@/lib/Route.svelte";

  import Chat from "@/routes/Chat/Chat.svelte";
  import FilePicker from "@/lib/FilePicker.svelte";
  import Test from "@/routes/Test/Test.svelte";
  import Cart from "@/lib/Cart.svelte";
</script>

<Route path="/collection">
  {#await import("@/routes/CreateProduct/CreateUpdateCollection.svelte") then createUpdate}
    {@const CreateUpdate = createUpdate.default}
    <NavBar />
    <CreateUpdate />
  {/await}
</Route>

<Route path="/chat">
  <NavBar />
  <Chat />
</Route>

<Route path="/store">
  {#await import("@/routes/Store/Store.svelte") then store}
    {@const Store = store.default}
    <NavBar />
    <Store />
  {/await}
</Route>

<Route path="/product">
  {#await import("@/routes/Store/Preview.svelte") then product}
    {@const Product = product.default}
    <NavBar />
    <Product />
  {/await}
</Route>

<Route path="/staking">
  {#await import("@/routes/Staking/Stacking.svelte") then staking}
    {@const Stacking = staking.default}
    <NavBar />
    <Stacking />
  {/await}
</Route>

<Route path="/">
  {#await import("@/routes/Landing/Landing.svelte") then landing}
    {@const Landing = landing.default}
    <Landing />
  {/await}
</Route>

<Route path="/my-store">
  {#await import("@/routes/MyStore/MyStore.svelte") then mystore}
    {@const MyStore = mystore.default}
    <NavBar />
    <MyStore />
  {/await}
</Route>

<Route path="/test">
  <Test />
</Route>

<FilePicker />
<Footer />
<Cart />
