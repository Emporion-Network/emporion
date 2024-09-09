<script lang="ts">
    export let address:string;
</script>
<div class="overflow-address">
    <span>{address.slice(0, -3)}</span>
    <span>{address.slice(-3)}</span>
</div>

<style lang="scss">
    .overflow-address{
            flex:1;
            overflow: hidden;
            display: flex;
            max-width: max-content;
            span:first-of-type{
                text-overflow: ellipsis;
                flex:1;
                overflow: hidden;
            }
            span:last-of-type{
                width: max-content;
            }
        }
</style>