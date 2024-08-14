<script lang="ts">
    import { onMount } from "svelte";
  
    let text = "";
    let visible = false;
    let x = 0;
    let y = 0;
    let self:HTMLElement;
    let timout:ReturnType<typeof setTimeout>;
    export { text };
    export let timeoutShow = 500;
    export let timoutHide = 100;
    export let pos = "bottom center";
    let content:HTMLElement;
  
    $: visible &&
      (() => {
        const parent = self.children[1].getBoundingClientRect();
        const tooltip = content.getBoundingClientRect();
        const centerX = parent.left + parent.width/2 - tooltip.width/2;
        const rightX = parent.left + parent.width - tooltip.width;
        const leftX = parent.left;
        const bottomY = parent.top + parent.height;
        const topY = parent.top - tooltip.height - parent.height/2;
        let finalX = centerX;
        let finalY = bottomY;
        let finalPos = ['bottom','center'];
        if(centerX + tooltip.width/2 > window.innerWidth){
            finalX = rightX;
            finalPos[1] = 'right'
        }
        if(centerX - tooltip.width/2 < 0){
            finalX = leftX;
            finalPos[1] = 'left'

        }
        if(bottomY + tooltip.height > window.innerHeight){
            finalY = topY;
            finalPos[0] = 'top'
        }
        x = finalX;
        y = finalY;
        pos = finalPos.join(' ');
      })();
  
    const hideTooltip = () => {
      clearTimeout(timout);
      timout = setTimeout(() => {
        visible = false;
      }, timoutHide);
    };
  
    const showTooltip = () => {
      clearTimeout(timout);
      timout = setTimeout(() => {
        visible = true;
      }, timeoutShow);
    };
  
    onMount(() => {
      const sc = () => {
        visible = false;
      };
      document.addEventListener("scroll", sc, true);
      return () => {
        document.removeEventListener("scroll", sc);
      };
    });
  </script>
  
  <div
    class="tool-tip"
    style="--x:{x};--y:{y}"
    bind:this={self}
    on:mouseenter={showTooltip}
    on:mouseleave={hideTooltip}
    role="tooltip"
  >
    <div class="tool-tip-content {pos}" class:visible bind:this={content}>
      <slot name="content">
        <p class="text">{text}</p>
      </slot>
    </div>
    <slot />
  </div>
  
  <style lang="scss">
    .tool-tip {
      display: contents;
      cursor: pointer;
    }
  
    .tool-tip-content {
      border-radius: 3px;
      position: fixed;
      left: calc(var(--x) * 1px);
      top: calc(var(--y) * 1px);
      pointer-events: none;
      opacity: 0;
      background-color: var(--gray-7);
      color: var(--gray-12);
      padding: 0.5rem;
      margin: 0.5rem 0;
      border-radius: 3px;
      font-size: 0.9rem;
      z-index: 100;
      max-width: 300px;
      font-weight: 500;
      &.left::after{
        left: 0.5rem;
      }
      &.top::after{
        top: 100%;
        transform: translate(-50%, -50%) rotate(180deg);
      }

      &::after{
        content: "\EA77";
        font-family: 'remixicon' !important;
        position: absolute;
        top: 0;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 2rem;
        color:var(--gray-7);
        pointer-events: none;
      }
      
      &.visible {
        opacity: 1;
        z-index: 100;
        pointer-events: unset;
      }
    }
  </style>