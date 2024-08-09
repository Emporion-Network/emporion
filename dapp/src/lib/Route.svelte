<script lang="ts">
    import { href, matched } from "../stores/location";
    export let match:string|RegExp|((x:URL)=>boolean);

    let matches = false;
    let routed = $matched;
    href.subscribe((url)=>{
        if(routed) return;
        if(match instanceof RegExp){
            matches = match.test(url.href);
        } else if(typeof match == 'string'){
            matches = url.pathname === match;
        } else {
            matches = match(url);
        }
        matched.set(matches)
    });
</script>

{#if matches}
    <slot></slot>
{/if}