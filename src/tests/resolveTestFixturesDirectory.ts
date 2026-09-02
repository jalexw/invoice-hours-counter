import { join, normalize } from "path";
import { existsSync } from "fs";
import resolveWorkspaceRoot from "./resolveWorkspaceRoot";

export function resolveTestFixturesDirectory(): string {
  const workspaceRoot: string = resolveWorkspaceRoot();
  const testFixturesDir: string = join(workspaceRoot, "test-fixtures");
  if (!existsSync(testFixturesDir)) {
    throw new Error("Failed to resolve test-fixtures/ directory!");
  }
  return normalize(testFixturesDir);
}

/**
 * Resolve the path to `test-fixtures/<name>/<name>.ics`, throwing if the
 * fixture does not exist.
 */
export function resolveTestFixtureIcsPath(test_fixture_name: string): string {
  const ics_file_path: string = join(
    resolveTestFixturesDirectory(),
    test_fixture_name,
    `${test_fixture_name}.ics`,
  );
  if (!existsSync(ics_file_path)) {
    throw new Error(`Failed to resolve ${test_fixture_name}.ics file!`);
  }
  return ics_file_path;
}

export default resolveTestFixturesDirectory;
