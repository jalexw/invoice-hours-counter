import { describe, test, expect } from "bun:test";
import InvoiceHoursCounterCliTestHarness, {
  type CsvOutput,
} from "./InvoiceHoursCounterCliTestHarness";

async function RunTest(
  args: readonly string[],
  validate: (output: readonly CsvOutput[]) => void,
) {
  return await InvoiceHoursCounterCliTestHarness(
    "ExampleProjectWithAllDayEvent",
    args,
    validate,
  );
}

describe("ExampleProjectWithAllDayEvent", () => {
  test("can filter to only projects named 'ExampleProj1' after the Tuesday", async () => {
    RunTest(["--project", "Proj"], async (output) => {
      expect(Array.isArray(output)).toBeTrue();
      expect(output).toHaveLength(5);
      let sum: number = 0;
      for (const row of output) {
        expect(typeof row.Hours).toBe("number");
        sum += row.Hours;
      }
      expect(sum).toBe(6);
    });
  });
});
