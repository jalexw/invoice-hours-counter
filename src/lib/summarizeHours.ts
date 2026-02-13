import type { IcsEvent, ParsedIcsData } from "@jalexw/calendar-ics-parser";
import parseDate from "./parseDate";
import type { IFilterOptions } from "./filterEvents";
import sortEvents from "./sortEvents";
import filterEvents from "./filterEvents";

export interface ISummarizeHoursInputOptions {
  data: ParsedIcsData;
  filters?: IFilterOptions;
  // Custom log function (e.g. console.log), this will print summary data, if supplied
  log?: (...vals: unknown[]) => void;
}

export interface IEventWithBillableHoursSummary {
  description: string;
  durationHours: number;
  id: string;
  startTime: Date;
}

export interface ISummaryGenerationResult {
  sum: number;
  events: readonly IEventWithBillableHoursSummary[];
}

function parseAllEvents(data: ParsedIcsData): readonly IcsEvent[] {
  return data.calendars.flatMap((cal) => cal.events);
}

function applyFilters(
  events: readonly IcsEvent[],
  filters: IFilterOptions,
  log: (...vals: unknown[]) => void,
): readonly IcsEvent[] {
  const N_UNFILTERED_EVENTS: number = events.length;
  log(`Found ${N_UNFILTERED_EVENTS} raw events from calendar(s)!`);
  const filtered = events.filter((e) => filterEvents(e, filters));
  const N_FILTERED_EVENTS: number = filtered.length;
  const N_EVENTS_DROPPED: number = N_UNFILTERED_EVENTS - N_FILTERED_EVENTS;
  log(
    `Dropped ${N_EVENTS_DROPPED} events based on filters, leaving ${N_FILTERED_EVENTS} events!`,
  );
  return filtered;
}

function calculateBillableHours(
  event: IcsEvent,
  log: (...vals: unknown[]) => void,
): number {
  if (typeof event.dtstart !== "string" && typeof event.dtstart !== "number") {
    log(
      `Invalid dtstart for event '${event.uid}'-- likely a full-day event in calendar. Treating as 0 billable hours!`,
    );
    return 0;
  } else if (
    typeof event.dtend !== "string" &&
    typeof event.dtend !== "number"
  ) {
    log(
      `Invalid dtend for event '${event.uid}'-- likely a full-day event in calendar. Treating as 0 billable hours!`,
    );
    return 0;
  }
  const start: Date = parseDate(event.dtstart);
  const end: Date = parseDate(event.dtend);
  const durationMs: number = end.getTime() - start.getTime();
  const durationSeconds: number = durationMs / 1000;
  const durationMinutes: number = durationSeconds / 60;
  const durationHours: number = durationMinutes / 60;
  return durationHours;
}

export default function summarizeHours({
  data,
  filters,
  log = console.log,
}: ISummarizeHoursInputOptions): ISummaryGenerationResult {
  let events: readonly IcsEvent[] = parseAllEvents(data);
  if (typeof filters === "object" && !!filters) {
    events = applyFilters(events, filters, log);
  }
  events = sortEvents(events);

  const project: string | undefined | null = filters?.project;

  let sum: number = 0;

  const summarized_events: IEventWithBillableHoursSummary[] = [];

  for (const event of events) {
    if (!event.dtstart || !event.dtend) {
      throw new TypeError(`Missing dtstart or dtend for event '${event.uid}'`);
    }

    const startDateString = parseDate(event.dtstart).toDateString();
    const billableHours: number = calculateBillableHours(event, log);

    let description: string = event.summary ?? "";
    if (typeof project === "string" && project.length > 0) {
      if (description.startsWith(`${project} - `)) {
        description = description.substring(`${project} - `.length);
      } else if (description.startsWith(`${project} | `)) {
        description = description.substring(`${project} | `.length);
      } else if (description.startsWith(`Work on ${project} - `)) {
        description = description.substring(`Work on ${project} - `.length);
      }
    }

    if (isNaN(billableHours)) {
      log(
        `⚠️ Billing error for event '${event.uid}' (${description}) is not a number!`,
      );
    } else {
      log(`${startDateString} | ${billableHours.toFixed(2)} | ${description}`);
      sum += billableHours;
    }
    summarized_events.push({
      description,
      durationHours: billableHours,
      id: event.uid,
      startTime: parseDate(event.dtstart),
    });
  } // end of events loop

  log(`\nTotal Hours: ${sum.toFixed(2)}`);

  return {
    sum,
    events: [...summarized_events],
  };
}
