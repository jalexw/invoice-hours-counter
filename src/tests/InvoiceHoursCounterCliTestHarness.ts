import resolveTestFixturesDirectory from "./resolveTestFixturesDirectory";
import resolveWorkspaceRoot from "./resolveWorkspaceRoot";
import { createReadStream, existsSync, mkdirSync } from "fs";
import { join } from "path";
import cli from "@/cli";
import csvParser from "csv-parser";

export interface CsvOutput {
  Description: string;
  Hours: number;
  Date: Date;
}

export default async function InvoiceHoursCounterCliTestHarness(
  test_fixture_name: string,
  args: readonly string[],
  validate: (result: readonly CsvOutput[]) => void,
): Promise<void> {
  const workspaceRoot: string = resolveWorkspaceRoot();
  const testFixturesDir: string = resolveTestFixturesDirectory();
  const FixturesDirectory: string = join(testFixturesDir, test_fixture_name);
  if (!existsSync(testFixturesDir)) {
    throw new Error(`Failed to resolve ${test_fixture_name}/ directory!`);
  }
  const ics_file_path: string = join(
    FixturesDirectory,
    `${test_fixture_name}.ics`,
  );
  if (!existsSync(ics_file_path)) {
    throw new Error(`Failed to resolve ${test_fixture_name}.ics file!`);
  }
  const testOutputsDir: string = join(workspaceRoot, "test-outputs");
  if (!existsSync(testOutputsDir)) {
    mkdirSync(testOutputsDir);
  }
  if (!existsSync(testOutputsDir)) {
    throw new Error("Failed to resolve test-outputs/ directory!");
  }

  // Run cli command with ics file and return CSV output path
  async function runCliTest(...countHoursOptions: string[]): Promise<string> {
    const csv_output_path: string = join(
      testOutputsDir,
      `${test_fixture_name}-${new Date().toISOString()}${countHoursOptions.length > 0 ? `_${countHoursOptions.join("_")}` : ""}`,
    );
    await cli([
      process.argv[0]!,
      process.argv[1]!,
      "count-hours",
      ics_file_path,
      ...countHoursOptions,
      "--csv",
      csv_output_path,
    ]);
    if (!existsSync(csv_output_path)) {
      throw new Error("Failed to generate CSV output!");
    }
    return csv_output_path;
  }

  async function parseCsvOutput(csv_path_to_parse: string) {
    if (!existsSync(csv_path_to_parse)) {
      throw new Error("Failed to resolve CSV output file!");
    }

    const raw_csv: object[] = await new Promise<object[]>((resolve, reject) => {
      const output: object[] = [];
      createReadStream(csv_path_to_parse, { encoding: "utf-8" })
        .pipe(csvParser())
        .on("data", (data) => output.push(data))
        .on("end", () => resolve(output))
        .on("error", () => reject("Error parsing csv output!"));
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

  const csv: readonly CsvOutput[] = await parseCsvOutput(
    await runCliTest(...args),
  );
  validate(csv);
}
