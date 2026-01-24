import {
  getByPath,
  runValidation,
  type ValidationConfig,
  type ValidationFunction,
  type ValidationResult,
} from '@json-render/core';
import { getContext, setContext } from 'svelte';
import { derived, get, writable, type Readable } from 'svelte/store';
import { getDataContext, type DataContextValue } from './data.js';

const VALIDATION_CONTEXT_KEY = Symbol('json-render-validation');

export interface FieldValidationState {
  touched: boolean;
  validated: boolean;
  result: ValidationResult | null;
}

export interface ValidationContextValue {
  customFunctions: Readable<Record<string, ValidationFunction>>;
  fieldStates: Readable<Record<string, FieldValidationState>>;
  validate: (path: string, config: ValidationConfig) => ValidationResult;
  touch: (path: string) => void;
  clear: (path: string) => void;
  validateAll: () => boolean;
  registerField: (path: string, config: ValidationConfig) => void;
}

export interface ValidationProviderProps {
  customFunctions?: Record<string, ValidationFunction>;
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

const createFieldState = (prev: FieldValidationState | undefined, result: ValidationResult): FieldValidationState => ({
  touched: prev?.touched ?? true,
  validated: true,
  result,
});

const touchFieldState = (prev: FieldValidationState | undefined): FieldValidationState => ({
  touched: true,
  validated: prev?.validated ?? false,
  result: prev?.result ?? null,
});

const removeField = <T extends Record<string, unknown>>(obj: T, key: string): Omit<T, string> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [key]: _unused, ...rest } = obj;
  return rest;
};

export const createValidationContext = (props: ValidationProviderProps = {}): ValidationContextValue => {
  const { customFunctions: initialFunctions = {}, dataContext: providedDataContext } = props;

  const customFunctionsStore = writable<Record<string, ValidationFunction>>(initialFunctions);
  const fieldStatesStore = writable<Record<string, FieldValidationState>>({});
  const fieldConfigsStore = writable<Record<string, ValidationConfig>>({});

  let dataContext: DataContextValue | null = getOrCreateDataContext(providedDataContext);

  const registerField = (path: string, config: ValidationConfig) => {
    fieldConfigsStore.update((prev) => ({ ...prev, [path]: config }));
  };

  const validate = (path: string, config: ValidationConfig): ValidationResult => {
    const currentDataContext = dataContext || getOrCreateDataContext(undefined);
    if (!currentDataContext) {
      return { valid: false, errors: ['Data context not available'], checks: [] };
    }
    dataContext = currentDataContext;

    const { data, authState } = currentDataContext;
    const $data = get(data);
    const $authState = get(authState);
    const $customFunctions = get(customFunctionsStore);

    const value = getByPath($data, path);
    const result = runValidation(config, {
      value,
      dataModel: $data,
      customFunctions: $customFunctions,
      authState: $authState,
    });

    fieldStatesStore.update((prev) => ({
      ...prev,
      [path]: createFieldState(prev[path], result),
    }));

    return result;
  };

  const touch = (path: string) => {
    fieldStatesStore.update((prev) => ({
      ...prev,
      [path]: touchFieldState(prev[path]),
    }));
  };

  const clear = (path: string) => {
    fieldStatesStore.update((prev) => removeField(prev, path));
  };

  const validateAll = (): boolean => {
    const $fieldConfigs = get(fieldConfigsStore);
    return Object.entries($fieldConfigs).every(([path, config]) => {
      const result = validate(path, config);
      return result.valid;
    });
  };

  return {
    customFunctions: customFunctionsStore,
    fieldStates: fieldStatesStore,
    validate,
    touch,
    clear,
    validateAll,
    registerField,
  };
};

export const getValidationContext = (): ValidationContextValue => {
  const context = getContext<ValidationContextValue>(VALIDATION_CONTEXT_KEY);
  if (!context) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
};

export const setValidationContext = (value: ValidationContextValue): void => {
  setContext(VALIDATION_CONTEXT_KEY, value);
};

export const useValidation = (): ValidationContextValue => getValidationContext();

export const useFieldValidation = (
  path: string,
  config?: ValidationConfig,
): {
  state: Readable<FieldValidationState>;
  validate: () => ValidationResult;
  touch: () => void;
  clear: () => void;
  errors: Readable<string[]>;
  isValid: Readable<boolean>;
} => {
  const {
    fieldStates,
    validate: validateField,
    touch: touchField,
    clear: clearField,
    registerField,
  } = getValidationContext();

  if (config) {
    registerField(path, config);
  }

  const state = derived(fieldStates, ($states) => {
    return (
      $states[path] ?? {
        touched: false,
        validated: false,
        result: null,
      }
    );
  });

  const validate = () => validateField(path, config ?? { checks: [] });
  const touch = () => touchField(path);
  const clear = () => clearField(path);

  const errors = derived(state, ($state) => $state.result?.errors ?? []);
  const isValid = derived(state, ($state) => $state.result?.valid ?? true);

  return {
    state,
    validate,
    touch,
    clear,
    errors,
    isValid,
  };
};
