import { describe, expect, it } from 'vitest'
import {
  isValidPriestId,
  sanitizeString,
} from '../../worker/lib/validate'

describe('sanitizeString', () => {
  it('trims and returns a valid string', () => {
    expect(sanitizeString('  forgive me father  ', 100)).toBe('forgive me father')
  })

  it('returns null for non-strings', () => {
    expect(sanitizeString(undefined, 100)).toBeNull()
    expect(sanitizeString(42, 100)).toBeNull()
    expect(sanitizeString({ text: 'hi' }, 100)).toBeNull()
  })

  it('returns null for empty strings after trimming', () => {
    expect(sanitizeString('   ', 100)).toBeNull()
  })

  it('returns null for strings longer than maxLength', () => {
    expect(sanitizeString('abcdef', 5)).toBeNull()
  })
})

describe('isValidPriestId', () => {
  it('accepts lowercase UUID-like ids', () => {
    expect(isValidPriestId('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('rejects obviously invalid ids', () => {
    expect(isValidPriestId('not-a-real-id!')).toBe(false)
    expect(isValidPriestId('SHORT')).toBe(false)
    expect(isValidPriestId('ABCDEF12')).toBe(false)
  })
})
