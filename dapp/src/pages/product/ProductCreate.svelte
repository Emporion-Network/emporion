<script lang="ts">
    import Wallet from "../../lib/Wallet.svelte";
    import { user } from "../../stores/user";
    import {notification} from "../../lib/Notifications.svelte"


    const create = async()=>{
        let r = await $user?.emporionClient.createProduct({
            deliveryTime:{
                time:123456,
            },
            meta:"",
            price:[],
            isListed:true,
        });

        console.log(r);
    }

    const notifiy = ()=>{
        notification({
            text:"Tx success:",
            type:'error',
            // url:"https://www.mintscan.io/dydx/tx/5C183F671DE0BD3F46E905D4478141D49BABDB4DE347E293E3518CC0FC86BF74",
            // urlLabel:"5C183F671DE0BD3F46E905D4478141D49BABDB4DE347E293E3518CC0FC86BF74",
        })
    }
</script>
<div class="menu">
    <Wallet></Wallet>
</div>

<button on:click={notifiy}>Create Product</button>

<style lang="scss">
    .menu{
        display: flex;
        justify-content: flex-end;
        width: 100%;
        padding: 2rem 5%;
    }
</style>