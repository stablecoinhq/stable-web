/* eslint-disable import/prefer-default-export */

export const getStringQuery = (value: string | string[] | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  return value[0];
};
