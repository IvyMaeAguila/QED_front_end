// One-time source annotation for the migrated components. No runtime layout work.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = "src";
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(name);
    else if (name.endsWith(".tsx")) files.push(name);
  }
}
walk(root);
let changed = 0;
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  if (!/LoadingRegion|LoadingTable|loading\s*\?\s*<Skeleton|skeleton\s*\?\s*<Skeleton|pending\s*\?\s*<Skeleton/.test(source)) continue;
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  let field = 0;
  function visit(node) {
    if (ts.isJsxElement(node)) {
      const opening = node.openingElement;
      const tag = opening.tagName.getText(ast);
      if (/^[a-z]/.test(tag)) {
        const attrs = opening.attributes.properties.map(attribute => ts.isJsxAttribute(attribute) ? attribute.name.getText(ast) : "");
        const texts = node.children.filter(ts.isJsxText).map(text => text.text.trim()).filter(text => /[a-z]/i.test(text));
        const expressions = node.children.filter(ts.isJsxExpression).filter(expression => expression.expression);
        const known = texts.length > 0 && expressions.length === 0 && /^(h[1-6]|p|span|label|button|th|dt)$/.test(tag);
        const leaf = expressions.some(expression => /<Skeleton(?:Text|Avatar|Image|Control|Paragraph)?\b/.test(expression.getText(ast)));
        if (known || leaf) {
          const name = `${path.basename(file, ".tsx").toLowerCase()}-${known ? texts.join("-").replace(/[^a-z0-9]+/gi, "-").slice(0, 45).toLowerCase() : `${tag}-field-${++field}`}`;
          const annotation = `${attrs.includes("data-sk-region") ? "" : ` data-sk-region="${name}"`}${known && !attrs.includes("data-sk-static") ? ' data-sk-static=""' : ""}`;
          if (annotation) edits.push({ at: opening.attributes.end, text: annotation });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (edits.length) {
    let result = source;
    for (const edit of edits.sort((a, b) => b.at - a.at)) result = result.slice(0, edit.at) + edit.text + result.slice(edit.at);
    fs.writeFileSync(file, result); changed++;
  }
}
process.stdout.write(`Annotated shared static/leaf regions in ${changed} migrated files.\n`);
