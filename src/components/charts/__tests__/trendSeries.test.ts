import { describe, expect, it } from '@jest/globals';

import { trendSeries } from '../trendSeries';

const day = (n: number, expense: number) => ({ day: n, income: 0, expense });

describe('trendSeries', () => {
  it('adds up spending day by day, starting from 0', () => {
    const { spent } = trendSeries([day(1, 500), day(2, 0), day(3, 1250)], null, 31);
    expect(spent).toEqual([0, 500, 500, 1750]);
  });

  it('has no pace line without a budget', () => {
    expect(trendSeries([day(1, 500)], null, 30).pace).toBeNull();
  });

  it('spreads the budget evenly across the whole month', () => {
    // 30-day month, PKR 300 limit: PKR 10 a day.
    const { pace } = trendSeries([day(1, 0), day(2, 0), day(3, 0)], 30000, 30);
    expect(pace).toEqual([0, 1000, 2000, 3000]);
  });

  it('draws a line even on the 1st of the month', () => {
    expect(trendSeries([day(1, 900)], 30000, 30).spent).toHaveLength(2);
  });
});
