import type { IcsEvent } from "@jalexw/calendar-ics-parser";
import parseDate, { isValidDate } from "./parseDate";

export interface IFilterOptions {
  project?: string | null;
  after?: Date | null;
  before?: Date | null;
}

function hasProjectPrefix(title: string, project: string): boolean {
  if (title.startsWith(`${project} -`) || title.startsWith(`${project} |`)) {
    return true;
  }

  if (
    title.startsWith(`${project} Call`) ||
    title.startsWith(`${project} call`)
  ) {
    return true;
  }

  if (title === project) {
    return true;
  }

  if (
    title.startsWith(`Work on ${project}`) ||
    title.startsWith(`Working on ${project}`)
  ) {
    return true;
  }

  if (title.startsWith("Connect with ") && title.endsWith(` x ${project}`)) {
    return true;
  }

  if (title.startsWith("Create ") && title.endsWith(` for ${project}`)) {
    return true;
  }

  if (title.includes(project)) {
    console.warn(
      `⚠️ Title does not have project prefix but includes project name as a substring: '${title}'`,
    );
  }

  return false;
}

export default function filterEvents(
  event: IcsEvent,
  options: IFilterOptions,
): boolean {
  if (typeof event.summary !== "string") {
    return false;
  }

  // If a 'project' filter was supplied
  if (typeof options.project === "string" && options.project.length > 0) {
    const title: string = event.summary.trim();
    if (!hasProjectPrefix(title, options.project)) {
      return false;
    }
  }

  if (isValidDate(options.after)) {
    if (typeof event.dtstart !== "string") {
      console.warn(`No dtstart set for event '${event.summary}'`);
      return false;
    }
    const startTime: Date = parseDate(event.dtstart);
    if (!isValidDate(startTime)) {
      console.warn(
        `Unparseable dtstart '${event.dtstart}' for event '${event.summary}'`,
      );
      return false;
    }

    if (startTime.getTime() < options.after.getTime()) {
      return false;
    }
  }

  if (isValidDate(options.before)) {
    if (typeof event.dtend !== "string") {
      console.warn(`No dtend set for event '${event.summary}'`);
      return false;
    }
    const endTime: Date = parseDate(event.dtend);
    if (!isValidDate(endTime)) {
      console.warn(
        `Unparseable dtend '${event.dtend}' for event '${event.summary}'`,
      );
      return false;
    }

    if (endTime.getTime() > options.before.getTime()) {
      return false;
    }
  }

  return true;
}
