import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("builds a GitHub Pages entry with project-relative assets", async () => {
  const html = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");

  assert.match(html, /<title>轻声 · SEN 课堂信号<\/title>/);
  assert.match(html, /\/sen-classroom-signal\/assets\//);
  assert.doesNotMatch(html, /chatgpt\.site/);
});
