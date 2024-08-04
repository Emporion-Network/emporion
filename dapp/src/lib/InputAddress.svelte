<script lang="ts">
    export let label:string;
    export let icon:string;
    export let name:string;
    export let address:string;
</script>

<div class="wrpr">
    <div class="label">{label}</div>
    <div class="input-address">
        <img src="{icon}" alt="{name}">
        <div>
            <span>{address.slice(0, -5)}</span>
            <span>{address.slice(-5)}</span>
        </div>
    </div>    
</div>

<style lang="scss">
    .wrpr{
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        padding-top: 1.2rem;
        margin-top: -1.2rem;
        .label{
            position: absolute;
            top: -0.2rem;
            left: 2px;
            color: var(--gray-11);
            font-weight: 600;
            font-size: 0.8rem;
        }
    }
    .input-address{
        display: flex;
        padding: 0.5rem;
        padding-right: 1rem;
        border: 1px solid var(--gray-6);
        background-color: var(--gray-2);
        border-radius: 5px;
        justify-content: flex-start;
        align-items: center;
        gap: 1rem;
        color: var(--gray-10);

        &:hover{
            border:1px solid var(--gray-7);
        }
        div{
            flex:1;
            overflow: hidden;
            display: flex;
            cursor: text;
            span:first-of-type{
                text-overflow: ellipsis;
                flex:1;
                overflow: hidden;
            }
            span:last-of-type{
                width: max-content;
            }
        }
        img{
            width: 35px;
        }
    }
</style>