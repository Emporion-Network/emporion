<script lang="ts">
  import Slider from "@/lib/Slider.svelte";
</script>

<div class="reviews">
  <Slider speed={1}>
    {#each { length: 4 } as _, i}
      <div class="review">
        <div class="head">
          <img src="https://avatar.iran.liara.run/public?q={i}" alt="" />
          <div class="info">
            <span>John Doe</span>
            <span>@jhon doe</span>
          </div>
        </div>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rerum autem,
          velit, dolorem beatae officia deserunt doloremque deleniti voluptatem
          aliquid, tempora aliquam ex. Aliquid hic facilis consequuntur eaque
          ratione, officia aspernatur?
        </p>
      </div>
    {/each}
  </Slider>

  <Slider speed={1} dir={-1}>
    {#each { length: 4 } as _, i}
      <div class="review">
        <div class="head">
          <img src="https://avatar.iran.liara.run/public?q={i}" alt="" />
          <div class="info">
            <span>John Doe</span>
            <span>@jhon doe</span>
          </div>
        </div>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rerum autem,
          velit, dolorem beatae officia deserunt doloremque deleniti voluptatem
          aliquid, tempora aliquam ex. Aliquid hic facilis consequuntur eaque
          ratione, officia aspernatur?
        </p>
      </div>
    {/each}
  </Slider>
</div>

<style lang="scss">
  .reviews {
    min-width: max-content;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-bottom: 5vh;
    margin-top: 5vh;
    gap: 2rem;

    .review {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--white-a1);
      background-color: var(--white-a1);
      border-radius: 3px;
      padding: 1rem;
      justify-content: flex-start;
      gap: 1rem;
      min-width: 500px;
      text-rendering: geometricPrecision;

      .head {
        display: flex;
        gap: 2rem;
        align-items: center;
        .info {
          display: flex;
          flex-direction: column;
          span:nth-child(1) {
            font-weight: bold;
            color: var(--white-a12);
          }
          span:nth-child(2) {
            color: var(--white-a10);
          }
        }
        img {
          width: 50px;
          border-radius: 50px;
        }
      }
      p {
        font-weight: 600;
        color: var(--white-a10);
      }
    }
  }
</style>
