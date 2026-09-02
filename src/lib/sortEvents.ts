import type { IcsEvent } from "@jalexw/calendar-ics-parser";
import parseDate from "./parseDate";

/**
 * Start time of an event in epoch milliseconds. Events with a missing or
 * unparseable start time sort to the end (in their original relative order).
 */
function startTimeMs(event: IcsEvent): number {
  if (typeof event.dtstart !== "string") {
    return Number.POSITIVE_INFINITY;
  }
  const time: number = parseDate(event.dtstart).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

function compare(event1: IcsEvent, event2: IcsEvent): number {
  const t1: number = startTimeMs(event1);
  const t2: number = startTimeMs(event2);
  if (t1 === t2) {
    return 0;
  }
  return t1 < t2 ? -1 : 1;
}

export default function sortEvents(
  events: readonly IcsEvent[],
): readonly IcsEvent[] {
  // Array.prototype.sort is stable in all supported runtimes, so events with
  // equal start times keep their original order.
  return [...events].sort(compare);
}
