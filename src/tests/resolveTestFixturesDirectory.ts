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

export default resolveTestFixturesDirectory;
