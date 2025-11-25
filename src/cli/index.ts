import cli from "./cli";

export default cli;

if (require.main === module) {
  cli(process.argv);
}

export type * from "./cli";
