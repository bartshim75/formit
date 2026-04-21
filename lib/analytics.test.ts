import { describe, it, expect } from 'vitest';

import { captureEvent } from '@/lib/analytics';

describe('analytics', () => {
  it('captureEvent does not throw', () => {
    expect(() => captureEvent('test_event', { a: 1 })).not.toThrow();
  });
});
