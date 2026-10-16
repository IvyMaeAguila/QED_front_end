import { test, expect } from "@playwright/test";
import fs from "node:fs";
import ts from "typescript";
import { routeSkeletons } from "../src/shared/loading/routeSkeletons";

/** Independent AST walk: includes new eager, inline and lazy route components. */
function appRoutes() {
  const paths: string[] = [];
  for (const [filename, root] of [["src/routes/AppRouter.tsx", ""], ...["Admin", "Teacher", "Principal", "Parent"].map(role => [`src/routes/roles/${role}Routes.tsx`, `/${role.toLowerCase()}`])]) {
  const file = ts.createSourceFile(filename, fs.readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node: ts.Node, prefix = "") {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      if (opening.tagName.getText(file) === "Route") {
        const attrs = opening.attributes.properties;
        const path = attrs.find(a => ts.isJsxAttribute(a) && a.name.getText(file) === "path");
        const literal = path && ts.isJsxAttribute(path) && path.initializer && ts.isStringLiteral(path.initializer) ? path.initializer.text : "";
        const full = literal.startsWith("/") ? literal : `${prefix}/${literal}`.replace(/\/$/, "");
        const children = ts.isJsxElement(node) ? node.children.filter(c => ts.isJsxElement(c) || ts.isJsxSelfClosingElement(c)) : [];
        if (!children.length && !literal.endsWith("/*")) paths.push(full || prefix);
        else for (const child of children) visit(child, full);
        return;
      }
    }
    ts.forEachChild(node, child => visit(child, prefix));
  }
  visit(file, root);
  }
  return paths;
}

test("every real route must register its own loading composition", () => {
  const routes = appRoutes();
  expect(routes.length).toBeGreaterThan(0);
  const uncovered = routes.filter(route => !(route in routeSkeletons));
  expect(uncovered, `Routes still requiring migration and real-route verification:\n${uncovered.join("\n")}`).toEqual([]);
  const views = ["Admin", "Teacher", "Principal", "Parent"].map(role => fs.readFileSync(`src/routes/roles/${role}Views.tsx`, "utf8")).join("\n");
  for (const entry of Object.values(routeSkeletons)) {
    expect(entry.skeleton).toBe(`${entry.component}Composition`);
    if (entry.role === "PUBLIC") {
      const source = fs.readFileSync(entry.component === "LandingPage" ? "src/features/Landing/LandingPage.tsx" : "src/features/auth/LoginPanel.tsx", "utf8");
      expect(source).toContain(`import { ${entry.skeleton}`);
      expect(source).toContain(`<${entry.skeleton}`);
    } else {
      const roleViews = fs.readFileSync(`src/routes/roles/${entry.role[0]}${entry.role.slice(1).toLowerCase()}Views.tsx`, "utf8");
      expect(roleViews).toContain(`import { ${entry.skeleton} }`);
      expect(roleViews).toContain(`  ${entry.skeleton},`);
      expect(views).toContain(`import { ${entry.skeleton} }`);
    }
  }
  const connected = new Set<string>();
  for (const filename of ["src/routes/AppRouter.tsx", ...["Admin", "Teacher", "Principal", "Parent"].map(role => `src/routes/roles/${role}Routes.tsx`)]) {
  const source = ts.createSourceFile(filename, fs.readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function checkConnection(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(source) === "lazy") {
      const loader = node.arguments[0];
      if (loader && ts.isPropertyAccessExpression(loader) && loader.name.text === "load" && ts.isElementAccessExpression(loader.expression)) {
        const key = loader.expression.argumentExpression;
        if (loader.expression.expression.getText(source) === "routeSkeletons" && key && ts.isStringLiteral(key) && key.text in routeSkeletons)
          connected.add(routeSkeletons[key.text as keyof typeof routeSkeletons].component);
      }
    }
    ts.forEachChild(node, checkConnection);
  }
  checkConnection(source);
  if (filename.endsWith("AppRouter.tsx")) {
    expect(source.text).toContain('import LandingPage from "../features/Landing/LandingPage"');
    expect(source.text).toContain('import { LoginPanel } from "../features/auth/LoginPanel"');
    expect(source.text).toContain('<LandingPage/>');
    expect(source.text).toContain('<LoginPanel open={true}');
    connected.add("LandingPage"); connected.add("LoginPanel");
  }
  }
  expect([...new Set(Object.values(routeSkeletons).map(entry => entry.component))].filter(component => !connected.has(component)), "registered page compositions must be connected to the actual lazy router").toEqual([]);
});
