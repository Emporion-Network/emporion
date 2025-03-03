<script lang="ts">
  import PostalAddressForm from "@/lib/PostalAddressForm.svelte";
  import Range from "@/lib/Range.svelte";
  let name = $state("");
  let addr = $state("");
</script>

<div class="page">
  <PostalAddressForm bind:name bind:postalAddress={addr} />
</div>

<style lang="scss">
  .page {
    display: flex;
    height: 100vh;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 3rem;
  }
</style>
