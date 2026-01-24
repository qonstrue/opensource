import { getByPath, setByPath, type AuthState, type DataModel } from '@json-render/core';
import { getContext, setContext } from 'svelte';
import { derived, writable, type Readable, type Writable } from 'svelte/store';

const DATA_CONTEXT_KEY = Symbol('json-render-data');

export interface DataContextValue {
  data: Writable<DataModel>;
  authState: Writable<AuthState | undefined>;
  get: (path: string) => Readable<unknown>;
  set: (path: string, value: unknown) => void;
  update: (updates: Record<string, unknown>) => void;
}

export interface DataProviderProps {
  initialData?: DataModel;
  authState?: AuthState;
  onDataChange?: (path: string, value: unknown) => void;
}

const applyUpdates = (
  prev: DataModel,
  updates: Record<string, unknown>,
  onDataChange?: (path: string, value: unknown) => void,
): DataModel => {
  const next = { ...prev };
  Object.entries(updates).forEach(([path, value]) => {
    setByPath(next, path, value);
    onDataChange?.(path, value);
  });
  return next;
};

export const createDataContext = (props: DataProviderProps = {}): DataContextValue => {
  const { initialData = {}, authState: initialAuthState, onDataChange } = props;

  const dataStore = writable<DataModel>(initialData);
  const authStateStore = writable<AuthState | undefined>(initialAuthState);

  const get = (path: string): Readable<unknown> => {
    return derived(dataStore, ($data) => getByPath($data, path));
  };

  const set = (path: string, value: unknown) => {
    dataStore.update((prev) => {
      const next = { ...prev };
      setByPath(next, path, value);
      return next;
    });
    onDataChange?.(path, value);
  };

  const update = (updates: Record<string, unknown>) => {
    dataStore.update((prev) => applyUpdates(prev, updates, onDataChange));
  };

  return {
    data: dataStore,
    authState: authStateStore,
    get,
    set,
    update,
  };
};

export const getDataContext = (): DataContextValue => {
  const context = getContext<DataContextValue>(DATA_CONTEXT_KEY);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const setDataContext = (value: DataContextValue): void => {
  setContext(DATA_CONTEXT_KEY, value);
};

export const useData = (): DataContextValue => getDataContext();

export const useDataValue = <T>(path: string): Readable<T | undefined> => {
  const { get } = getDataContext();
  return get(path) as Readable<T | undefined>;
};

export const useDataBinding = <T>(path: string): [Readable<T | undefined>, (value: T) => void] => {
  const { get, set } = getDataContext();
  const value = get(path) as Readable<T | undefined>;
  const setValue = (newValue: T) => set(path, newValue);
  return [value, setValue];
};
