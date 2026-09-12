import { describe, expect, it } from 'vitest';
import { rateLimitBucketKey } from './redis';

describe('rateLimitBucketKey', () => {
  it('keeps requests in the same fixed window together', () => {
    expect(rateLimitBucketKey('generation', 'user-1', 60, 120_000)).toBe('sonora:rl:generation:user-1:2');
    expect(rateLimitBucketKey('generation', 'user-1', 60, 179_999)).toBe('sonora:rl:generation:user-1:2');
  });

  it('rolls into a new bucket at the next window boundary', () => {
    expect(rateLimitBucketKey('upload', 'user-1', 300, 299_999)).toBe('sonora:rl:upload:user-1:0');
    expect(rateLimitBucketKey('upload', 'user-1', 300, 300_000)).toBe('sonora:rl:upload:user-1:1');
  });
});
