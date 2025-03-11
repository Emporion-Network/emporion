<script lang="ts">
  import { Application } from "@splinetool/runtime";
  import { onMount } from "svelte";

  import heroScene from "@/assets/scene8.splinecode?url";
  import coinScene from "@/assets/coin.splinecode?url";
  import LogoSlider from "./LogoSlider.svelte";
  import Separator from "@/lib/Separator.svelte";
  import Cards from "./Cards.svelte";
  import Logo from "@/lib/logo.svelte";
  import Reviews from "./Reviews.svelte";
  import Secure from "./Secure.svelte";
  import { intersect } from "@/lib/actions.svelte";
  import Numbers from "./Numbers.svelte";
  import { getLocation } from "@/stores/location.svelte";
  import { getTranslator } from "@/stores/translate.svelte";
  const { goTo } = getLocation();
  const t = getTranslator();

  let scenes: Map<string, Application> = new Map();
  const load = (selector: string, scene: string) => () => {
    const app = new Application(document.querySelector(selector)!);
    app.load(scene);
    scenes.set(selector, app);
  };
  const unload = (scene: string) => () => {
    let s = scenes.get(scene);
    if (s) {
      s.dispose();
    }
  };
  onMount(() => {
    return () => {
      scenes.forEach((s) => s.dispose());
    };
  });
  const scrollToNext = () => {
    document.documentElement.scrollBy({
      top: window.innerHeight * 1.2,
      behavior: "smooth",
    });
  };
</script>

<div class="page dark">
  <div class="hero">
    <canvas
      class="hero_canvas"
      use:intersect={"50%"}
      onexit={unload(".hero_canvas")}
      onenter={load(".hero_canvas", heroScene)}
    ></canvas>
    <div class="content">
      <nav>
        <Logo></Logo>
        <span>Emporion</span>
      </nav>
      <h1>
        <span>Own</span> <span>Your</span> <br />
        <span>Marketplace.</span>
      </h1>
      <p>
        {t.t("next_sound_wasp_cut")}
      </p>
      <div class="buttons">
        <button onclick={scrollToNext}>{t.t("free_upper_giraffe_pull")}</button>

        <a
          href="https://app.osmosis.zone/assets/EMPR?tab=buy"
          target="_blank"
          rel="noopener"
        >
          <button>{t.t("fluffy_frail_myna_embrace")}</button>
        </a>
      </div>
    </div>
  </div>

  <div class="logos">
    <h2 class="header_gradient">{t.t("shy_gaudy_gazelle_sing")}</h2>
    <LogoSlider />
    <Separator />
  </div>

  <div class="feature">
    <h2 class="header_gradient">
      Stake EMPR <br />
      {t.t("direct_plane_sparrow_savor")}
    </h2>
    <p>
      {t.t("major_vexed_lion_spark")}
    </p>
    <Cards>
      <div class="card flip-coin">
        <i class="ri-copper-diamond-fill"></i>
        <h3>{t.t("every_safe_rook_conquer")}</h3>
        <p>{t.t("steep_every_nils_seek")}</p>
      </div>
      <div class="card talk">
        <i class="ri-megaphone-fill"></i>
        <h3>{t.t("fuzzy_true_quail_snap")}</h3>
        <p>{t.t("silly_seemly_bat_bask")}</p>
      </div>
      <div class="card potential">
        <i class="ri-line-chart-fill"></i>
        <h3>{t.t("busy_upper_frog_sail")}</h3>
        <p>{t.t("cozy_known_octopus_talk")}</p>
      </div>
    </Cards>
    <button class="action_btn" onclick={() => goTo("/staking")}>
      {t.t("acidic_due_poodle_reap")}
    </button>
    <Separator />
  </div>

  <div class="secure">
    <div class="content">
      <h2 class="header_gradient">
        {t.t("blue_mean_jackdaw_amaze")}<br />
        {t.t("broad_upper_wren_ask")}
      </h2>
      <p>
        {t.t("super_spare_buzzard_swim")}
      </p>
    </div>
    <Secure />
  </div>

  <div class="wpr">
    <Separator />
  </div>

  <div class="feature">
    <h2 class="header_gradient">
      {t.t("sweet_zippy_nils_flow")}<br />
      {t.t("pink_aqua_martin_bend")}
    </h2>
    <p>
      {t.t("dull_big_kudu_conquer")}
    </p>
    <Cards>
      <div class="card">
        <i class="ri-earth-fill"></i>
        <h3>{t.t("upper_away_opossum_fetch")}</h3>
        <p>{t.t("late_quiet_raven_boost")}</p>
      </div>
      <div class="card">
        <i
          class="ri-funds-fill"
          style="transform: scaleY(-1); display: inline-block"
        ></i>
        <h3>{t.t("topical_zippy_trout_devour")}</h3>
        <p>{t.t("active_curly_baboon_enjoy")}</p>
      </div>
      <div class="card">
        <i class="ri-shield-fill"></i>
        <h3>{t.t("orange_solid_firefox_fade")}</h3>
        <p>
          {t.t("patchy_glad_impala_compose")}
        </p>
      </div>
      <div class="card">
        <i class="ri-star-fill"></i>
        <h3>{t.t("basic_wise_termite_praise")}</h3>
        <p>{t.t("silly_fluffy_mule_link")}</p>
      </div>
    </Cards>
    <button class="action_btn" onclick={() => goTo("/store")}>
      {t.t("whole_polite_spider_gleam")}
    </button>
    <Separator />
  </div>

  <div class="wpr">
    <h2 class="header_gradient">{t.t("close_gross_ray_fry")}</h2>
    <Reviews />
    <Separator />
  </div>

  <div class="feature">
    <h2 class="header_gradient">
      {t.t("active_male_alligator_inspire")} <br />{t.t(
        "factual_honest_panther_embrace",
      )}
    </h2>
    <p>
      {t.t("lower_funny_hornet_hint")}
    </p>
    <Cards>
      <div class="card">
        <i class="ri-paint-brush-fill"></i>
        <h3>{t.t("watery_chunky_dachshund_exhale")}</h3>
        <p>
          {t.t("long_trite_lemming_fold")}
        </p>
      </div>
      <div class="card">
        <i class="ri-checkbox-fill"></i>
        <h3>{t.t("odd_loose_shrike_assure")}</h3>
        <p>
          {t.t("funny_empty_ostrich_file")}
        </p>
      </div>
      <div class="card">
        <i
          class="ri-funds-fill"
          style="transform: scaleY(-1); display: inline-block"
        ></i>
        <h3>{t.t("misty_gaudy_lemur_dance")}</h3>
        <p>{t.t("hour_ok_angelfish_aid")}</p>
      </div>
      <div class="card">
        <i class="ri-earth-fill"></i>
        <h3>{t.t("patient_yummy_parrot_blend")}</h3>
        <p>
          {t.t("zany_awful_peacock_build")}
        </p>
      </div>
    </Cards>
    <button class="action_btn" onclick={() => goTo("/my-store")}>
      {t.t("seemly_pretty_dachshund_peel")}
    </button>
    <Separator />
  </div>

  <div class="wpr">
    <h2 class="header_gradient">{t.t("pink_nimble_kitten_scoop")}</h2>
    <Numbers />
    <Separator />
  </div>

  <div class="feature">
    <h2 class="header_gradient">{t.t("fine_free_barbel_mend")}</h2>
    <h3>{t.t("heroic_big_bee_play")}</h3>
    <p>
      {t.t("honest_true_seal_pride")}
    </p>
    <a href="https://app.osmosis.zone/pool/2702" target="_blank">
      <button class="action_btn">{t.t("gray_weird_albatross_laugh")}</button>
    </a>
    <canvas
      class="coin_canvas"
      use:intersect={"50%"}
      onexit={unload(".coin_canvas")}
      onenter={load(".coin_canvas", coinScene)}
    ></canvas>
  </div>
</div>

<style lang="scss">
  @use "../../mixins" as *;
  .page {
    background-color: #000;
    .header_gradient {
      font-size: 75px;
      text-align: center;
      line-height: 1em;
      max-width: 900px;
      background: linear-gradient(0deg, #ffffff, #ffffff19 100%);
      color: transparent;
      background-clip: text;
      padding-bottom: 0.5rem;
    }
    .action_btn {
      background-color: transparent;
      border-radius: 1px;
      border: 2px solid rgb(var(--brand));
      color: var(--white-a12);
      font-weight: bold;
      padding: 0.8rem 1.2rem;
      font-size: 1.1rem;
      position: relative;
      cursor: pointer;
      background: linear-gradient(
        to right,
        rgb(var(--brand)) var(--p),
        rgb(var(--brand)) var(--p),
        transparent var(--p)
      );
      &:not(:hover) {
        animation: rshow 200ms ease-in-out forwards;
      }
      @keyframes show {
        from {
          --p: 0%;
        }
        to {
          --p: 100%;
        }
      }
      @keyframes rshow {
        from {
          --p: 100%;
        }
        to {
          --p: 0%;
        }
      }
      &:hover {
        animation: show 200ms ease-in-out forwards;
      }
    }
    .coin_canvas {
      width: 280px !important;
      height: auto !important;
    }
    @include media("<= phone") {
      .header_gradient {
        font-size: 50px;
      }
      .hero .content {
        padding: 1rem;
        nav {
          top: 1rem;
          left: 1rem;
        }
        h1 {
          font-size: 55px;
        }
        .buttons {
          flex-direction: column;
        }
      }
      .feature {
        :global(.cards) {
          grid-auto-flow: row;
          gap: 1rem;
        }
        .card {
          max-width: unset;
          border: 1px solid var(--white-a2);
        }
      }
      .secure {
        height: 50vh;
        .content p {
          color: var(--white-a9);
        }
        :global(.itms) {
          display: none;
        }
      }
    }
  }
  .hero {
    position: relative;
    width: 100vw;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    margin-bottom: 30vh;
    background-color: #000;
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 130%;
      background: black;
      animation: show_after 500ms 600ms ease-in forwards;
      z-index: 3;
      pointer-events: none;
      @keyframes show_after {
        0% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }
    }
    .content {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 2rem;
      animation: in 500ms ease-in forwards;
      opacity: 1;
      z-index: 2;
      width: 100%;
      height: 100%;
      flex: 1;
      @keyframes in {
        0% {
          opacity: 0;
          transform: translateY(30px);
        }
        100% {
          transform: translateY(0px);
          opacity: 1;
        }
      }
      nav {
        display: flex;
        justify-content: start;
        align-items: center;
        position: absolute;
        top: 2vw;
        left: 2%;
        gap: 1rem;
        color: var(--white-a12);
        span {
          font-weight: bold;
          font-size: 1.4rem;
        }
        :global(svg) {
          width: 50px;
          height: 50px;
        }
      }
      h1 {
        font-size: 120px;
        text-align: center;
        line-height: 0.9em;
        background: linear-gradient(160deg, #e41b22bc, #e41b2213);
        color: transparent;
        background-clip: text;
        span:nth-of-type(1) {
          animation: sw 200ms 0ms ease-in;
        }
        span:nth-of-type(2) {
          animation: sw 200ms 680ms ease-in;
        }
        span:nth-of-type(3) {
          animation: sw 200ms 780ms ease-in;
        }
        @keyframes sw {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      }
      p {
        text-align: center;
        color: var(--white-a9);
        max-width: 450px;
        font-size: 1.1rem;
      }
      .buttons {
        display: flex;
        width: max-content;
        gap: 1rem;
        a {
          display: contents;
          color: var(--white-a12);
          button {
            background-color: transparent;
            color: var(--white-a12);
            border: 1px solid var(--white-a12);
          }
        }
        button {
          font-weight: 700;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          border: none;
          border-radius: 3px;
          background-color: white;
          color: var(--black-a12);
          cursor: pointer;
          white-space: nowrap;
          flex: 1;
        }
      }
    }
    canvas {
      position: absolute;
      top: 30%;
      pointer-events: none;
      z-index: 0;
    }
  }
  .logos {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 5rem;
    min-height: 80vh;
    z-index: 1;
    position: relative;
  }
  .feature {
    display: flex;
    padding: 5%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 3rem;
    min-height: 120vh;
    position: relative;
    h3 {
      text-align: center;
    }

    & > p {
      text-align: center;
      max-width: 700px;
      color: var(--white-a9);
      font-size: 1.1rem;
    }
    .card {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      aspect-ratio: 1/1;
      max-width: 20vw;
      border: 1px solid var(--white-a2);
      border-right: none;
      position: relative;
      margin-left: -0.5px;
      margin-right: -0.5px;
      &:last-of-type {
        border-right: 1px solid var(--white-a2);
      }
      &::after,
      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transform: scale(0);
        transition: transform 500ms ease-in-out;
        pointer-events: none;
        border: 0px solid var(--red-a6);
      }
      &::after {
        border-top-width: 1px;
        border-right-width: 1px;
        transform-origin: top right;
      }
      &::before {
        border-bottom-width: 1px;
        border-left-width: 1px;
        transform-origin: bottom left;
      }
      &:hover {
        background: linear-gradient(-45deg, transparent, var(--white-a1));
        z-index: 1;
        h3 {
          color: var(--white-a12);
        }
        &::after,
        &::before {
          transform: scale(1);
        }
      }
      h3 {
        color: var(--white-a10);
      }
      p {
        text-align: center;
        text-wrap: auto;
        color: var(--white-a6);
      }
      i {
        font-size: 2.3rem;
        color: var(--white-a12);
      }
    }
  }
  .wpr {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    min-height: 100px;
    margin-top: 2rem;
  }
  .secure {
    position: relative;
    .content {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      z-index: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      h2 {
        color: var(--white-a12);
      }
      p {
        max-width: 600px;
        color: var(--white-a11);
        text-align: center;
      }
    }
  }
  .flip-coin {
    i {
      display: block;
      transition: transform 500ms ease-in-out;
    }
    &:hover {
      i {
        transform: rotateY(360deg) translateY(-5px);
      }
    }
  }
  .talk {
    i {
      display: block;
      transition: transform 500ms ease-in-out;
      position: relative;
      &::after {
        content: "";
        position: absolute;
        right: -5px;
        width: 20px;
        height: 10px;
        top: calc(50% - 6px);
        border-radius: 5px;
        border-bottom-left-radius: 0;
        background: white;
        opacity: 0;
        transition:
          transform 500ms ease-in-out,
          opacity 500ms ease-in-out;
      }
    }
    &:hover {
      i {
        transform: rotateZ(-30deg) translateY(-5px);
      }
      i::after {
        transform: translateX(34px) scale(2) rotateZ(30deg);
        opacity: 1;
      }
    }
  }
  .potential {
    i {
      display: block;
      transition: transform 500ms ease-in-out;
      position: relative;
      &::after {
        content: "";
        position: absolute;
        width: 0px;
        height: 5px;
        left: 0px;
        bottom: 0;
        transform-origin: bottom left;
        transform: translate(24.5px, -24px) rotateZ(-45deg);
        border-bottom-left-radius: 0;
        background: white;
        transition: width 500ms ease-in-out;
      }
    }
    &:hover {
      i {
        &::after {
          width: 25px;
        }
      }
    }
  }
</style>
