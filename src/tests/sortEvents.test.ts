import { describe, test, expect } from "bun:test";
import type { IcsEvent } from "@jalexw/calendar-ics-parser";
import sortEvents from "@/lib/sortEvents";

function makeEvent(uid: string, dtstart: string | undefined): IcsEvent {
  return {
    uid,
    dtstamp: "20250101T000000Z",
    summary: uid,
    dtstart,
    dtend: dtstart,
  } as IcsEvent;
}

describe("sortEvents", () => {
  test("sorts events chronologically by start time", () => {
    const events: readonly IcsEvent[] = [
      makeEvent("c", "20251119T120000"),
      makeEvent("a", "20251117T120000"),
      makeEvent("b", "20251118T120000"),
    ];
    expect(sortEvents(events).map((e) => e.uid)).toEqual(["a", "b", "c"]);
  });

  test("does not mutate the input array", () => {
    const events: IcsEvent[] = [
      makeEvent("b", "20251118T120000"),
      makeEvent("a", "20251117T120000"),
    ];
    sortEvents(events);
    expect(events.map((e) => e.uid)).toEqual(["b", "a"]);
  });

  test("is stable for events with identical start times", () => {
    const events: readonly IcsEvent[] = [
      makeEvent("first", "20251117T120000"),
      makeEvent("second", "20251117T120000"),
      makeEvent("third", "20251117T120000"),
    ];
    expect(sortEvents(events).map((e) => e.uid)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  test("places events with missing or unparseable start times last instead of throwing", () => {
    const events: readonly IcsEvent[] = [
      makeEvent("missing", undefined),
      makeEvent("b", "20251118T120000"),
      makeEvent("garbage", "not-a-date"),
      makeEvent("a", "20251117T120000"),
    ];
    expect(sortEvents(events).map((e) => e.uid)).toEqual([
      "a",
      "b",
      "missing",
      "garbage",
    ]);
  });

  test("orders all-day events relative to timed events on the same day", () => {
    const events: readonly IcsEvent[] = [
      makeEvent("noon", "20260213T120000"),
      makeEvent("allday", "20260213"),
    ];
    expect(sortEvents(events).map((e) => e.uid)).toEqual(["allday", "noon"]);
  });
});
