import type { Config } from "tailwindcss";
import { SchemaVaultsTailwindConfigFactory } from "@schemavaults/theme";
const config: Config = new SchemaVaultsTailwindConfigFactory().createConfig({
  content: ["./src/**/*.{tsx,jsx,js,ts,mdx}", "@schemavaults/ui"],
});
export default config;
