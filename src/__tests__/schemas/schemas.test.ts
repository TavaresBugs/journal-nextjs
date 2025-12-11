import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '@/schemas/authSchema';
import { tradeSchema } from '@/schemas/tradeSchema';
import { journalSchema } from '@/schemas/journalSchema';

describe('Auth Schemas', () => {
  it('should validate correct login data', () => {
    const data = { email: 'test@example.com', password: 'password123' };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email in login', () => {
    const data = { email: 'invalid-email', password: 'password123' };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should validate correct register data', () => {
    const data = {
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      name: 'Test User'
    };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject weak password in register', () => {
    const data = {
      email: 'test@example.com',
      password: 'weak',
      confirmPassword: 'weak',
      name: 'Test User'
    };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject mismatching passwords in register', () => {
    const data = {
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password456',
      name: 'Test User'
    };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('Trade Schema', () => {
  it('should validate correct trade data', () => {
    const data = {
      symbol: 'EURUSD',
      type: 'Long',
      entryPrice: 1.1234,
      stopLoss: 1.1200,
      takeProfit: 1.1300,
      lot: 0.1,
      entryDate: '2023-10-27',
      accountId: '123e4567-e89b-12d3-a456-426614174000'
    };
    const result = tradeSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid trade type', () => {
    const data = {
      symbol: 'EURUSD',
      type: 'Invalid',
      entryPrice: 1.1234,
      stopLoss: 1.1200,
      takeProfit: 1.1300,
      lot: 0.1,
      entryDate: '2023-10-27',
      accountId: '123e4567-e89b-12d3-a456-426614174000'
    };
    const result = tradeSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject negative numbers for prices', () => {
     const data = {
      symbol: 'EURUSD',
      type: 'Long',
      entryPrice: -1.1234,
      stopLoss: 1.1200,
      takeProfit: 1.1300,
      lot: 0.1,
      entryDate: '2023-10-27',
      accountId: '123e4567-e89b-12d3-a456-426614174000'
    };
    const result = tradeSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('Journal Schema', () => {
  it('should validate correct journal data', () => {
    const data = {
      date: '2023-10-27',
      title: 'My Trading Day',
      accountId: '123e4567-e89b-12d3-a456-426614174000'
    };
    const result = journalSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid date format', () => {
    const data = {
      date: '27-10-2023',
      title: 'My Trading Day',
      accountId: '123e4567-e89b-12d3-a456-426614174000'
    };
    const result = journalSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
