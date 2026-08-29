const target = process.argv[2] ?? process.env.APP_ENV ?? "local";
const destructive = process.argv.includes("--destructive");
if (destructive && target === "production" && process.env.ALLOW_PRODUCTION_DESTRUCTIVE !== "I_UNDERSTAND_DATA_LOSS") {
  console.error("Refusing destructive production operation. Use the documented break-glass process.");
  process.exit(2);
}
console.log(`Environment guard passed for ${target}.`);
