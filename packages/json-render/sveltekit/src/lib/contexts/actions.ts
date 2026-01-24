import { executeAction, resolveAction, type Action, type ActionHandler, type ResolvedAction } from '@json-render/core';
import { getContext, setContext } from 'svelte';
import { derived, get, writable, type Readable } from 'svelte/store';
import { getDataContext, type DataContextValue } from './data.js';

const ACTION_CONTEXT_KEY = Symbol('json-render-actions');

export interface PendingConfirmation {
  action: ResolvedAction;
  handler: ActionHandler;
  resolve: () => void;
  reject: () => void;
}

export interface ActionContextValue {
  handlers: Readable<Record<string, ActionHandler>>;
  loadingActions: Readable<Set<string>>;
  pendingConfirmation: Readable<PendingConfirmation | null>;
  execute: (action: Action) => Promise<void>;
  confirm: () => void;
  cancel: () => void;
  registerHandler: (name: string, handler: ActionHandler) => void;
}

export interface ActionProviderProps {
  handlers?: Record<string, ActionHandler>;
  navigate?: (path: string) => void;
  dataContext?: DataContextValue;
}

const getOrCreateDataContext = (providedDataContext: DataContextValue | undefined): DataContextValue | null => {
  if (providedDataContext) {
    return providedDataContext;
  }
  try {
    return getDataContext();
  } catch {
    return null;
  }
};

const addToSet = <T>(set: Set<T>, value: T): Set<T> => new Set(set).add(value);

const removeFromSet = <T>(set: Set<T>, value: T): Set<T> => {
  const next = new Set(set);
  next.delete(value);
  return next;
};

export const createActionContext = (props: ActionProviderProps = {}): ActionContextValue => {
  const { handlers: initialHandlers = {}, navigate, dataContext: providedDataContext } = props;

  const handlersStore = writable<Record<string, ActionHandler>>(initialHandlers);
  const loadingActionsStore = writable<Set<string>>(new Set());
  const pendingConfirmationStore = writable<PendingConfirmation | null>(null);

  let dataContext: DataContextValue | null = getOrCreateDataContext(providedDataContext);

  const registerHandler = (name: string, handler: ActionHandler) => {
    handlersStore.update((prev) => ({ ...prev, [name]: handler }));
  };

  const execute = async (action: Action) => {
    const currentDataContext = dataContext || getOrCreateDataContext(undefined);
    if (!currentDataContext) {
      return;
    }
    dataContext = currentDataContext;

    const { data, set: setData } = dataContext;
    const $data = get(data);
    const $handlers = get(handlersStore);

    const resolved = resolveAction(action, $data);
    const handler = $handlers[resolved.name];

    if (!handler) {
      return;
    }

    const executeWithLoading = async () => {
      loadingActionsStore.update((prev) => addToSet(prev, resolved.name));
      try {
        await executeAction({
          action: resolved,
          handler,
          setData,
          navigate,
          executeAction: async (name: string) => {
            const subAction: Action = { name };
            await execute(subAction);
          },
        });
      } finally {
        loadingActionsStore.update((prev) => removeFromSet(prev, resolved.name));
      }
    };

    if (resolved.confirm) {
      return new Promise<void>((resolve, reject) => {
        pendingConfirmationStore.set({
          action: resolved,
          handler,
          resolve: () => {
            pendingConfirmationStore.set(null);
            resolve();
          },
          reject: () => {
            pendingConfirmationStore.set(null);
            reject(new Error('Action cancelled'));
          },
        });
      }).then(executeWithLoading);
    }

    return executeWithLoading();
  };

  const confirm = () => {
    pendingConfirmationStore.update((pending) => {
      pending?.resolve();
      return null;
    });
  };

  const cancel = () => {
    pendingConfirmationStore.update((pending) => {
      pending?.reject();
      return null;
    });
  };

  return {
    handlers: handlersStore,
    loadingActions: loadingActionsStore,
    pendingConfirmation: pendingConfirmationStore,
    execute,
    confirm,
    cancel,
    registerHandler,
  };
};

export const getActionContext = (): ActionContextValue => {
  const context = getContext<ActionContextValue>(ACTION_CONTEXT_KEY);
  if (!context) {
    throw new Error('useActions must be used within an ActionProvider');
  }
  return context;
};

export const setActionContext = (value: ActionContextValue): void => {
  setContext(ACTION_CONTEXT_KEY, value);
};

export const useActions = (): ActionContextValue => getActionContext();

export const useAction = (
  action: Action,
): {
  execute: () => Promise<void>;
  isLoading: Readable<boolean>;
} => {
  const { execute, loadingActions } = getActionContext();
  const isLoading = derived(loadingActions, ($loading) => $loading.has(action.name));

  return { execute: () => execute(action), isLoading };
};
