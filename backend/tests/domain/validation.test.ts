import { describe, expect, it } from 'vitest';
import {
  assertExactlyThreeImages,
  hintLevelSchema,
  locationTypeSchema,
} from '../../src/domain/validation.js';

describe('domain validation', () => {
  it('accepts the supported adventure location types', () => {
    expect(locationTypeSchema.parse('home')).toBe('home');
    expect(locationTypeSchema.parse('office')).toBe('office');
    expect(locationTypeSchema.parse('campus')).toBe('campus');
    expect(locationTypeSchema.parse('outdoors')).toBe('outdoors');
    expect(locationTypeSchema.parse('other')).toBe('other');
  });

  it('rejects an unsupported adventure location type', () => {
    expect(() => locationTypeSchema.parse('warehouse')).toThrow();
  });

  it('requires exactly three environment images', () => {
    expect(() => assertExactlyThreeImages([])).toThrow('Exactly 3 environment images are required');
    expect(() => assertExactlyThreeImages([Buffer.from('1'), Buffer.from('2')])).toThrow(
      'Exactly 3 environment images are required',
    );
    expect(() => assertExactlyThreeImages([Buffer.from('1'), Buffer.from('2'), Buffer.from('3'), Buffer.from('4')])).toThrow(
      'Exactly 3 environment images are required',
    );
    expect(() => assertExactlyThreeImages([Buffer.from('1'), Buffer.from('2'), Buffer.from('3')])).not.toThrow();
  });

  it('accepts only hint levels one through three', () => {
    expect(hintLevelSchema.parse(1)).toBe(1);
    expect(hintLevelSchema.parse(3)).toBe(3);
    expect(() => hintLevelSchema.parse(0)).toThrow();
    expect(() => hintLevelSchema.parse(4)).toThrow();
  });
});
