<script lang="ts">
    import type { OrderMetaData, SoketMessageRecieve } from "../../../../shared-types";
    import Menu from "../../lib/Menu.svelte";
    import SearchBar from "../../lib/SearchBar.svelte";
    import { href } from "../../stores/location";
    import { api, user } from "../../stores/user";
    import { dateToString } from "../../utils";
    
    const {
        VITE_ENDPOINT_BACK_END_API: ENDPOINT_BACK_END_API,
    } = import.meta.env;

    const wsHref = new URL(ENDPOINT_BACK_END_API);
    const ws = new WebSocket(`ws://${wsHref.host}/ws`);
    let messages: OrderMetaData["messages"] = [];
    let isBuyer = false;
    let orderId = $href.searchParams.get('order_id');
    let message = '';
    let rows = 1;
    $:rows = Math.min(message.split('\n').length, 10);

    $:orderId, (async ()=>{
        let o = await $user?.emporionClient.order({order_id:Number(orderId)})
        isBuyer = o?.buyer === $user?.address
    })()

    document.addEventListener('soket-message', (event)=>{
        //@ts-ignore
        const message:SoketMessageRecieve = event.detail;
        if(orderId === message.orderId){
            messages.push(message.message)
            messages = messages;
        }
    })
    
    const sendMessage = ()=>{
        if(message == '') return;
        ws.send(JSON.stringify({
                text:message,
                orderId:orderId,
                media:[],
                jwt:api.getToken(),
            }))
            messages.push({
                text:message,
                media:[],
                isBuyer,
                date:Date.now(),
            })
            messages = messages;
            message = '';
    }
    const handleEnter = (e:KeyboardEvent)=>{
        if(e.key === 'Enter' && !e.shiftKey){
            e.preventDefault();
            sendMessage()
        }
    }


    const groupByDay = (m:typeof messages)=>{
        const map = new Map<number, typeof messages>();
        m.forEach(msg => {
            const idx = Math.floor(msg.date/(24*3600000));
            if(!map.has(idx)){
                map.set(idx, []);
            }
            map.get(idx)!.push(msg);
        });
        return map;
    }

    const prettyDate = (t:number)=>{
        let d = new Date(t);
        if(t - Date.now() < 24*3600000){
            return `Today`
        }
        if(t - Date.now() < 2*24*3600000){
            return `Yesterday`
        }
        return dateToString(d);
    }

</script>

<Menu>
    <SearchBar></SearchBar>
</Menu>
<div class="chat">
    <div class="head">
        <h2>Order #{orderId}</h2>
    </div>
    <div class="messages">
        {#each groupByDay(messages).values() as group}
            {@const date = group[0].date}
            <div class="date">{prettyDate(date)}</div>
            {#each group as message}
                <div class="message" class:me={message.isBuyer === isBuyer}>
                    <div class="images">
                        {#if message.media.length > 0}
                            {#each message.media as img}
                                <img src={img} alt="" />
                            {/each}
                        {/if}
                    </div>
                    <p>{message.text}</p>
                    <svg width="357" height="222" viewBox="0 0 357 222" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M144.126 128.07C173.695 94.8161 184.186 0.098877 184.186 0.098877L356.668 0.0996094V194.895H212.006C212.006 194.895 169.407 221.544 112.968 221.544C69.6318 221.544 0.655247 173.381 0.655247 173.381C0.655247 173.381 96.8547 181.231 144.126 128.07Z" fill="#D9D9D9"/>
                    </svg>
                </div>
            {/each}
        {/each}
    </div>
    <div class="input">
        <textarea {rows} bind:value={message} on:keydown={handleEnter}></textarea>
        <button class="attach-files">
            <i class="ri-attachment-2"></i>
        </button>
        <button class="send" on:click={sendMessage}>
            <i class="ri-send-plane-2-line"></i>
        </button>
    </div>
</div>

<style lang="scss">
    .chat{
        color: var(--gray-12);
        display: flex;
        flex-direction: column;
        width: 100%;
        flex:1;
        padding: 0 5%;
        .head{
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--gray-6);
            padding: 1rem;
        }
        .messages{
            flex-grow: 1;
            flex-basis:0;
            overflow-y: auto;
            max-height: min-content;
            padding: 1rem;
            gap:1rem;
            display: flex;
            flex-direction: column;
            .date{
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 2rem;
                color: var(--gray-7);
                &::after,
                &::before{
                    height: 1px;
                    background-color: var(--gray-3);
                    flex:1;
                    content: "";
                }
            }
        }
        .message{
            background-color: var(--indigo-10);
            color: var(--white-a12);
            width: max-content;
            max-width: 60%;
            padding: 1rem;
            align-self: flex-end;
            border-radius: 1rem;
            position: relative;
            svg{
                width: 2rem;
                height: 2rem;
                position: absolute;
                right: -15px;
                bottom: -8px;
                transform: scaleX(-1);
                path{
                    fill: var(--indigo-10);
                }
            }
            &.me{
                align-self: flex-start;
                background-color: var(--gray-3);
                color: var(--gray-12);
                svg{
                    left: -15px;
                    right: unset;
                    transform: scaleX(1);
                    path{
                        fill: var(--gray-3);
                    }
                }
            }
            p{
                white-space: pre-wrap;
            }
        }
    }
    .input{
        display: flex;
        align-items: flex-end;
        width: max-content;
        border-radius: 5px;
        padding: 0.5rem;
        gap:0.5rem;
        margin: 1rem;
        width: calc(100% - 2rem);
        background-color: var(--gray-3);
        button{
            background-color: transparent;
            border: none;
            color: var(--gray-12);
            cursor: pointer;
            border-radius: 30px;
            width: 26px;
            aspect-ratio: 1;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        textarea{
            background-color: transparent;
            border: none;
            resize: none;
            outline: none;
            flex:1;
            color: var(--gray-12);
        }
    }
</style>