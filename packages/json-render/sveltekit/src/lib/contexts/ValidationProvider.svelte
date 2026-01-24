<script lang="ts">
  import { createValidationContext, setValidationContext, type ValidationProviderProps } from './validation.js';
  import { getDataContext } from './data.js';
  import type { Snippet } from 'svelte';

  type Props = ValidationProviderProps & {
    children: Snippet;
  };

  let { customFunctions, children }: Props = $props();

  const dataContext = getDataContext();
  const context = createValidationContext({ customFunctions, dataContext });
  setValidationContext(context);
</script>

{@render children()}
