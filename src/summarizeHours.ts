import { IcsEvent } from "@jalexw/calendar-ics-parser";
import parseDate from "./parseDate";

export default function summarizeHours(events: readonly IcsEvent[]): void {
  let sum: number = 0;

  for (const event of events) {
    if (!event.dtstart || !event.dtend) {
      throw new TypeError(`Missing dtstart or dtend for event '${event.uid}'`);
    }

    const start = parseDate(event.dtstart);
    const end = parseDate(event.dtend);
    const durationMs: number = end.getTime() - start.getTime();
    const durationS = durationMs / 1000;
    const durationHrs = durationS / 60 / 60;

    console.log(
      `${start.toDateString()} | ${durationHrs.toFixed(2)} | ${event.summary}`,
    );
    sum += durationHrs;
  }

  console.log(`\nTotal Hours: ${sum.toFixed(2)}`);
}
