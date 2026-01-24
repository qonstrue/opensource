<script lang="ts">
  import { createVisibilityContext, setVisibilityContext } from './visibility.js';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();

  const context = createVisibilityContext();
  setVisibilityContext(context);
</script>

{@render children()}
