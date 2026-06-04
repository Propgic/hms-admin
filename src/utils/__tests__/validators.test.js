import { describe, it, expect, vi } from 'vitest';
import {
  LETTERS_ONLY,
  PHONE_ONLY,
  PINCODE_ONLY,
  DIGITS_ONLY,
  nameField,
  optionalNameField,
  phoneField,
  optionalPhoneField,
  pincodeField,
  blockDigits,
  allowDigitsOnly,
  allowPhoneChars,
} from '../validators';

describe('regex constants', () => {
  describe('LETTERS_ONLY', () => {
    it('accepts plain letters', () => {
      expect(LETTERS_ONLY.test('John')).toBe(true);
    });
    it('accepts names with spaces, apostrophes, hyphens and dots', () => {
      expect(LETTERS_ONLY.test("Mary-Jane O'Neil Jr.")).toBe(true);
    });
    it('rejects strings containing digits', () => {
      expect(LETTERS_ONLY.test('John3')).toBe(false);
    });
    it('rejects strings starting with non-letter', () => {
      expect(LETTERS_ONLY.test('.John')).toBe(false);
      expect(LETTERS_ONLY.test(' John')).toBe(false);
    });
    it('rejects empty string', () => {
      expect(LETTERS_ONLY.test('')).toBe(false);
    });
  });

  describe('PHONE_ONLY', () => {
    it('accepts 10 digits', () => {
      expect(PHONE_ONLY.test('1234567890')).toBe(true);
    });
    it('accepts 15 digits', () => {
      expect(PHONE_ONLY.test('123456789012345')).toBe(true);
    });
    it('accepts a leading plus', () => {
      expect(PHONE_ONLY.test('+1234567890')).toBe(true);
    });
    it('rejects fewer than 10 digits', () => {
      expect(PHONE_ONLY.test('123456789')).toBe(false);
    });
    it('rejects more than 15 digits', () => {
      expect(PHONE_ONLY.test('1234567890123456')).toBe(false);
    });
    it('rejects letters', () => {
      expect(PHONE_ONLY.test('12345abcde')).toBe(false);
    });
    it('rejects empty string', () => {
      expect(PHONE_ONLY.test('')).toBe(false);
    });
  });

  describe('PINCODE_ONLY', () => {
    it('accepts exactly 6 digits', () => {
      expect(PINCODE_ONLY.test('560001')).toBe(true);
    });
    it('rejects 5 digits', () => {
      expect(PINCODE_ONLY.test('56000')).toBe(false);
    });
    it('rejects 7 digits', () => {
      expect(PINCODE_ONLY.test('5600012')).toBe(false);
    });
    it('rejects non-digits', () => {
      expect(PINCODE_ONLY.test('5600a1')).toBe(false);
    });
  });

  describe('DIGITS_ONLY', () => {
    it('accepts a single digit', () => {
      expect(DIGITS_ONLY.test('5')).toBe(true);
    });
    it('accepts many digits', () => {
      expect(DIGITS_ONLY.test('1234567890')).toBe(true);
    });
    it('rejects empty string', () => {
      expect(DIGITS_ONLY.test('')).toBe(false);
    });
    it('rejects mixed alpha', () => {
      expect(DIGITS_ONLY.test('12a3')).toBe(false);
    });
  });
});

describe('nameField', () => {
  it('passes a valid name', () => {
    const result = nameField().safeParse('Alice');
    expect(result.success).toBe(true);
  });

  it('fails when shorter than the default min (2)', () => {
    const result = nameField().safeParse('A');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Name must be at least 2 characters');
  });

  it('respects a custom label and min', () => {
    const result = nameField('First name', 3).safeParse('Al');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('First name must be at least 3 characters');
  });

  it('fails when the value contains numbers', () => {
    const result = nameField('First name').safeParse('Al1ce');
    expect(result.success).toBe(false);
    expect(result.error.issues.some((i) => i.message === 'First name cannot contain numbers')).toBe(true);
  });

  it('rejects a non-string value', () => {
    const result = nameField().safeParse(42);
    expect(result.success).toBe(false);
  });
});

describe('optionalNameField', () => {
  it('passes when undefined', () => {
    const result = optionalNameField().safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it('passes a valid name', () => {
    const result = optionalNameField().safeParse('Bob');
    expect(result.success).toBe(true);
  });

  it('fails when a provided value has digits', () => {
    const result = optionalNameField('Middle name').safeParse('Bo1b');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Middle name cannot contain numbers');
  });
});

describe('phoneField', () => {
  it('passes a valid 10-digit phone', () => {
    const result = phoneField().safeParse('9876543210');
    expect(result.success).toBe(true);
  });

  it('passes with a leading plus', () => {
    const result = phoneField().safeParse('+919876543210');
    expect(result.success).toBe(true);
  });

  it('fails for too-short input with the labelled message', () => {
    const result = phoneField('Mobile').safeParse('123');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Mobile must be 10–15 digits, no letters');
  });

  it('fails when input has letters', () => {
    const result = phoneField().safeParse('98765abcde');
    expect(result.success).toBe(false);
  });
});

describe('optionalPhoneField', () => {
  it('passes when undefined', () => {
    const result = optionalPhoneField().safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it('passes for an empty string', () => {
    const result = optionalPhoneField().safeParse('');
    expect(result.success).toBe(true);
  });

  it('passes a valid phone', () => {
    const result = optionalPhoneField().safeParse('1234567890');
    expect(result.success).toBe(true);
  });

  it('fails for a malformed non-empty value', () => {
    const result = optionalPhoneField('Alt phone').safeParse('12-34');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Alt phone must be 10–15 digits, no letters');
  });
});

describe('pincodeField', () => {
  it('passes for exactly 6 digits', () => {
    const result = pincodeField().safeParse('110011');
    expect(result.success).toBe(true);
  });

  it('fails for the wrong length with the labelled message', () => {
    const result = pincodeField('Zip').safeParse('1100');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Zip must be exactly 6 digits');
  });

  it('fails for non-digit characters', () => {
    const result = pincodeField().safeParse('11x011');
    expect(result.success).toBe(false);
  });
});

describe('blockDigits', () => {
  it('prevents default when the key is a digit', () => {
    const preventDefault = vi.fn();
    blockDigits({ key: '5', preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('does not prevent default for a letter', () => {
    const preventDefault = vi.fn();
    blockDigits({ key: 'a', preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
  });
});

describe('allowDigitsOnly', () => {
  it('prevents default for a non-digit single character', () => {
    const preventDefault = vi.fn();
    allowDigitsOnly({ key: 'a', preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('allows a digit key', () => {
    const preventDefault = vi.fn();
    allowDigitsOnly({ key: '7', preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('allows multi-character keys like Backspace', () => {
    const preventDefault = vi.fn();
    allowDigitsOnly({ key: 'Backspace', preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('allows keyboard shortcuts with meta/ctrl held', () => {
    const preventDefault = vi.fn();
    allowDigitsOnly({ key: 'a', metaKey: true, preventDefault });
    allowDigitsOnly({ key: 'c', ctrlKey: true, preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
  });
});

describe('allowPhoneChars', () => {
  it('allows a digit', () => {
    const preventDefault = vi.fn();
    allowPhoneChars({ key: '9', preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('allows a plus sign', () => {
    const preventDefault = vi.fn();
    allowPhoneChars({ key: '+', preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('prevents default for a letter', () => {
    const preventDefault = vi.fn();
    allowPhoneChars({ key: 'b', preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('allows multi-character keys like ArrowLeft', () => {
    const preventDefault = vi.fn();
    allowPhoneChars({ key: 'ArrowLeft', preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('allows ctrl/meta shortcuts', () => {
    const preventDefault = vi.fn();
    allowPhoneChars({ key: 'v', ctrlKey: true, preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
