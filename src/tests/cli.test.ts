import { describe, test, expect } from "bun:test";
import { CommanderError } from "commander";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import cli, { InvoiceHoursCounterCliError } from "@/cli";
import { buildCountHoursArgv } from "./InvoiceHoursCounterCliTestHarness";
import { resolveTestFixtureIcsPath } from "./resolveTestFixturesDirectory";

const FIXTURE: string = resolveTestFixtureIcsPath("Events_On_MWF_At_Noon");

describe("cli error handling", () => {
  test("rejects an unparseable --after timestamp instead of silently ignoring it", async () => {
    const promise = cli(buildCountHoursArgv(FIXTURE, ["--after", "not-a-date"]));
    await expect(promise).rejects.toBeInstanceOf(CommanderError);
  });

  test("rejects an unparseable --before timestamp instead of silently ignoring it", async () => {
    const promise = cli(
      buildCountHoursArgv(FIXTURE, ["--before", "2025-13-45"]),
    );
    await expect(promise).rejects.toBeInstanceOf(CommanderError);
  });

  test("rejects a missing input file with a descriptive error", async () => {
    const promise = cli(
      buildCountHoursArgv("/definitely/does/not/exist.ics", []),
    );
    await expect(promise).rejects.toBeInstanceOf(InvoiceHoursCounterCliError);
    await expect(promise).rejects.toThrow(/Failed to read input \.ics file/);
  });

  test("refuses to overwrite an existing --csv output file", async () => {
    const dir: string = mkdtempSync(join(tmpdir(), "invoice-hours-counter-"));
    try {
      const existing: string = join(dir, "existing.csv");
      writeFileSync(existing, "do not clobber", { encoding: "utf-8" });
      const promise = cli(buildCountHoursArgv(FIXTURE, ["--csv", existing]));
      await expect(promise).rejects.toBeInstanceOf(InvoiceHoursCounterCliError);
      await expect(promise).rejects.toThrow(/already exists/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("does not exit the process on a usage error (missing input argument)", async () => {
    const promise = cli([process.argv[0] ?? "bun", "cli", "count-hours"]);
    await expect(promise).rejects.toBeInstanceOf(CommanderError);
  });

  test("runs without --csv and writes nothing", async () => {
    const dir: string = mkdtempSync(join(tmpdir(), "invoice-hours-counter-"));
    try {
      await cli(buildCountHoursArgv(FIXTURE, ["--project", "ExampleProj1"]));
      expect(existsSync(join(dir, "summary.csv"))).toBeFalse();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
