<script lang="ts">
  import type { ActionConfirm } from '@json-render/core';

  type Props = {
    confirm: ActionConfirm;
    onConfirm: () => void;
    onCancel: () => void;
  };

  let { confirm, onConfirm, onCancel }: Props = $props();

  const isDanger = confirm.variant === 'danger';
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
  onclick={onCancel}
  onkeydown={(e) => {
    if (e.key === 'Escape') onCancel();
  }}
  role="dialog"
  aria-modal="true"
  aria-labelledby="confirm-title"
  tabindex="-1"
>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
    onclick={(e) => e.stopPropagation()}
    role="document"
    onkeydown={(e) => e.stopPropagation()}
  >
    <h3 id="confirm-title" class="m-0 mb-2 text-lg font-semibold">
      {confirm.title}
    </h3>
    <p class="m-0 mb-6 text-gray-600">{confirm.message}</p>
    <div class="flex gap-3 justify-end">
      <button
        onclick={onCancel}
        class="px-4 py-2 rounded-md border border-gray-300 bg-white cursor-pointer"
      >
        {confirm.cancelLabel ?? 'Cancel'}
      </button>
      <button
        onclick={onConfirm}
        class="px-4 py-2 rounded-md border-none text-white cursor-pointer {isDanger
          ? 'bg-red-600'
          : 'bg-blue-600'}"
      >
        {confirm.confirmLabel ?? 'Confirm'}
      </button>
    </div>
  </div>
</div>
