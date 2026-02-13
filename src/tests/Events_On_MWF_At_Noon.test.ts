import { describe, test, expect } from "bun:test";
import InvoiceHoursCounterCliTestHarness, {
  type CsvOutput,
} from "./InvoiceHoursCounterCliTestHarness";

async function RunTest(
  args: readonly string[],
  validate: (output: readonly CsvOutput[]) => void,
) {
  return await InvoiceHoursCounterCliTestHarness(
    "Events_On_MWF_At_Noon",
    args,
    validate,
  );
}

describe("Events_On_MWF_At_Noon", () => {
  test("can filter to only projects named 'ExampleProj1'", async () => {
    RunTest(["--project", "ExampleProj1"], async (output) => {
      expect(Array.isArray(output)).toBeTrue();
      expect(output).toHaveLength(3);
      let sum: number = 0;
      for (let i = 0; i < output.length; i++) {
        sum += output[i]!.Hours;
      }
      expect(sum).toBe(3);
    });
  });

  test("applying no filters should yield projects from both 'ExampleProj1' and 'UnrelatedProj2'", async () => {
    RunTest([], async (output) => {
      expect(Array.isArray(output)).toBeTrue();
      expect(output).toHaveLength(5);
    });
  });

  test("can filter to only projects named 'ExampleProj1' before the Thursday", async () => {
    RunTest(
      ["--project", "ExampleProj1", "--before", "2025-11-20T00:00:00Z"],
      async (output) => {
        expect(Array.isArray(output)).toBeTrue();
        expect(output).toHaveLength(2);
      },
    );
  });

  test("can filter to only projects named 'ExampleProj1' after the Tuesday", async () => {
    RunTest(
      ["--project", "ExampleProj1", "--after", "2025-11-18T00:00:00Z"],
      async (output) => {
        expect(Array.isArray(output)).toBeTrue();
        expect(output).toHaveLength(2);
      },
    );
  });
});
