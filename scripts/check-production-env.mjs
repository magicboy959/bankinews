const required = ["NEXT_PUBLIC_APP_URL", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "AUTH_SECRET", "CRON_SECRET"];
const placeholderPattern = /^(replace_me|changeme|example|password|secret)$/i;
const errors = [];

for (const key of required) {
  const value = process.env[key]?.trim();
  if (!value) errors.push(`${key} is missing`);
  else if (placeholderPattern.test(value)) errors.push(`${key} still contains a placeholder`);
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
if (appUrl) {
  try {
    const parsed = new URL(appUrl);
    if (parsed.protocol !== "https:") errors.push("NEXT_PUBLIC_APP_URL must use HTTPS");
    if (["localhost", "127.0.0.1"].includes(parsed.hostname)) errors.push("NEXT_PUBLIC_APP_URL must use the public production domain");
  } catch {
    errors.push("NEXT_PUBLIC_APP_URL must be a valid absolute URL");
  }
}

for (const key of ["AUTH_SECRET", "CRON_SECRET"]) {
  const value = process.env[key]?.trim();
  if (value && value.length < 32) errors.push(`${key} must be at least 32 characters`);
}

if (errors.length) {
  console.error("Production environment check failed:\n" + errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("Production environment check passed.");
