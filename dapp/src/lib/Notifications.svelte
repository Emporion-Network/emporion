<script lang="ts" context="module">
    export type Notification = {
        text: string;
        icon?: string;
        type: "success" | "error" | "warn";
        url?:string;
        urlLabel?:string,
    };

    export const notification = (n:Notification)=>{
        const a:Record<Notification['type'], string> = {"success":"ri-check-line", 'error':"ri-error-warning-line", 'warn':"ri-error-warning-line"};
        if(!n.icon){
            n.icon = a[n.type];
        }
        let e = new CustomEvent('new-notification', {
            detail:n
        })
        document.dispatchEvent(e);
    }
</script>

<script lang="ts">
    import { onMount } from "svelte";
    type NotificationCreate = {
        text: string;
        timeout: ReturnType<typeof setTimeout>;
        icon: string;
        id: string;
        type: "success" | "error" | "warn";
        url?:string;
        urlLabel?:string,
    };

    let notifications: NotificationCreate[] = [];
    let notificationEls: HTMLElement;

    const close = (notification: NotificationCreate) => () => {
        let el = notificationEls.children[notifications.indexOf(notification)];
        el.classList.add("out");
        setTimeout(() => {
            notifications = notifications.filter((n) => {
                if (n === notification) {
                    clearTimeout(n.timeout);
                    return false;
                }
                return true;
            });
        }, 200);
    };


    onMount(() => {
        const evtHandler = (ev: Event) => {
            let e = ev as CustomEvent;
            let t = setTimeout(() => {
                let el = notificationEls.children[notifications.indexOf(n)];
                el.classList.add("out");
                setTimeout(() => {
                    notifications = notifications.filter((e) => e !== n);
                }, 200);
            }, 10000);
            let n: NotificationCreate = {
                text: e.detail.text,
                timeout: t,
                icon: e.detail.icon,
                type: e.detail.type,
                url: e.detail.url,
                urlLabel:e.detail.urlLabel,
                id: Math.random()
                    .toString(36)
                    .replace(/[^a-z]+/g, "")
                    .substring(2, 12),
            };
            notifications.push(n);
            notifications = notifications;
        };
        document.addEventListener("new-notification", evtHandler);
        return () => {
            document.removeEventListener("new-notification", evtHandler);
            notifications.forEach((n) => {
                clearTimeout(n.timeout);
            });
        };
    });
</script>

<div class="notifications" bind:this={notificationEls}>
    {#each notifications as notification (notification.id)}
        <div class="notification {notification.type}">
            <i class="icon {notification.icon}"></i>
            <p>
                {#if notification.url}
                <h3>{notification.text}</h3>
                <a href="{notification.url}" target="_blank">
                    <span>
                        {notification.urlLabel || notification.url}
                    </span>
                    <i class="ri-external-link-line"></i>
                </a>
                {:else}
                {notification.text}
                {/if}
            </p>
            <button class="button-3" on:click={close(notification)}>
                <i class="ri-close-line"></i>
            </button>
        </div>
    {/each}
</div>

<style lang="scss">
     @use "../media.scss";
    .notifications {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        width: 400px;
        display: flex;
        flex-direction: column;
        gap: 1rem;

        @include media.for-size(tablet) {
            width: 100%;
            right: 0rem;
            bottom: 0.5rem;
            padding: 0 0.5rem;
        }

        :global(.notification.out) {
            animation: slide-out 200ms ease-in-out forwards !important;
        }
        .notification {
            padding: 1rem;
            // background-color: var(--gray-3);
            color: var(--gray-11);
            display: flex;
            border-radius: 3px;
            border: 1px solid var(--gray-6);
            animation: slide-in 200ms ease-in-out forwards;
            align-items: center;
            justify-content: flex-start;
            
            p{
                display: flex;
                flex-direction: column;
                display: block;
                overflow: hidden;

            }
            a{
               width: 100%;
               white-space: nowrap;
               overflow: hidden;
               display: flex;
                span{
                    text-overflow: ellipsis;
                    overflow: hidden;
                    display: block;
                    flex:1;
                }
            }
            
            &.success {
                background-color: var(--green-2);
                border: 1px solid var(--green-7);
                color: var(--green-11);
                font-weight: bold;
            }
            &.warn {
                background-color: var(--orange-2);
                border: 1px solid var(--orange-7);
                color: var(--orange-11);
                font-weight: bold;
            }

            &.error {
                background-color: var(--red-2);
                border: 1px solid var(--red-7);
                color: var(--red-11);
                font-weight: bold;
            }

            .icon {
                font-size: larger;
                margin-right: 1rem;
            }

            @keyframes slide-in {
                from {
                    transform: translateX(calc(100% + 1rem));
                }
                to {
                    transform: translateX(0);
                }
            }

            @keyframes slide-out {
                from {
                    transform: translateX(0);
                }
                to {
                    transform: translateX(calc(100% + 1rem));
                }
            }

            button {
                margin-left: auto;
            }
        }
    }
</style>
