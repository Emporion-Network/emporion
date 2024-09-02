<div class="wpr">
    <div class="content">
        <slot></slot>
    </div>
    <div class="actions">
        <slot name='actions'></slot>
    </div>
</div>

<style lang="scss">
    .wpr{
        display: flex;
        flex-direction: column;
    }
</style>