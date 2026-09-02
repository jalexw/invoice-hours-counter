import { CommanderError } from "commander";
import cli from "./cli";

export default cli;
export * from "./cli";
export type * from "./cli";

if (require.main === module) {
  cli(process.argv).catch((err: unknown) => {
    if (err instanceof CommanderError) {
      // Commander has already printed the usage error / help text.
      process.exitCode = err.exitCode;
      return;
    }
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
