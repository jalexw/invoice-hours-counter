import { describe, test, expect } from "bun:test";
import type { IcsEvent } from "@jalexw/calendar-ics-parser";
import filterEvents from "@/lib/filterEvents";

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

describe("filterEvents", () => {
  test("passes everything through when no filters are set", () => {
    expect(filterEvents(makeEvent({}), {})).toBeTrue();
  });

  test("drops events without a summary", () => {
    expect(filterEvents(makeEvent({ summary: undefined }), {})).toBeFalse();
  });

  describe("project filter", () => {
    const accepted: readonly string[] = [
      "Proj - Something",
      "Proj | Something",
      "Proj Call with client",
      "Proj call",
      "Proj",
      "Work on Proj",
      "Working on Proj stuff",
      "Connect with Bob x Proj",
      "Create designs for Proj",
      "  Proj - trimmed  ",
    ];
    for (const summary of accepted) {
      test(`accepts '${summary}'`, () => {
        expect(
          filterEvents(makeEvent({ summary }), { project: "Proj" }),
        ).toBeTrue();
      });
    }

    const rejected: readonly string[] = [
      "Project Deadline",
      "Other - Something",
      "Something about Proj",
      "Projx - Something",
    ];
    for (const summary of rejected) {
      test(`rejects '${summary}'`, () => {
        expect(
          filterEvents(makeEvent({ summary }), { project: "Proj" }),
        ).toBeFalse();
      });
    }

    test("an empty project filter is treated as no filter", () => {
      expect(
        filterEvents(makeEvent({ summary: "Anything" }), { project: "" }),
      ).toBeTrue();
      expect(
        filterEvents(makeEvent({ summary: "Anything" }), { project: null }),
      ).toBeTrue();
    });
  });

  describe("after filter", () => {
    test("keeps events starting at or after the boundary", () => {
      const after: Date = new Date(2025, 10, 17, 12, 0, 0);
      expect(filterEvents(makeEvent({}), { after })).toBeTrue();
    });

    test("drops events starting before the boundary", () => {
      const after: Date = new Date(2025, 10, 17, 12, 0, 1);
      expect(filterEvents(makeEvent({}), { after })).toBeFalse();
    });

    test("drops events with a missing or unparseable start when filtering", () => {
      const after: Date = new Date(2020, 0, 1);
      expect(
        filterEvents(makeEvent({ dtstart: undefined }), { after }),
      ).toBeFalse();
      expect(
        filterEvents(makeEvent({ dtstart: "garbage" }), { after }),
      ).toBeFalse();
    });

    test("an invalid after Date is treated as no filter", () => {
      expect(
        filterEvents(makeEvent({}), { after: new Date(Number.NaN) }),
      ).toBeTrue();
    });

    test("applies to all-day events using their DATE value", () => {
      const allDay: IcsEvent = makeEvent({
        dtstart: "20260213",
        dtend: "20260214",
      });
      expect(
        filterEvents(allDay, { after: new Date(2026, 1, 13) }),
      ).toBeTrue();
      expect(
        filterEvents(allDay, { after: new Date(2026, 1, 14) }),
      ).toBeFalse();
    });
  });

  describe("before filter", () => {
    test("keeps events ending at or before the boundary", () => {
      const before: Date = new Date(2025, 10, 17, 13, 0, 0);
      expect(filterEvents(makeEvent({}), { before })).toBeTrue();
    });

    test("drops events ending after the boundary", () => {
      const before: Date = new Date(2025, 10, 17, 12, 59, 59);
      expect(filterEvents(makeEvent({}), { before })).toBeFalse();
    });

    test("drops events with a missing or unparseable end when filtering", () => {
      const before: Date = new Date(2030, 0, 1);
      expect(
        filterEvents(makeEvent({ dtend: undefined }), { before }),
      ).toBeFalse();
      expect(
        filterEvents(makeEvent({ dtend: "garbage" }), { before }),
      ).toBeFalse();
    });
  });
});
