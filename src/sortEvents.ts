import { IcsEvent } from "@jalexw/calendar-ics-parser";
import parseDate from "./parseDate";

function compare(event1: IcsEvent, event2: IcsEvent): number {
  if (!event1.dtstart || !event2.dtstart) {
    throw new Error("Missing start timestamp for event!");
  }

  const t1 = parseDate(event1.dtstart);
  const t2 = parseDate(event2.dtstart);

  return t1.getTime() - t2.getTime();
}

export default function sortEvents(events: IcsEvent[]): IcsEvent[] {
  return events.toSorted(compare);
}
