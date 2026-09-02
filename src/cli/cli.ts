import { Command, InvalidArgumentError } from "commander";
import type { ParsedIcsData } from "@jalexw/calendar-ics-parser";
import parseIcsData from "@jalexw/calendar-ics-parser/parseIcsData";
import summarizeHours, {
  type ISummaryGenerationResult,
} from "@/lib/summarizeHours";
import { existsSync, readFileSync, writeFileSync } from "fs";
import generateCsvFromSummary from "@/lib/generateCsvFromSummary";

/**
 * Error thrown for user-facing CLI failures (bad input file, output path
 * already exists, etc.). The message is safe to print directly.
 */
export class InvoiceHoursCounterCliError extends Error {
  public override readonly name = "InvoiceHoursCounterCliError";
}

interface CountHoursOptions {
  debug?: boolean;
  project?: string;
  after?: Date;
  before?: Date;
  csv?: string;
}

/**
 * Parse a `--after` / `--before` timestamp. Anything `Date` can't understand
 * is rejected up front rather than silently disabling the filter.
 */
export function parseTimestampOption(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new InvalidArgumentError(
      `Expected an ISO-8601 timestamp such as 2025-03-09T00:00:00Z, received: '${value}'`,
    );
  }
  return parsed;
}

async function countHoursAction(
  input_filepath: string,
  options: CountHoursOptions,
): Promise<void> {
  if (typeof input_filepath !== "string" || input_filepath.length === 0) {
    throw new InvoiceHoursCounterCliError(
      "Expected first argument to be the file path to input .ics file!",
    );
  }

  const debug: boolean = options.debug === true;

  if (debug) {
    console.log("CLI options: ", options);
  }

  let fileData: string;
  try {
    fileData = readFileSync(input_filepath, { encoding: "utf-8" });
  } catch (e: unknown) {
    const reason: string = e instanceof Error ? e.message : String(e);
    throw new InvoiceHoursCounterCliError(
      `Failed to read input .ics file '${input_filepath}' into UTF-8 string: ${reason}`,
    );
  }

  const project: string | undefined =
    typeof options.project === "string" && options.project.length > 0
      ? options.project
      : undefined;

  if (typeof project !== "string") {
    console.warn("No project was parsed from --project flag!");
  } else {
    console.log("Project: ", project);
  }

  const after: Date | undefined =
    options.after instanceof Date ? options.after : undefined;

  if (after) {
    console.log("Removing events that started before datetime: ", after);
  } else {
    console.log("No --after filter was supplied!");
  }

  const before: Date | undefined =
    options.before instanceof Date ? options.before : undefined;

  if (before) {
    console.log("Removing events that ended after datetime: ", before);
  } else {
    console.log("No --before filter was supplied!");
  }

  if (after && before && after.getTime() > before.getTime()) {
    console.warn(
      "⚠️ --after is later than --before; no events can match both filters!",
    );
  }

  // Should we write the summary to a CSV file after?
  const csv_output_path: string | undefined =
    typeof options.csv === "string" && options.csv.length > 0
      ? options.csv
      : undefined;

  // Fail fast before doing any work if we can't write the output anyway.
  if (typeof csv_output_path === "string" && existsSync(csv_output_path)) {
    throw new InvoiceHoursCounterCliError(
      `Error writing CSV summary to file! A file already exists at path: '${csv_output_path}'`,
    );
  }

  // Perform the actual parsing of the input .ics file
  const parsed: ParsedIcsData = await parseIcsData(fileData, debug);

  if (
    // Throw if at least 1 calendar was not parsed from .ics file
    !Array.isArray(parsed.calendars) ||
    parsed.calendars.length < 1 ||
    !parsed.calendars[0]
  ) {
    throw new InvoiceHoursCounterCliError(
      "Failed to parse at least one calendar from .ics file!",
    );
  }

  const summary_output: ISummaryGenerationResult = summarizeHours({
    data: parsed,
    log: console.log,
    filters: {
      project,
      after,
      before,
    },
  });

  if (typeof csv_output_path === "string") {
    const csv: string = generateCsvFromSummary(summary_output);
    console.log("Successfully generated CSV from summarized calendar hours!");
    writeFileSync(csv_output_path, csv, { encoding: "utf-8" });
    console.log(`Successfully wrote CSV to filepath: '${csv_output_path}'`);
  }
}

export function createInvoiceHoursCounterCliProgram(): Command {
  const cli = new Command();

  cli
    .name("@jalexw/invoice-hours-counter")
    .description("Parse a .ics calendar data file and count the hours in it!")
    // Throw a CommanderError instead of calling process.exit() so the CLI can
    // be driven programmatically (and from tests) without killing the process.
    .exitOverride();

  cli
    .command("count-hours")
    .description(
      "Parse a .ics calendar data file and count the number of hours in it!",
    )
    .storeOptionsAsProperties(false)
    .argument("<input_filepath>", "Path to .ics file")
    .option("--debug", "Enable additional debug logging")
    .option("--project <project_id>", "Prefix for the project")
    .option(
      "--after <timestamp>",
      "Filter to only include events starting after a specific timestamp",
      parseTimestampOption,
    )
    .option(
      "--before <timestamp>",
      "Filter to only include events ending before a specific timestamp",
      parseTimestampOption,
    )
    .option(
      "--csv <output_path>",
      "Write summarized output to a CSV file at the given path.",
    )
    .action(countHoursAction);

  return cli;
}

/**
 * Run the CLI with the given argv (including the runtime and script entries,
 * i.e. `process.argv`). Rejects with a `CommanderError` on usage errors / help
 * output and an `InvoiceHoursCounterCliError` on runtime failures.
 */
async function runInvoiceHoursCounterCli(
  argv: readonly string[],
): Promise<void> {
  await createInvoiceHoursCounterCliProgram().parseAsync([...argv]);
}

export default runInvoiceHoursCounterCli;
