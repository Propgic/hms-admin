import { z } from 'zod';

// Letters (and common name punctuation) only — no digits.
export const LETTERS_ONLY = /^[A-Za-z][A-Za-z\s.'-]*$/;
// 10–15 digits with an optional leading +.
export const PHONE_ONLY = /^\+?\d{10,15}$/;
// Indian pincode — exactly 6 digits.
export const PINCODE_ONLY = /^\d{6}$/;
// Digits only, any length (used for quantities, counts).
export const DIGITS_ONLY = /^\d+$/;

// Reusable zod primitives — all accept an optional field label for error messages.
export const nameField = (label = 'Name', min = 2) =>
  z.string()
    .min(min, `${label} must be at least ${min} characters`)
    .regex(LETTERS_ONLY, `${label} cannot contain numbers`);

export const optionalNameField = (label = 'Name') =>
  z.string()
    .optional()
    .refine((v) => !v || LETTERS_ONLY.test(v), `${label} cannot contain numbers`);

export const phoneField = (label = 'Phone') =>
  z.string().regex(PHONE_ONLY, `${label} must be 10–15 digits, no letters`);

export const optionalPhoneField = (label = 'Phone') =>
  z.string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || PHONE_ONLY.test(v), `${label} must be 10–15 digits, no letters`);

export const pincodeField = (label = 'Pincode') =>
  z.string().regex(PINCODE_ONLY, `${label} must be exactly 6 digits`);

// Keystroke filters — pass to <Input onKeyDown={...} />.
export const blockDigits = (e) => {
  if (/\d/.test(e.key)) e.preventDefault();
};
export const allowDigitsOnly = (e) => {
  if (e.key.length === 1 && !/\d/.test(e.key) && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
  }
};
export const allowPhoneChars = (e) => {
  if (e.key.length === 1 && !/[\d+]/.test(e.key) && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
  }
};
