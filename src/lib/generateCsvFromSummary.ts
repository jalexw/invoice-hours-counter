import type { ISummaryGenerationResult } from "./summarizeHours";
import { isValidDate } from "./parseDate";

/**
 * Quote a value for a CSV cell per RFC 4180: wrap in double quotes and escape
 * any embedded double quotes by doubling them. This keeps descriptions that
 * contain commas, quotes, or newlines from corrupting the CSV structure.
 */
export function escapeCsvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function generateCsvFromSummary(
  summary: ISummaryGenerationResult,
): string {
  const header: string = ["Date", "Description", "Hours"]
    .map(escapeCsvField)
    .join(",");

  const rows: readonly string[] = summary.events.map((event) => {
    const date: string = isValidDate(event.startTime)
      ? event.startTime.toISOString()
      : "";
    const hours: number = Number.isFinite(event.durationHours)
      ? event.durationHours
      : 0;
    return `${date},${escapeCsvField(event.description)},${hours}`;
  });

  return [header, ...rows].join("\n");
}
