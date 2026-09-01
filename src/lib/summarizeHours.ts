import type { IcsEvent, ParsedIcsData } from "@jalexw/calendar-ics-parser";
import parseDate, { isIcsDateOnly, isValidDate } from "./parseDate";
import type { IFilterOptions } from "./filterEvents";
import sortEvents from "./sortEvents";
import filterEvents from "./filterEvents";

export type SummaryLogFunction = (...vals: unknown[]) => void;

export interface ISummarizeHoursInputOptions {
  data: ParsedIcsData;
  filters?: IFilterOptions;
  // Custom log function (e.g. console.log), this will print summary data, if supplied
  log?: SummaryLogFunction;
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

const MILLISECONDS_PER_HOUR: number = 60 * 60 * 1000;

function parseAllEvents(data: ParsedIcsData): readonly IcsEvent[] {
  return data.calendars.flatMap((cal) => cal.events);
}

function applyFilters(
  events: readonly IcsEvent[],
  filters: IFilterOptions,
  log: SummaryLogFunction,
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

/**
 * Calculate the billable hours for an event. Always returns a finite,
 * non-negative number; events that cannot be billed (all-day events, missing
 * or unparseable timestamps, negative durations) are treated as 0 hours and a
 * message is logged explaining why.
 */
function calculateBillableHours(
  event: IcsEvent,
  log: SummaryLogFunction,
): number {
  const { dtstart, dtend } = event;

  if (typeof dtstart !== "string") {
    log(
      `Invalid dtstart for event '${event.uid}'-- likely a full-day event in calendar. Treating as 0 billable hours!`,
    );
    return 0;
  }
  if (typeof dtend !== "string") {
    log(
      `Invalid dtend for event '${event.uid}'-- likely a full-day event in calendar. Treating as 0 billable hours!`,
    );
    return 0;
  }

  if (isIcsDateOnly(dtstart) || isIcsDateOnly(dtend)) {
    log(
      `Event '${event.uid}' is an all-day event (date-only timestamps). Treating as 0 billable hours!`,
    );
    return 0;
  }

  const start: Date = parseDate(dtstart);
  const end: Date = parseDate(dtend);
  if (!isValidDate(start) || !isValidDate(end)) {
    log(
      `⚠️ Could not parse timestamps for event '${event.uid}' (dtstart='${dtstart}', dtend='${dtend}'). Treating as 0 billable hours!`,
    );
    return 0;
  }

  const durationHours: number =
    (end.getTime() - start.getTime()) / MILLISECONDS_PER_HOUR;

  if (durationHours < 0) {
    log(
      `⚠️ Event '${event.uid}' ends before it starts (dtstart='${dtstart}', dtend='${dtend}'). Treating as 0 billable hours!`,
    );
    return 0;
  }

  return durationHours;
}

function stripProjectPrefix(summary: string, project: string): string {
  const prefixes: readonly string[] = [
    `${project} - `,
    `${project} | `,
    `Work on ${project} - `,
  ];
  for (const prefix of prefixes) {
    if (summary.startsWith(prefix)) {
      return summary.substring(prefix.length);
    }
  }
  return summary;
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
    if (typeof event.dtstart !== "string") {
      log(
        `⚠️ Skipping event '${event.uid}' (${event.summary ?? ""}) because it has no start time!`,
      );
      continue;
    }

    const startTime: Date = parseDate(event.dtstart);
    if (!isValidDate(startTime)) {
      log(
        `⚠️ Skipping event '${event.uid}' (${event.summary ?? ""}) because its start time '${event.dtstart}' could not be parsed!`,
      );
      continue;
    }

    const billableHours: number = calculateBillableHours(event, log);

    let description: string = event.summary ?? "";
    if (typeof project === "string" && project.length > 0) {
      description = stripProjectPrefix(description, project);
    }

    log(
      `${startTime.toDateString()} | ${billableHours.toFixed(2)} | ${description}`,
    );
    sum += billableHours;

    summarized_events.push({
      description,
      durationHours: billableHours,
      id: event.uid,
      startTime,
    });
  } // end of events loop

  log(`\nTotal Hours: ${sum.toFixed(2)}`);

  return {
    sum,
    events: summarized_events,
  };
}
