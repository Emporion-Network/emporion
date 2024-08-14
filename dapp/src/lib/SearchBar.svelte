<script lang="ts">
    import { CATEGORIES } from "../../../shared-types/categories";
    import { historyPush, href } from "../stores/location";
    import MultiSelect from "./MultiSelect.svelte";
    import Search from "./Search.svelte";
    import { searchSuggestions } from "./utils";
    export let selected:string[] = [];
    export let searchText:string="";
    let prevSearch = "";
    let timeout:NodeJS.Timeout;
    let suggestions:string[]= [];
    $:searchText, (()=>{
        clearTimeout(timeout);
        timeout = setTimeout(()=>{
            if(searchText === "") return;
            if(prevSearch === searchText) return;
            prevSearch = searchText;
            searchSuggestions(searchText).then(e=> {
                if(e.length > 0){
                    suggestions = e;
                }
            })
        }, 600)
    })()
    

    const selectProduct = (productId:string)=>{
        const productURL = new URL($href.href)
        productURL.pathname = "/products"
        productURL.searchParams.set('q', productId);
        if(selected[0]) productURL.searchParams.set('category', selected[0]);
        historyPush(productURL.href);
        searchText = ""
    }
</script>
<div class="search-bar input">
    <Search 
    bind:value={searchText} 
    placeholder="Search emporion..." 
    icon="ri-search-line" 
    suggestions={suggestions}
    onSelect={selectProduct}
    ></Search>
    <MultiSelect options={CATEGORIES.slice(0)} max={1} placeholder="Categorie" bind:selected></MultiSelect>
</div>

<style lang="scss">
    .search-bar{
        flex:1;
        display: flex;
        align-items: center;
        border: 2px solid var(--gray-6);
        border-radius: 3px;
        height: 3.6rem;
        &:hover{
            border: 2px solid var(--gray-7);
        }
        :global(.multiselect){
            max-width: 200px;
            outline: none;
            outline: none !important;
            border: none;
            border-radius: 0 3px 3px 0;
            background-color: var(--gray-1);
        }
        :global(.search){
            flex:1;
            outline: none !important;
            border: none;
            background-color: var(--gray-1);
            border-radius: 3px 0 0 3px;
            border-right: 2px solid var(--gray-6);
            height: 100%;
        }
    }
</style>