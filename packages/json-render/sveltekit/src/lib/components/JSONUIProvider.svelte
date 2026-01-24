<script lang="ts">
  import DataProvider from '../contexts/DataProvider.svelte';
  import VisibilityProvider from '../contexts/VisibilityProvider.svelte';
  import ActionProvider from '../contexts/ActionProvider.svelte';
  import ValidationProvider from '../contexts/ValidationProvider.svelte';
  import ConfirmDialogManager from './ConfirmDialogManager.svelte';
  import type { ComponentRegistry, ActionHandler, ValidationFunction } from '../renderer/types.js';
  import type { DataModel, AuthState } from '../types/index.js';
  import type { Snippet } from 'svelte';

  type Props = {
    registry: ComponentRegistry;
    initialData?: DataModel;
    authState?: AuthState;
    actionHandlers?: Record<string, ActionHandler>;
    navigate?: (path: string) => void;
    validationFunctions?: Record<string, ValidationFunction>;
    onDataChange?: (path: string, value: unknown) => void;
    children: Snippet;
  };

  let {
    registry,
    initialData,
    authState,
    actionHandlers,
    navigate,
    validationFunctions,
    onDataChange,
    children,
  }: Props = $props();

  const handlers = actionHandlers;
  const customFunctions = validationFunctions;
</script>

<DataProvider {initialData} {authState} {onDataChange}>
  <VisibilityProvider>
    <ActionProvider {handlers} {navigate}>
      <ValidationProvider {customFunctions}>
        {@render children()}
        <ConfirmDialogManager />
      </ValidationProvider>
    </ActionProvider>
  </VisibilityProvider>
</DataProvider>
