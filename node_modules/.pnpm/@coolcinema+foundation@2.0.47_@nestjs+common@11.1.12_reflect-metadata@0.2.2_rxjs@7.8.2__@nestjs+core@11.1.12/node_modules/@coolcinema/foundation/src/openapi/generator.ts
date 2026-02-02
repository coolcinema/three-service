import { createDocument } from "zod-openapi";
import * as fs from "fs";
import * as path from "path";

import * as yaml from "js-yaml";

export interface GenerateSpecOptions {
  title: string;
  version: string;
  out?: string;
}

export function generateSpecFile(
  routes: Record<string, any>,
  options: GenerateSpecOptions,
) {
  const paths: any = {};

  Object.values(routes).forEach((route: any) => {
    if (!paths[route.path]) paths[route.path] = {};
    Object.assign(paths[route.path], route.config);
  });

  const doc = createDocument({
    openapi: "3.1.0",
    info: { title: options.title, version: options.version },
    paths: paths,
  });

  const outPath = path.resolve(
    process.cwd(),
    options.out || "dist/openapi.yaml",
  );
  const dir = path.dirname(outPath);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outPath, yaml.dump(doc));
  console.log(`✅ OpenAPI spec generated at ${outPath}`);
}
