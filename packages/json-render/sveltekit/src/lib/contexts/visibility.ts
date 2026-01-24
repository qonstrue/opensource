import { getContext, setContext } from 'svelte';
import {
  evaluateVisibility,
  type VisibilityCondition,
  type VisibilityContext as CoreVisibilityContext,
} from '@json-render/core';
import { derived, type Readable } from 'svelte/store';
import { getDataContext } from './data.js';

const VISIBILITY_CONTEXT_KEY = Symbol('json-render-visibility');

export interface VisibilityContextValue {
  isVisible: (condition: VisibilityCondition | undefined) => Readable<boolean>;
  ctx: Readable<CoreVisibilityContext>;
}

const createVisibilityContextValue = (): VisibilityContextValue => {
  const { data, authState } = getDataContext();

  const ctx = derived(
    [data, authState],
    ([$data, $authState]): CoreVisibilityContext => ({
      dataModel: $data,
      authState: $authState,
    }),
  );

  const isVisible = (condition: VisibilityCondition | undefined): Readable<boolean> => {
    return derived(ctx, ($ctx) => evaluateVisibility(condition, $ctx));
  };

  return { isVisible, ctx };
};

export const createVisibilityContext = (): VisibilityContextValue => createVisibilityContextValue();

export const getVisibilityContext = (): VisibilityContextValue => {
  const context = getContext<VisibilityContextValue>(VISIBILITY_CONTEXT_KEY);
  if (!context) {
    throw new Error('useVisibility must be used within a VisibilityProvider');
  }
  return context;
};

export const setVisibilityContext = (value: VisibilityContextValue): void => {
  setContext(VISIBILITY_CONTEXT_KEY, value);
};

export const useVisibility = (): VisibilityContextValue => getVisibilityContext();

export const useIsVisible = (condition: VisibilityCondition | undefined): Readable<boolean> => {
  const { isVisible } = getVisibilityContext();
  return isVisible(condition);
};
