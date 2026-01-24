<script lang="ts">
  import { get } from 'svelte/store';
  import { useActions } from '../contexts/actions.js';
  import { useIsVisible } from '../contexts/visibility.js';
  import type { ComponentRegistry, ComponentRenderer } from '../renderer/types.js';
  import type { UIElement, UITree } from '../types/index.js';
  import ElementRenderer from './ElementRenderer.svelte';

  type Props = {
    element: UIElement;
    tree: UITree;
    registry: ComponentRegistry;
    loading?: boolean;
    fallback?: ComponentRenderer;
  };

  let { element, tree, registry, loading, fallback }: Props = $props();

  const visibilityStore = useIsVisible(element.visible);
  const isVisibleValue = $derived.by(() => get(visibilityStore));
  const { execute } = useActions();

  const Component = $derived(registry[element.type] ?? fallback);

  const children = $derived(
    element.children
      ?.map((childKey) => {
        const childElement = tree.elements[childKey];
        if (!childElement) return null;
        return {
          key: childKey,
          element: childElement,
        };
      })
      .filter((item): item is { key: string; element: UIElement } => item !== null) ?? [],
  );
</script>

{#if !isVisibleValue}
  <!-- Element is hidden -->
{:else if !Component}
  <!-- No renderer found for type: {element.type} -->
{:else}
  {@const Comp = Component}
  <Comp {element} onAction={execute} {loading}>
    {#each children as { key, element: childElement }}
      {#key key}
        <ElementRenderer element={childElement} {tree} {registry} {loading} {fallback} />
      {/key}
    {/each}
  </Comp>
{/if}
