import { defaultReminderDateTime, msUntilDateTime, formatDateTimeTarget } from "./pending-time"

const MS_HOUR = 60 * 60 * 1000

// Local-time construction keeps these tests timezone-independent.
const noon = new Date(2026, 6, 18, 12, 0, 0)

describe("msUntilDateTime", () => {
  it("returns the delta to a future datetime today", () => {
    expect(msUntilDateTime("2026-07-18T15:30", noon)).toBe(3.5 * MS_HOUR)
  })

  it("returns the delta to a datetime on a later day", () => {
    expect(msUntilDateTime("2026-07-20T09:00", noon)).toBe(45 * MS_HOUR)
  })

  it("returns null for past datetimes", () => {
    expect(msUntilDateTime("2026-07-18T09:00", noon)).toBeNull()
    expect(msUntilDateTime("2026-07-17T09:00", noon)).toBeNull()
  })

  it("returns null for empty or invalid input", () => {
    expect(msUntilDateTime("")).toBeNull()
    expect(msUntilDateTime("not-a-date")).toBeNull()
  })
})

describe("formatDateTimeTarget", () => {
  it("labels a time later today", () => {
    expect(formatDateTimeTarget("2026-07-18T15:30", noon)).toMatch(/^today /)
  })

  it("labels tomorrow", () => {
    expect(formatDateTimeTarget("2026-07-19T09:00", noon)).toMatch(/^tomorrow /)
  })

  it("labels later dates with the date, not today/tomorrow", () => {
    const label = formatDateTimeTarget("2026-07-20T09:00", noon)
    expect(label).not.toMatch(/^(today|tomorrow) /)
    expect(label).toContain("20")
  })

  it("returns null for past or invalid input", () => {
    expect(formatDateTimeTarget("2026-07-18T08:00", noon)).toBeNull()
    expect(formatDateTimeTarget("nope")).toBeNull()
  })
})

describe("defaultReminderDateTime", () => {
  it("is valid and about one hour in the future", () => {
    const ms = msUntilDateTime(defaultReminderDateTime(noon), noon)
    expect(ms).toBeGreaterThan(59 * 60 * 1000)
    expect(ms).toBeLessThanOrEqual(MS_HOUR)
  })
})
