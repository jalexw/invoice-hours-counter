import { describe, test, expect, afterAll } from "bun:test";
import cli from "@/cli";
import { join, normalize } from "path";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmdirSync,
} from "fs";
import csvParser from "csv-parser";

function findWorkspaceRoot(): string {
  let currentDir: string = __dirname;
  const MAX_UPWARDS_TRAVERSAL_ATTEMPTS = 4;
  for (let i = 0; i < MAX_UPWARDS_TRAVERSAL_ATTEMPTS; i++) {
    if (existsSync(join(currentDir, "package.json"))) {
      return currentDir;
    } else {
      currentDir = normalize(join(currentDir, ".."));
    }
  }
  throw new Error(
    "Failed to resolve @jalexw/invoice-hours-counter project root directory!",
  );
}

const workspaceRoot: string = findWorkspaceRoot();

const testFixturesDir: string = join(workspaceRoot, "test-fixtures");
if (!existsSync(testFixturesDir)) {
  throw new Error("Failed to resolve test-fixtures/ directory!");
}
const Fixtures_Events_On_MWF_At_Noon_Dir: string = join(
  testFixturesDir,
  "Events_On_MWF_At_Noon",
);
if (!existsSync(testFixturesDir)) {
  throw new Error("Failed to resolve Events_On_MWF_At_Noon/ directory!");
}
const ics_file_path: string = join(
  Fixtures_Events_On_MWF_At_Noon_Dir,
  "Events_On_MWF_At_Noon.ics",
);
if (!existsSync(ics_file_path)) {
  throw new Error("Failed to resolve Events_On_MWF_At_Noon.ics file!");
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
    `Events_On_MWF_At_Noon-${new Date().toISOString()}${countHoursOptions.length > 0 ? `_${countHoursOptions.join("_")}` : ""}`,
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

describe("Events_On_MWF_At_Noon", () => {
  test("can filter to only projects named 'ExampleProj1'", async () => {
    const csv = await parseCsvOutput(
      await runCliTest("--project", "ExampleProj1"),
    );
    expect(csv).toHaveLength(3);
    let sum: number = 0;
    for (let i = 0; i < csv.length; i++) {
      sum += csv[i]!.Hours;
    }
    expect(sum).toBe(3);
  });

  test("applying no filters should yield projects from both 'ExampleProj1' and 'UnrelatedProj2'", async () => {
    expect(await parseCsvOutput(await runCliTest(...[]))).toHaveLength(5);
  });

  test("can filter to only projects named 'ExampleProj1' before the Thursday", async () => {
    expect(
      await parseCsvOutput(
        await runCliTest(
          "--project",
          "ExampleProj1",
          "--before",
          "2025-11-20T00:00:00Z",
        ),
      ),
    ).toHaveLength(2);
  });

  test("can filter to only projects named 'ExampleProj1' after the Tuesday", async () => {
    expect(
      await parseCsvOutput(
        await runCliTest(
          "--project",
          "ExampleProj1",
          "--after",
          "2025-11-18T00:00:00Z",
        ),
      ),
    ).toHaveLength(2);
  });

  afterAll(() => {
    if (existsSync(testOutputsDir)) {
      rmdirSync(testOutputsDir, { recursive: true });
    }
  });
});
