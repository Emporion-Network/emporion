<script lang="ts">
  let {
    address,
  }: {
    address: string;
  } = $props();
</script>

<div class="address">
  <span>{address.slice(0, 7)}...{address.slice(-7)}</span>
</div>

<style lang="scss">
  .address {
    overflow: hidden;
    display: inline-flex;
  }
</style>
