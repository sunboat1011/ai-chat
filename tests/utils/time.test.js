import { describe, it, expect } from 'vitest'
import { formatAbsolute, formatRelative, formatISOTime } from '@/utils/time'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

describe('utils/time', () => {
  describe('formatAbsolute', () => {
    it('returns empty string for null/undefined/0', () => {
      expect(formatAbsolute(null)).toBe('')
      expect(formatAbsolute(undefined)).toBe('')
      expect(formatAbsolute(0)).toBe('')
    })

    it('formats a timestamp as YYYY-MM-DD HH:MM:SS', () => {
      // 2026-05-20 14:23:45 local time
      const d = new Date(2026, 4, 20, 14, 23, 45)
      expect(formatAbsolute(d.getTime())).toBe('2026-05-20 14:23:45')
    })

    it('zero-pads single-digit month/day/time components', () => {
      const d = new Date(2026, 0, 5, 3, 7, 9)
      expect(formatAbsolute(d.getTime())).toBe('2026-01-05 03:07:09')
    })
  })

  describe('formatISOTime', () => {
    it('returns empty string for falsy timestamps', () => {
      expect(formatISOTime(null)).toBe('')
      expect(formatISOTime(0)).toBe('')
    })

    it('returns a valid ISO 8601 string', () => {
      const ts = Date.UTC(2026, 4, 20, 0, 0, 0)
      expect(formatISOTime(ts)).toBe('2026-05-20T00:00:00.000Z')
    })
  })

  describe('formatRelative', () => {
    const now = new Date(2026, 4, 20, 12, 0, 0).getTime()

    it('returns empty string for falsy timestamps', () => {
      expect(formatRelative(null, now)).toBe('')
      expect(formatRelative(undefined, now)).toBe('')
    })

    it('"just now" when within the past minute', () => {
      expect(formatRelative(now - 30 * 1000, now)).toBe('just now')
      expect(formatRelative(now, now)).toBe('just now')
    })

    it('"N min ago" within the past hour', () => {
      expect(formatRelative(now - 5 * MINUTE, now)).toBe('5 min ago')
      expect(formatRelative(now - 59 * MINUTE, now)).toBe('59 min ago')
    })

    it('"N hr ago" between 1h and 6h', () => {
      expect(formatRelative(now - 2 * HOUR, now)).toBe('2 hr ago')
      expect(formatRelative(now - 5 * HOUR, now)).toBe('5 hr ago')
    })

    it('"Today HH:MM" on the same calendar day after 6h', () => {
      const earlierToday = new Date(2026, 4, 20, 1, 30, 0).getTime()
      expect(formatRelative(earlierToday, now)).toBe('Today 01:30')
    })

    it('"Yesterday HH:MM" on the previous calendar day', () => {
      const yesterday = new Date(2026, 4, 19, 20, 15, 0).getTime()
      expect(formatRelative(yesterday, now)).toBe('Yesterday 20:15')
    })

    it('"Weekday HH:MM" within the past 7 days', () => {
      // 2026-05-20 is a Wednesday → 5 days earlier is Friday 2026-05-15
      const lastFri = new Date(2026, 4, 15, 10, 0, 0).getTime()
      expect(formatRelative(lastFri, now)).toBe('Fri 10:00')
    })

    it('"Mon D HH:MM" within the same year but beyond 7 days', () => {
      const sameYear = new Date(2026, 1, 14, 9, 0, 0).getTime()
      expect(formatRelative(sameYear, now)).toBe('Feb 14 09:00')
    })

    it('"YYYY-MM-DD" when crossing year boundary', () => {
      const prevYear = new Date(2025, 11, 31, 23, 0, 0).getTime()
      expect(formatRelative(prevYear, now)).toBe('2025-12-31')
    })

    it('clamps negative diff (timestamp in future) to "just now"', () => {
      expect(formatRelative(now + 5 * MINUTE, now)).toBe('just now')
    })
  })
})
