<script>
  import Logo from "./logo.svelte";
</script>

<footer>
  <div>
    <Logo bg="transparent" />
    <span>©{new Date().getFullYear()} Emporion. All rights reserved.</span>
  </div>
  <div>
    <a
      target="_blank"
      rel="noopener noreferrer"
      href="https://x.com/EmporionNetwork"
      aria-labelledby="twitter"
    >
      <i class="ri-twitter-x-line"></i>
    </a>
    <a
      target="_blank"
      rel="noopener noreferrer"
      href="https://t.me/+SHAsEPzMnHRmMzdk"
      aria-labelledby="telegram"
    >
      <i class="ri-telegram-2-line"></i>
    </a>
    <a target="_blank" href="https://discord.com" aria-labelledby="discord">
      <i class="ri-discord-line"></i>
    </a>
    <a
      target="_blank"
      href="https://github.com/emporion-Network/"
      aria-labelledby="github"
    >
      <i class="ri-github-fill"></i>
    </a>
  </div>
</footer>

<style lang="scss">
  footer {
    display: flex;
    padding: 1rem 5%;
    margin: auto;
    max-width: 1200px;
    justify-content: space-between;
    align-items: center;
    div {
      display: flex;
      gap: 1rem;
      align-items: center;
      color: var(--neutral-10);
    }
    a {
      font-size: 1.2rem;
      color: var(--neutral-12);
      text-decoration: none;
    }
    :global(svg) {
      width: 30px;
      height: 30px;
    }
  }
</style>
