export type FormValues = Record<string, string>;

export type FieldError = {
  field: string;
  message: string;
  values: FormValues;
};

export function fieldError(
  values: FormValues,
  field: string,
  message: string,
): FieldError {
  return {
    field,
    message: `${field}: ${message}`,
    values: { ...values },
  };
}

export type PartialFailure<T> = {
  failedPart: string;
  loaded: T;
};

export function partialFailure<T>(loaded: T, failedPart: string): PartialFailure<T> {
  return { failedPart, loaded };
}
