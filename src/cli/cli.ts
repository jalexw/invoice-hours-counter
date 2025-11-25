import { Command } from "commander";
import type { ParsedIcsData } from "@jalexw/calendar-ics-parser";
import parseIcsData from "@jalexw/calendar-ics-parser/parseIcsData";
import summarizeHours, {
  type ISummaryGenerationResult,
} from "@/lib/summarizeHours";
import { existsSync, readFileSync, writeFileSync } from "fs";
import generateCsvFromSummary from "@/lib/generateCsvFromSummary";

function createInvoiceHoursCounterCliProgram(): Command {
  const cli = new Command();

  cli
    .name("@jalexw/invoice-hours-counter")
    .description("Parse a .ics calendar data file and count the hours in it!");

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
    )
    .option(
      "--before <timestamp>",
      "Filter to only include events ending before a specific timestamp",
    )
    .option(
      "--csv <output_path>",
      "Write summarized output to a CSV file at the given path.",
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
        fileData = readFileSync(input_filepath, { encoding: "utf-8" });
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
        console.log("Removing events that started before datetime: ", after);
      } else {
        console.log("No --after filter was supplied!");
      }

      const before: Date | undefined =
        typeof options === "object" &&
        !!options &&
        "before" in options &&
        typeof options.before === "string"
          ? new Date(options.before)
          : undefined;

      if (before) {
        console.log("Removing events that ended after datetime: ", before);
      } else {
        console.log("No --before filter was supplied!");
      }

      // Should we write the summary to a CSV file after?
      const csv_output_path: string | undefined =
        typeof options === "object" &&
        !!options &&
        "csv" in options &&
        typeof options.csv === "string" &&
        options.csv.length > 0
          ? options.csv
          : undefined;

      // Perform the actual parsing of the input .ics file
      const parsed: ParsedIcsData = await parseIcsData(fileData, debug);

      if (
        // Throw if at least 1 calendar was not parsed from .ics file
        !Array.isArray(parsed.calendars) ||
        parsed.calendars.length < 1 ||
        !parsed.calendars[0]
      ) {
        console.error("Failed to parse at least one calendar from .ics file!");
        process.exit(1);
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
        console.log(
          "Successfully generated CSV from summarized calendar hours!",
        );
        if (existsSync(csv_output_path)) {
          console.error(
            `Error writing CSV summary to file! A file already exists at path: '${csv_output_path}'`,
          );
          process.exit(1);
        }
        writeFileSync(csv_output_path, csv, { encoding: "utf-8" });
        console.log(`Successfully wrote CSV to filepath: '${csv_output_path}'`);
      }
      return;
    });

  return cli;
}

async function runInvoiceHoursCounterCli(
  argv: readonly string[],
): Promise<void> {
  await createInvoiceHoursCounterCliProgram().parseAsync(argv);
}

if (require.main === module) {
  runInvoiceHoursCounterCli(process.argv);
}

export default runInvoiceHoursCounterCli;
