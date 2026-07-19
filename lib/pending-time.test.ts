import { msUntilClockTime, formatClockTimeTarget } from "./pending-time"

const MS_HOUR = 60 * 60 * 1000

// Local-time construction keeps these tests timezone-independent.
const noon = new Date(2026, 6, 18, 12, 0, 0)

describe("msUntilClockTime", () => {
  it("returns the delta to a later time today", () => {
    expect(msUntilClockTime("15:30", noon)).toBe(3.5 * MS_HOUR)
  })

  it("rolls over to tomorrow when the time has already passed", () => {
    expect(msUntilClockTime("09:00", noon)).toBe(21 * MS_HOUR)
  })

  it("treats the current minute as already passed", () => {
    expect(msUntilClockTime("12:00", noon)).toBe(24 * MS_HOUR)
  })

  it("handles midnight correctly", () => {
    expect(msUntilClockTime("00:00", noon)).toBe(12 * MS_HOUR)
  })

  it("returns null for invalid input", () => {
    expect(msUntilClockTime("")).toBeNull()
    expect(msUntilClockTime("abc")).toBeNull()
    expect(msUntilClockTime("25:00")).toBeNull()
    expect(msUntilClockTime("10:99")).toBeNull()
    expect(msUntilClockTime("1:5")).toBeNull()
  })
})

describe("formatClockTimeTarget", () => {
  it("labels a later time as today", () => {
    expect(formatClockTimeTarget("15:30", noon)).toMatch(/^today /)
  })

  it("labels a rolled-over time as tomorrow", () => {
    expect(formatClockTimeTarget("09:00", noon)).toMatch(/^tomorrow /)
  })

  it("returns null for invalid input", () => {
    expect(formatClockTimeTarget("nope")).toBeNull()
  })
})
