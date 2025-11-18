import { Command } from "commander";
import {
  readUtf8,
  parseIcsData,
  type ParsedIcsData,
} from "@jalexw/calendar-ics-parser";
import filterEvents, { type IFilterOptions } from "./filterEvents";
import summarizeHours from "./summarizeHours";

const cli = new Command();

cli
  .name("@jalexw/invoice-hours-counter")
  .description("Parse a .ics calendar data file and count the hours in it!");

cli
  .command("count-hours")
  .description(
    "Parse a .ics calendar data file and count the number of hours in it!",
  )
  .argument("<input_filepath>", "Path to .ics file")
  .option("--debug", "Enable additional debug logging")
  .requiredOption("--project <project_id>", "Prefix for the project")
  .option(
    "--after <timestamp>",
    "Filter to only include events after a specific timestamp",
  )
  .action(async function transformAction(
    input_filepath: string,
    options: unknown,
  ): Promise<void> {
    if (typeof input_filepath !== "string" || input_filepath.length === 0) {
      console.error(
        "Expected first argument to be the file path to input .ics file!",
      );
      process.exit(1);
    }
    let fileData: string;
    try {
      fileData = await readUtf8(input_filepath);
    } catch (e: unknown) {
      console.error("Failed to read input .ics file into UTF-8 string: ", e);
      process.exit(1);
    }

    const debug: boolean =
      typeof options === "object" &&
      !!options &&
      "debug" in options &&
      !!options.debug;

    if (debug) {
      console.log("CLI options: ", options);
    }

    const project: string | undefined =
      typeof options === "object" &&
      !!options &&
      "project" in options &&
      typeof options.project === "string"
        ? options.project
        : undefined;

    if (typeof project !== "string") {
      console.warn("No project was parsed from --project flag!");
    } else {
      console.log("Project: ", project);
    }

    const after: Date | undefined =
      typeof options === "object" &&
      !!options &&
      "after" in options &&
      typeof options.after === "string"
        ? new Date(options.after)
        : undefined;

    if (after) {
      console.log("Removing events that came before datetime: ", after);
    } else {
      console.log("No --after filter was supplied!");
    }

    const parsed: ParsedIcsData = await parseIcsData(fileData, debug);

    if (
      !Array.isArray(parsed.calendars) ||
      parsed.calendars.length < 1 ||
      !parsed.calendars[0]
    ) {
      console.error("Failed to parse at least one calendar from .ics file!");
      process.exit(1);
    }

    const output = summarizeHours({
      data: parsed,
      log: console.log,
      filters: {
        project,
        after,
      },
    });
    void output; // output object is not used-- console.log is sufficient for CLI
  });

async function runInvoiceHoursCounterCli(
  argv: readonly string[],
): Promise<void> {
  await cli.parseAsync(argv);
}

export { runInvoiceHoursCounterCli, runInvoiceHoursCounterCli as default };

if (require.main === module) {
  runInvoiceHoursCounterCli(process.argv);
}
