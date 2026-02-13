import { join, normalize } from "path";
import { existsSync } from "fs";

export function resolveWorkspaceRoot(): string {
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

export default resolveWorkspaceRoot;
