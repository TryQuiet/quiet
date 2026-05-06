const camelCaseRegex = /^[a-z][A-Za-z]*$/u;

/**
 * @description Utility function for plop generator.
 */
export const requireCamelCase =
  (errorMessage: string) =>
  (promptValue: string): boolean | string =>
    camelCaseRegex.test(promptValue) ? true : errorMessage;
