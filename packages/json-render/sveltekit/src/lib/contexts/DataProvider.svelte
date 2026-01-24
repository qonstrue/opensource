<script lang="ts">
  import { createDataContext, setDataContext, type DataProviderProps } from './data.js';
  import type { Snippet } from 'svelte';

  type Props = DataProviderProps & {
    children: Snippet;
  };

  let { initialData, authState, onDataChange, children }: Props = $props();

  const context = createDataContext({ initialData, authState, onDataChange });
  setDataContext(context);
</script>

{@render children()}
