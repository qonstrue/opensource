<script lang="ts">
  import type { UITree } from '../types/index.js';
  import type { RendererProps } from '../renderer/types.js';
  import ElementRenderer from './ElementRenderer.svelte';

  interface Props extends RendererProps {}

  let { tree, registry, loading, fallback }: Props = $props();
</script>

{#if !tree || !tree.root}
  <!-- No tree or root -->
{:else}
  {@const rootElement = tree.elements[tree.root]}
  {#if !rootElement}
    <!-- Root element not found -->
  {:else}
    <ElementRenderer
      element={rootElement}
      {tree}
      {registry}
      {loading}
      {fallback}
    />
  {/if}
{/if}
