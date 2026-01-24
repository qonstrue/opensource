<script lang="ts">
  import { getActionContext } from '../contexts/actions.js';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import { get } from 'svelte/store';

  const { pendingConfirmation, confirm, cancel } = getActionContext();
  const pendingConfirmationValue = $derived.by(() => get(pendingConfirmation));
</script>

{#if pendingConfirmationValue?.action.confirm}
  <ConfirmDialog
    confirm={pendingConfirmationValue.action.confirm}
    onConfirm={confirm}
    onCancel={cancel}
  />
{/if}
