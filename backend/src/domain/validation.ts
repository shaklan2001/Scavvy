import { z } from 'zod';

export const locationTypeSchema = z.enum(['home', 'office', 'campus', 'outdoors', 'other']);
export const hintLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export function assertExactlyThreeImages(images: readonly Buffer[]): void {
  if (images.length !== 3) {
    throw new Error('Exactly 3 environment images are required');
  }
}
