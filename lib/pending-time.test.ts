import {
  nextDayOptions,
  defaultDayTime,
  msUntilDayTime,
  formatDayTimeTarget,
} from "./pending-time"

const MS_HOUR = 60 * 60 * 1000

// Local-time construction keeps these tests timezone-independent.
const noon = new Date(2026, 6, 18, 12, 0, 0)

describe("msUntilDayTime", () => {
  it("returns the delta to a later time today", () => {
    expect(msUntilDayTime(0, "15:30", noon)).toBe(3.5 * MS_HOUR)
  })

  it("returns the delta to a time tomorrow", () => {
    expect(msUntilDayTime(1, "09:00", noon)).toBe(21 * MS_HOUR)
  })

  it("returns the delta to a time two days out", () => {
    expect(msUntilDayTime(2, "09:00", noon)).toBe(45 * MS_HOUR)
  })

  it("never rolls over — a past time today is null", () => {
    expect(msUntilDayTime(0, "09:00", noon)).toBeNull()
  })

  it("returns null for invalid input", () => {
    expect(msUntilDayTime(0, "")).toBeNull()
    expect(msUntilDayTime(1, "25:00")).toBeNull()
    expect(msUntilDayTime(1, "10:99")).toBeNull()
    expect(msUntilDayTime(1, "abc")).toBeNull()
  })
})

describe("formatDayTimeTarget", () => {
  it("labels today", () => {
    expect(formatDayTimeTarget(0, "15:30", noon)).toMatch(/^today /)
  })

  it("labels tomorrow", () => {
    expect(formatDayTimeTarget(1, "09:00", noon)).toMatch(/^tomorrow /)
  })

  it("labels later days with the date", () => {
    const label = formatDayTimeTarget(2, "09:00", noon)
    expect(label).not.toMatch(/^(today|tomorrow) /)
    expect(label).toContain("20")
  })

  it("returns null for past or invalid input", () => {
    expect(formatDayTimeTarget(0, "08:00", noon)).toBeNull()
    expect(formatDayTimeTarget(1, "nope")).toBeNull()
  })
})

describe("nextDayOptions", () => {
  it("starts at Today and walks forward", () => {
    const days = nextDayOptions(4, noon)
    expect(days.map(d => d.offset)).toEqual([0, 1, 2, 3])
    expect(days[0].label).toBe("Today")
    days.slice(1).forEach(d => {
      expect(d.label).not.toBe("Today")
      expect(d.label.length).toBeGreaterThan(0)
    })
  })
})

describe("defaultDayTime", () => {
  it("is one hour ahead on the same day", () => {
    expect(defaultDayTime(noon)).toEqual({ dayOffset: 0, time: "13:00" })
  })

  it("moves to tomorrow when the hour crosses midnight", () => {
    expect(defaultDayTime(new Date(2026, 6, 18, 23, 30))).toEqual({ dayOffset: 1, time: "00:30" })
  })

  it("always resolves to a valid target", () => {
    const { dayOffset, time } = defaultDayTime(noon)
    expect(msUntilDayTime(dayOffset, time, noon)).toBeGreaterThan(0)
  })
})
