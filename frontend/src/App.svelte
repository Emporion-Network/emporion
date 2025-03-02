<script>
  import NavBar from "@/lib/NavBar.svelte";
  import Footer from "@/lib/Footer.svelte";
  import Route from "@/lib/Route.svelte";

  import Chat from "@/routes/Chat/Chat.svelte";
  import CreateUpdateCollection from "@/routes/CreateProduct/CreateUpdateCollection.svelte";
  import Store from "@/routes/Store/Store.svelte";
  import Staking from "@/routes/Staking/Stacking.svelte";
  import FilePicker from "@/lib/FilePicker.svelte";
  import Test from "@/routes/Test/Test.svelte";
  import MyStore from "@/routes/MyStore/MyStore.svelte";
  import Landing from "./routes/Landing/Landing.svelte";
  import Cart from "./lib/Cart.svelte";
  import Preview from "./routes/Store/Preview.svelte";
</script>

<Route path="/collection">
  <NavBar></NavBar>
  <CreateUpdateCollection />
</Route>

<Route path="/chat">
  <NavBar></NavBar>
  <Chat />
</Route>

<Route path="/store">
  <NavBar></NavBar>
  <Store />
</Route>

<Route path="/product">
  <NavBar></NavBar>
  <Preview />
</Route>

<Route path="/staking">
  <NavBar></NavBar>
  <Staking />
</Route>

<Route path="/">
  <Landing />
</Route>

<Route path="/test">
  <Test />
</Route>

<Route path="/my-store">
  <NavBar></NavBar>
  <MyStore />
</Route>

<FilePicker />
<Footer />
<Cart />
