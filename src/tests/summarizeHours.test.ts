import { describe, test, expect } from "bun:test";
import type { IcsEvent, ParsedIcsData } from "@jalexw/calendar-ics-parser";
import summarizeHours, {
  type ISummaryGenerationResult,
} from "@/lib/summarizeHours";

function makeEvent(overrides: Partial<IcsEvent>): IcsEvent {
  return {
    uid: "uid",
    dtstamp: "20250101T000000Z",
    summary: "Proj - Something",
    dtstart: "20251117T120000",
    dtend: "20251117T130000",
    ...overrides,
  } as IcsEvent;
}

function makeData(...eventGroups: readonly (readonly IcsEvent[])[]): ParsedIcsData {
  return {
    calendars: eventGroups.map((events, i) => ({
      name: `calendar-${i}`,
      events: [...events],
    })),
  } as unknown as ParsedIcsData;
}

const silent = (): void => {
  /* no-op */
};

describe("summarizeHours", () => {
  test("sums billable hours across events and calendars", () => {
    const data: ParsedIcsData = makeData(
      [
        makeEvent({ uid: "1", dtstart: "20251117T120000", dtend: "20251117T130000" }),
        makeEvent({ uid: "2", dtstart: "20251118T120000", dtend: "20251118T143000" }),
      ],
      [makeEvent({ uid: "3", dtstart: "20251119T090000", dtend: "20251119T094500" })],
    );
    const result: ISummaryGenerationResult = summarizeHours({ data, log: silent });
    expect(result.events).toHaveLength(3);
    expect(result.sum).toBeCloseTo(1 + 2.5 + 0.75, 10);
    expect(result.events.map((e) => e.id)).toEqual(["1", "2", "3"]);
  });

  test("strips the project prefix from descriptions when a project filter is set", () => {
    const data: ParsedIcsData = makeData([
      makeEvent({ uid: "1", summary: "Proj - Kickoff" }),
      makeEvent({ uid: "2", summary: "Proj | Review" }),
      makeEvent({ uid: "3", summary: "Work on Proj - Build" }),
      makeEvent({ uid: "4", summary: "Proj" }),
    ]);
    const result = summarizeHours({ data, filters: { project: "Proj" }, log: silent });
    expect(result.events.map((e) => e.description)).toEqual([
      "Kickoff",
      "Review",
      "Build",
      "Proj",
    ]);
  });

  test("treats all-day (DATE) events as 0 billable hours with a valid start date", () => {
    const data: ParsedIcsData = makeData([
      makeEvent({ uid: "allday", summary: "Deadline", dtstart: "20260213", dtend: "20260214" }),
      makeEvent({ uid: "timed", dtstart: "20260213T120000", dtend: "20260213T140000" }),
    ]);
    const result = summarizeHours({ data, log: silent });
    expect(result.sum).toBe(2);
    const allDay = result.events.find((e) => e.id === "allday");
    expect(allDay).toBeDefined();
    expect(allDay!.durationHours).toBe(0);
    expect(allDay!.startTime.getTime()).toBe(new Date(2026, 1, 13).getTime());
  });

  test("never produces NaN hours or invalid start dates", () => {
    const data: ParsedIcsData = makeData([
      makeEvent({ uid: "no-end", dtend: undefined }),
      makeEvent({ uid: "bad-end", dtend: "garbage" }),
      makeEvent({ uid: "negative", dtstart: "20251117T130000", dtend: "20251117T120000" }),
      makeEvent({ uid: "ok" }),
    ]);
    const result = summarizeHours({ data, log: silent });
    expect(result.events).toHaveLength(4);
    for (const event of result.events) {
      expect(Number.isFinite(event.durationHours)).toBeTrue();
      expect(event.durationHours).toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(event.startTime.getTime())).toBeFalse();
    }
    expect(result.sum).toBe(1);
  });

  test("skips events whose start time is missing or unparseable instead of throwing", () => {
    const logs: string[] = [];
    const data: ParsedIcsData = makeData([
      makeEvent({ uid: "no-start", dtstart: undefined }),
      makeEvent({ uid: "bad-start", dtstart: "garbage" }),
      makeEvent({ uid: "ok" }),
    ]);
    const result = summarizeHours({
      data,
      log: (...vals) => logs.push(vals.map(String).join(" ")),
    });
    expect(result.events.map((e) => e.id)).toEqual(["ok"]);
    expect(result.sum).toBe(1);
    expect(logs.some((line) => line.includes("Skipping event 'no-start'"))).toBeTrue();
    expect(logs.some((line) => line.includes("Skipping event 'bad-start'"))).toBeTrue();
  });

  test("applies filters before summing", () => {
    const data: ParsedIcsData = makeData([
      makeEvent({ uid: "1", summary: "Proj - A" }),
      makeEvent({ uid: "2", summary: "Other - B" }),
    ]);
    const result = summarizeHours({ data, filters: { project: "Proj" }, log: silent });
    expect(result.events.map((e) => e.id)).toEqual(["1"]);
    expect(result.sum).toBe(1);
  });

  test("returns an empty summary for a calendar with no events", () => {
    const result = summarizeHours({ data: makeData([]), log: silent });
    expect(result.events).toHaveLength(0);
    expect(result.sum).toBe(0);
  });
});
