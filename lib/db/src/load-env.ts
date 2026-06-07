import fs from "node:fs";
import path from "node:path";

const protectedKeys = new Set(Object.keys(process.env));

function parseEnv(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (!key) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function findWorkspaceDirs(startDir: string): string[] {
  const dirs: string[] = [];
  let current = path.resolve(startDir);

  while (true) {
    dirs.push(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return dirs.reverse();
}

export function loadLocalEnv(startDir = process.cwd()): void {
  const envFiles = findWorkspaceDirs(startDir).flatMap((dir) => [
    path.join(dir, ".env"),
    path.join(dir, ".env.local"),
  ]);

  for (const file of envFiles) {
    if (!fs.existsSync(file)) continue;

    const values = parseEnv(fs.readFileSync(file, "utf8"));
    for (const [key, value] of Object.entries(values)) {
      if (protectedKeys.has(key)) continue;
      process.env[key] = value;
    }
  }
}
