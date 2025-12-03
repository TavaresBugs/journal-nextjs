export const TOAST_DURATION = {
  DEFAULT: 3000,
  LOADING: 0,
  ERROR: 5000,
} as const;

export const MODAL_SIZES = {
  SMALL: "2xl",
  MEDIUM: "4xl",
  LARGE: "6xl",
} as const;

export const Z_INDEX = {
  MODAL: 50,
  TOAST: 100,
  DROPDOWN: 40,
} as const;
