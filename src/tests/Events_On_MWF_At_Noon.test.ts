import { describe, test, expect } from "bun:test";
import InvoiceHoursCounterCliTestHarness, {
  type CsvOutput,
} from "./InvoiceHoursCounterCliTestHarness";

async function RunTest(
  args: readonly string[],
  validate: (output: readonly CsvOutput[]) => void | Promise<void>,
): Promise<void> {
  return await InvoiceHoursCounterCliTestHarness(
    "Events_On_MWF_At_Noon",
    args,
    validate,
  );
}

function sumHours(output: readonly CsvOutput[]): number {
  return output.reduce((sum, row) => sum + row.Hours, 0);
}

describe("Events_On_MWF_At_Noon", () => {
  test("can filter to only projects named 'ExampleProj1'", async () => {
    await RunTest(["--project", "ExampleProj1"], (output) => {
      expect(Array.isArray(output)).toBeTrue();
      expect(output).toHaveLength(3);
      expect(sumHours(output)).toBe(3);
      // Project prefix should be stripped from the description
      expect(output.map((row) => row.Description)).toEqual([
        "Project Kickoff",
        "Work on example project 1 a bit",
        "Finish example project 1",
      ]);
    });
  });

  test("applying no filters should yield projects from both 'ExampleProj1' and 'UnrelatedProj2'", async () => {
    await RunTest([], (output) => {
      expect(Array.isArray(output)).toBeTrue();
      expect(output).toHaveLength(5);
      expect(sumHours(output)).toBe(7.5);
    });
  });

  test("events are sorted chronologically regardless of order in the .ics file", async () => {
    await RunTest([], (output) => {
      const times: number[] = output.map((row) => row.Date.getTime());
      for (let i = 1; i < times.length; i++) {
        expect(times[i]!).toBeGreaterThanOrEqual(times[i - 1]!);
      }
    });
  });

  test("can filter to only projects named 'ExampleProj1' before the Thursday", async () => {
    await RunTest(
      ["--project", "ExampleProj1", "--before", "2025-11-20T00:00:00Z"],
      (output) => {
        expect(Array.isArray(output)).toBeTrue();
        expect(output).toHaveLength(2);
        expect(sumHours(output)).toBe(2);
      },
    );
  });

  test("can filter to only projects named 'ExampleProj1' after the Tuesday", async () => {
    await RunTest(
      ["--project", "ExampleProj1", "--after", "2025-11-18T00:00:00Z"],
      (output) => {
        expect(Array.isArray(output)).toBeTrue();
        expect(output).toHaveLength(2);
        expect(sumHours(output)).toBe(2);
      },
    );
  });

  test("filtering to a project that has no events yields an empty summary", async () => {
    await RunTest(["--project", "DoesNotExist"], (output) => {
      expect(output).toHaveLength(0);
    });
  });
});
