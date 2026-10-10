import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const roleNames = ["Admin", "Teacher", "Principal", "Parent"];
const sourceId = (file: string) => path.resolve(__dirname, file).replaceAll("\\", "/");
const eagerGroups = new Map<string, string>();

// https://vite.dev/config/
export default defineConfig({
  // ExcelJS is a large, optional export/import feature and is loaded on demand.
  // Set the warning threshold just above its minified package chunk (about 930 kB).
  build: {
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      preserveEntrySignatures: "allow-extension",
      output: {
        strictExecutionOrder: true,
        // Coalesce only modules with identical authenticated audiences. Controllers
        // and optional libraries reached through dynamic imports remain lazy.
        codeSplitting: { includeDependenciesRecursively: false, groups: [{ name: id => eagerGroups.get(id) ?? null }] },
      },
    },
  },
  plugins: [
    {
      name: "qed-eager-role-groups",
      apply: "build",
      transform(code, id) {
        if (!id.replaceAll("\\", "/").endsWith("/shared/loading/routeSkeletons.ts")) return;
        // Region classifications are an audit/test source, never runtime UI data.
        const ast = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        const result = ts.transform(ast, [context => root => {
          const visit: ts.Visitor = node => ts.isObjectLiteralExpression(node)
            ? ts.factory.updateObjectLiteralExpression(node, node.properties.filter(property => !(ts.isPropertyAssignment(property) && property.name.getText(ast) === "regions")).map(property => ts.visitEachChild(property, visit, context)))
            : ts.visitEachChild(node, visit, context);
          return ts.visitNode(root, visit) as ts.SourceFile;
        }]);
        const output = ts.createPrinter().printFile(result.transformed[0]);
        result.dispose();
        return { code: output, map: null };
      },
      buildEnd() {
        const closure = (root: string, seen = new Set<string>()) => {
          if (seen.has(root)) return seen;
          seen.add(root);
          this.getModuleInfo(root)?.importedIds.forEach(id => closure(id, seen));
          return seen;
        };
        const publicModules = closure(sourceId("src/main.tsx"));
        const audiences = new Map<string, string[]>();
        for (const role of roleNames) for (const id of closure(sourceId(`src/routes/roles/${role}Routes.tsx`))) {
          if (publicModules.has(id) || /\.(?:css|png|jpg|webp|svg)(?:\?|$)/.test(id)) continue;
          audiences.set(id, [...(audiences.get(id) ?? []), role.toLowerCase()]);
        }
        eagerGroups.clear();
        for (const id of publicModules) {
          if (/\.(?:css|png|jpg|webp|svg)(?:\?|$)/.test(id)) continue;
          eagerGroups.set(id, id.includes("node_modules/") ? "public-vendor" : "public-app");
        }
        audiences.forEach((roles, id) => eagerGroups.set(id, "role-eager-" + roles.join("-")));
      },
    },
    {
      name: "qed-dev-ready",
      apply: "serve",
      configureServer(server) {
        // A cold development server must finish source compilation before it
        // advertises HTML readiness. This does not import code in the browser.
        const seen = new Set<string>();
        const warm = async (url: string): Promise<void> => {
          if (seen.has(url) || !url.startsWith("/src/") || /\.(?:css|png|jpg|webp|svg)(?:\?|$)/.test(url)) return;
          seen.add(url);
          const transformed = await server.environments.client.transformRequest(url);
          if (!transformed) return;
          const ast = ts.createSourceFile(url, transformed.code, ts.ScriptTarget.Latest, false, ts.ScriptKind.JS);
          const dependencies = ast.statements.flatMap(statement => {
            const specifier = ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement) ? statement.moduleSpecifier : undefined;
            return specifier && ts.isStringLiteral(specifier) ? [specifier.text] : [];
          });
          await Promise.all(dependencies.map(warm));
        };
        const ready = Promise.all([warm("/src/main.tsx"), ...roleNames.map(role => warm(`/src/routes/roles/${role}Routes.tsx`))]);
        server.middlewares.use((request, _response, next) => {
          if (request.headers.accept?.includes("text/html") || request.url?.startsWith("/loading-harness.html")) void ready.then(() => next(), next);
          else next();
        });
      },
    },
    {
      name: "qed-bundle-audit",
      generateBundle(_options, bundle) {
        this.emitFile({ type: "asset", fileName: "bundle-audit.json", source: JSON.stringify(
          Object.values(bundle).filter(item => item.type === "chunk").map(item => ({
            fileName: item.fileName, isEntry: item.isEntry, imports: item.imports,
            modules: Object.keys(item.modules).map(id => id.replaceAll("\\", "/").replace(__dirname.replaceAll("\\", "/") + "/", "")),
          })), null, 2) });
      },
    },
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
});
