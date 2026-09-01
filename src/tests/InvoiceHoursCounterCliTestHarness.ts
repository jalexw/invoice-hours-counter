import { resolveTestFixtureIcsPath } from "./resolveTestFixturesDirectory";
import { createReadStream, existsSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import cli from "@/cli";
import csvParser from "csv-parser";

export interface CsvOutput {
  Description: string;
  Hours: number;
  Date: Date;
}

/**
 * Build the argv for running `count-hours` in-process against a fixture.
 */
export function buildCountHoursArgv(
  ics_file_path: string,
  countHoursOptions: readonly string[],
): string[] {
  return [
    process.argv[0] ?? "bun",
    process.argv[1] ?? "invoice-hours-counter",
    "count-hours",
    ics_file_path,
    ...countHoursOptions,
  ];
}

async function parseCsvOutput(
  csv_path_to_parse: string,
): Promise<readonly CsvOutput[]> {
  if (!existsSync(csv_path_to_parse)) {
    throw new Error("Failed to resolve CSV output file!");
  }

  const raw_csv: object[] = await new Promise<object[]>((resolve, reject) => {
    const output: object[] = [];
    createReadStream(csv_path_to_parse, { encoding: "utf-8" })
      .pipe(csvParser())
      .on("data", (data) => output.push(data))
      .on("end", () => resolve(output))
      .on("error", (err) =>
        reject(new Error(`Error parsing csv output: ${err.message}`)),
      );
  });

  return raw_csv.map((row) => {
    if (!("Date" in row) || !("Description" in row) || !("Hours" in row)) {
      throw new TypeError("Invalid format for CSV row!");
    }

    if (
      typeof row.Date !== "string" ||
      typeof row.Description !== "string" ||
      typeof row.Hours !== "string"
    ) {
      throw new TypeError("Expected data to have been parsed as strings!");
    }

    return {
      Description: row.Description,
      Date: new Date(row.Date),
      Hours: Number.parseFloat(row.Hours),
    };
  });
}

/**
 * Run the CLI in-process against `test-fixtures/<name>/<name>.ics` with the
 * given `count-hours` options, writing the CSV output to a temporary
 * directory that is always cleaned up, then hand the parsed CSV rows to
 * `validate`. The returned promise settles only after `validate` has, so
 * assertion failures inside `validate` fail the calling test.
 */
export default async function InvoiceHoursCounterCliTestHarness(
  test_fixture_name: string,
  args: readonly string[],
  validate: (result: readonly CsvOutput[]) => void | Promise<void>,
): Promise<void> {
  const ics_file_path: string = resolveTestFixtureIcsPath(test_fixture_name);

  const outputDir: string = mkdtempSync(
    join(tmpdir(), "invoice-hours-counter-test-"),
  );
  try {
    const csv_output_path: string = join(outputDir, "summary.csv");
    await cli(
      buildCountHoursArgv(ics_file_path, [...args, "--csv", csv_output_path]),
    );
    if (!existsSync(csv_output_path)) {
      throw new Error("Failed to generate CSV output!");
    }
    const csv: readonly CsvOutput[] = await parseCsvOutput(csv_output_path);
    await validate(csv);
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
}
