import { describe, test, expect } from "bun:test";
import InvoiceHoursCounterCliTestHarness, {
  type CsvOutput,
} from "./InvoiceHoursCounterCliTestHarness";

async function RunTest(
  args: readonly string[],
  validate: (output: readonly CsvOutput[]) => void | Promise<void>,
): Promise<void> {
  return await InvoiceHoursCounterCliTestHarness(
    "ExampleProjectWithAllDayEvent",
    args,
    validate,
  );
}

describe("ExampleProjectWithAllDayEvent", () => {
  test("can filter to only projects named 'Proj', dropping the all-day event", async () => {
    await RunTest(["--project", "Proj"], (output) => {
      expect(Array.isArray(output)).toBeTrue();
      expect(output).toHaveLength(5);
      let sum: number = 0;
      for (const row of output) {
        expect(typeof row.Hours).toBe("number");
        expect(Number.isFinite(row.Hours)).toBeTrue();
        sum += row.Hours;
      }
      expect(sum).toBe(6);
    });
  });

  test("an all-day event without a project filter is included as 0 hours and does not break CSV generation", async () => {
    await RunTest([], (output) => {
      expect(output).toHaveLength(6);
      const allDay: CsvOutput | undefined = output.find(
        (row) => row.Description === "Project Deadline",
      );
      expect(allDay).toBeDefined();
      expect(allDay!.Hours).toBe(0);
      // All-day events are anchored to local midnight of their DATE value
      expect(Number.isNaN(allDay!.Date.getTime())).toBeFalse();
      expect(allDay!.Date.getTime()).toBe(new Date(2026, 1, 13).getTime());
      for (const row of output) {
        expect(Number.isNaN(row.Date.getTime())).toBeFalse();
        expect(Number.isFinite(row.Hours)).toBeTrue();
      }
      const sum: number = output.reduce((acc, row) => acc + row.Hours, 0);
      expect(sum).toBe(6);
    });
  });
});
