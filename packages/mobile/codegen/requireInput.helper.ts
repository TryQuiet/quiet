/**
 * @description Utility function for plop generator.
 */
export const requireInput =
  (errorMessage: string) =>
  (promptValue: string): boolean | string =>
    /.+/u.test(promptValue) ? true : errorMessage;
