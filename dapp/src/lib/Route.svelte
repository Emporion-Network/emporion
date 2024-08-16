<script lang="ts">
    import { href, matched } from "../stores/location";
    export let match:string|RegExp|((x:URL)=>boolean);

    let matches = false;
    href.subscribe((url)=>{
        if($matched) return;
        if(match instanceof RegExp){
            matches = match.test(url.href);
        } else if(typeof match == 'string'){
            matches = url.pathname === match;
        } else {
            matches = match(url);
        }
        if(matches){
            matched.set(true)
        }
    });
</script>

{#if matches}
    <slot></slot>
{/if}