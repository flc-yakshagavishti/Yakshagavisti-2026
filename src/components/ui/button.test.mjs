import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "./button.tsx";

const renderButton = (props = {}, children = "Create prasanga") =>
  renderToStaticMarkup(createElement(Button, props, children));

test("submit buttons render a native button so clicking submits the form", () => {
  const html = renderButton({ type: "submit" });
  assert.match(html, /^<button\b/);
  assert.match(html, /type="submit"/);
  assert.match(html, /<\/button>$/);
});

test("action buttons default to button, not implicit form submission", () => {
  const html = renderButton();
  assert.match(html, /^<button\b/);
  assert.match(html, /type="button"/);
});

test("pending buttons use native disabled behavior and retain form association", () => {
  const html = renderButton({
    type: "submit",
    disabled: true,
    form: "prasanga-form",
  });
  assert.match(html, /^<button\b/);
  assert.match(html, /disabled=""/);
  assert.match(html, /form="prasanga-form"/);
});

test("asChild preserves links without nesting a button or adding a button type", () => {
  const html = renderButton(
    { asChild: true },
    createElement("a", { href: "/admin/leaderboard" }, "Leaderboard"),
  );
  assert.match(html, /^<a\b/);
  assert.match(html, /href="\/admin\/leaderboard"/);
  assert.doesNotMatch(html, /<button\b|type="button"/);
});
