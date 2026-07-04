import { describe, it, expect } from 'vitest'
import { cn } from '../../lib/utils'

describe('cn (classname utility)', () => {
  it('should return a single class unchanged', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  it('should merge multiple class strings', () => {
    expect(cn('px-4', 'py-2', 'bg-blue-500')).toBe('px-4 py-2 bg-blue-500')
  })

  it('should handle conditional classes (truthy)', () => {
    expect(cn('base', true && 'active')).toBe('base active')
  })

  it('should exclude conditional classes that are falsy', () => {
    expect(cn('base', false && 'inactive')).toBe('base')
  })

  it('should override conflicting tailwind classes (last one wins)', () => {
    expect(cn('px-4', 'px-8')).toBe('px-8')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should handle object syntax', () => {
    expect(cn({ 'font-bold': true, 'font-normal': false })).toBe('font-bold')
  })

  it('should handle array inputs', () => {
    expect(cn(['text-sm', 'font-medium'])).toBe('text-sm font-medium')
  })

  it('should handle undefined and null gracefully', () => {
    expect(cn('base', undefined, null as any)).toBe('base')
  })

  it('should return empty string when no arguments are provided', () => {
    expect(cn()).toBe('')
  })

  it('should handle mixed input types', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'is-active', { 'font-bold': true })
    expect(result).toBe('base-class is-active font-bold')
  })

  it('should merge tailwind padding shorthand conflicts correctly', () => {
    expect(cn('p-4', 'px-2')).toBe('p-4 px-2')
  })
})
