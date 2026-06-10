import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- str_replace_editor labels ---

test("shows 'Creating' for str_replace_editor create command", () => {
  render(<ToolCallBadge toolInvocation={{ toolName: "str_replace_editor", args: { command: "create", path: "/App.jsx" }, state: "result", result: "ok" }} />);
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor str_replace command", () => {
  render(<ToolCallBadge toolInvocation={{ toolName: "str_replace_editor", args: { command: "str_replace", path: "/Card.jsx" }, state: "result", result: "ok" }} />);
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor insert command", () => {
  render(<ToolCallBadge toolInvocation={{ toolName: "str_replace_editor", args: { command: "insert", path: "/utils.ts" }, state: "result", result: "ok" }} />);
  expect(screen.getByText("Editing utils.ts")).toBeDefined();
});

test("shows 'Reading' for str_replace_editor view command", () => {
  render(<ToolCallBadge toolInvocation={{ toolName: "str_replace_editor", args: { command: "view", path: "/index.html" }, state: "result", result: "ok" }} />);
  expect(screen.getByText("Reading index.html")).toBeDefined();
});

test("shows 'Undoing edit' for str_replace_editor undo_edit command", () => {
  render(<ToolCallBadge toolInvocation={{ toolName: "str_replace_editor", args: { command: "undo_edit", path: "/helpers.js" }, state: "result", result: "ok" }} />);
  expect(screen.getByText("Undoing edit in helpers.js")).toBeDefined();
});

// --- file_manager labels ---

test("shows 'Renaming' for file_manager rename command", () => {
  render(<ToolCallBadge toolInvocation={{ toolName: "file_manager", args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" }, state: "result", result: { success: true } }} />);
  expect(screen.getByText("Renaming old.jsx")).toBeDefined();
});

test("shows 'Deleting' for file_manager delete command", () => {
  render(<ToolCallBadge toolInvocation={{ toolName: "file_manager", args: { command: "delete", path: "/App.jsx" }, state: "result", result: { success: true } }} />);
  expect(screen.getByText("Deleting App.jsx")).toBeDefined();
});

// --- path handling ---

test("extracts filename from a deeply nested path", () => {
  render(<ToolCallBadge toolInvocation={{ toolName: "str_replace_editor", args: { command: "create", path: "/src/components/ui/Button.tsx" }, state: "result", result: "ok" }} />);
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

// --- unknown tool fallback ---

test("falls back to toolName for an unknown tool", () => {
  render(<ToolCallBadge toolInvocation={{ toolName: "unknown_tool", args: {}, state: "result", result: "ok" }} />);
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

// --- pending vs done state ---

test("shows spinner when state is not result", () => {
  const { container } = render(<ToolCallBadge toolInvocation={{ toolName: "str_replace_editor", args: { command: "create", path: "/App.jsx" }, state: "call" }} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot when state is result with a result value", () => {
  const { container } = render(<ToolCallBadge toolInvocation={{ toolName: "str_replace_editor", args: { command: "create", path: "/App.jsx" }, state: "result", result: "ok" }} />);
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is result but result is null", () => {
  const { container } = render(<ToolCallBadge toolInvocation={{ toolName: "str_replace_editor", args: { command: "create", path: "/App.jsx" }, state: "result", result: null }} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
