import { test, expect } from "@playwright/test";
import fs from "node:fs";
import ts from "typescript";
import { routeSkeletons } from "../src/shared/loading/routeSkeletons";

/** Independent AST walk: includes new eager, inline and lazy route components. */
function appRoutes() {
  const file = ts.createSourceFile("AppRouter.tsx", fs.readFileSync("src/routes/AppRouter.tsx", "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const paths: string[] = [];
  function visit(node: ts.Node, prefix = "") {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      if (opening.tagName.getText(file) === "Route") {
        const attrs = opening.attributes.properties;
        const path = attrs.find(a => ts.isJsxAttribute(a) && a.name.getText(file) === "path");
        const literal = path && ts.isJsxAttribute(path) && path.initializer && ts.isStringLiteral(path.initializer) ? path.initializer.text : "";
        const full = literal.startsWith("/") ? literal : `${prefix}/${literal}`.replace(/\/$/, "");
        const children = ts.isJsxElement(node) ? node.children.filter(c => ts.isJsxElement(c) || ts.isJsxSelfClosingElement(c)) : [];
        if (!children.length) paths.push(full || prefix);
        else for (const child of children) visit(child, full);
        return;
      }
    }
    ts.forEachChild(node, child => visit(child, prefix));
  }
  visit(file);
  return paths;
}

test("every real route must register its own loading composition", () => {
  const routes = appRoutes();
  expect(routes.length).toBeGreaterThan(0);
  const uncovered = routes.filter(route => !(route in routeSkeletons));
  expect(uncovered, `Routes still requiring migration and real-route verification:\n${uncovered.join("\n")}`).toEqual([]);
  const views = fs.readFileSync("src/shared/loading/routeViews.tsx", "utf8");
  for (const entry of Object.values(routeSkeletons)) {
    expect(entry.skeleton).toBe(`${entry.component}Composition`);
    expect(views).toContain(`import { ${entry.skeleton} }`);
    expect(views).toContain(`  ${entry.skeleton},`);
  }
  const source = ts.createSourceFile("AppRouter.tsx", fs.readFileSync("src/routes/AppRouter.tsx", "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const connected = new Set<string>();
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
  expect([...new Set(Object.values(routeSkeletons).map(entry => entry.component))].filter(component => !connected.has(component)), "registered page compositions must be connected to the actual lazy router").toEqual([]);
});
