<script lang="ts">
  import { createActionContext, setActionContext, type ActionProviderProps } from './actions.js';
  import { getDataContext } from './data.js';
  import type { Snippet } from 'svelte';

  type Props = ActionProviderProps & {
    children: Snippet;
  };

  let { handlers, navigate, children }: Props = $props();

  const dataContext = getDataContext();
  const context = createActionContext({ handlers, navigate, dataContext });
  setActionContext(context);
</script>

{@render children()}
