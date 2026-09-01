import { describe, test, expect } from "bun:test";
import parseDate, { isIcsDateOnly, isValidDate } from "@/lib/parseDate";

describe("parseDate", () => {
  test("parses a floating DATE-TIME value as local time", () => {
    const parsed: Date = parseDate("20251117T120000");
    expect(parsed.getTime()).toBe(new Date(2025, 10, 17, 12, 0, 0).getTime());
  });

  test("parses a UTC DATE-TIME value (Z suffix) as UTC", () => {
    const parsed: Date = parseDate("20251125T130613Z");
    expect(parsed.getTime()).toBe(Date.UTC(2025, 10, 25, 13, 6, 13));
  });

  test("parses a DATE value (all-day event) as local midnight", () => {
    const parsed: Date = parseDate("20260213");
    expect(parsed.getTime()).toBe(new Date(2026, 1, 13).getTime());
  });

  test("tolerates surrounding whitespace", () => {
    expect(parseDate(" 20260213 ").getTime()).toBe(
      new Date(2026, 1, 13).getTime(),
    );
  });

  test("returns an invalid Date for garbage input instead of throwing", () => {
    for (const input of ["", "not-a-date", "2025-11-17", "20251117T12", "2025111712000000"]) {
      const parsed: Date = parseDate(input);
      expect(Number.isNaN(parsed.getTime())).toBeTrue();
    }
  });

  test("returns an invalid Date for out-of-range components", () => {
    expect(isValidDate(parseDate("20251317T120000"))).toBeFalse(); // month 13
    expect(isValidDate(parseDate("20251100T120000"))).toBeFalse(); // day 0
    expect(isValidDate(parseDate("20251117T250000"))).toBeFalse(); // hour 25
    expect(isValidDate(parseDate("20251117T126000"))).toBeFalse(); // minute 60
  });

  test("returns an invalid Date for non-string input", () => {
    expect(
      isValidDate(parseDate(undefined as unknown as string)),
    ).toBeFalse();
  });
});

describe("isIcsDateOnly", () => {
  test("detects DATE values", () => {
    expect(isIcsDateOnly("20260213")).toBeTrue();
  });
  test("does not flag DATE-TIME values", () => {
    expect(isIcsDateOnly("20260213T120000")).toBeFalse();
    expect(isIcsDateOnly("20260213T120000Z")).toBeFalse();
  });
});

describe("isValidDate", () => {
  test("accepts valid dates and rejects invalid ones and non-dates", () => {
    expect(isValidDate(new Date(2020, 0, 1))).toBeTrue();
    expect(isValidDate(new Date(Number.NaN))).toBeFalse();
    expect(isValidDate(null)).toBeFalse();
    expect(isValidDate(undefined)).toBeFalse();
    expect(isValidDate("2020-01-01")).toBeFalse();
  });
});
