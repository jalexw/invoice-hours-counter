import type { ISummaryGenerationResult } from "./summarizeHours";

export default function generateCsvFromSummary(
  summary: ISummaryGenerationResult,
): string {
  let csv: string = summary.events
    .map(
      (event) =>
        `${event.startTime.toISOString()},"${event.description}",${event.durationHours}`,
    )
    .join("\n");
  csv = `Date,Description,Hours\n${csv}`;
  return csv;
}
