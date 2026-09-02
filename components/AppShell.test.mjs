import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("top bar surfaces selected model output capacity without provider quota claims", async () => {
  const source = await readFile(new URL("./AppShell.tsx", import.meta.url), "utf8");
  assert.match(source, /modelCapacity?.maxTokens/);
  assert.match(source, /tooltipMaxOutput/);
  assert.doesNotMatch(source, /provider quota|remaining allowance|reset time/i);
});

test("session info popover renders messages and tokens without wrapping counts", async () => {
  const source = await readFile(new URL("./AppShell.tsx", import.meta.url), "utf8");
  assert.match(source, /section\(t\("appShell\.sectionMessages"\),\s*messageRows,\s*"right",\s*true\)/);
  assert.match(source, /section\(t\("appShell\.sectionTokens"\),\s*\[\.\.\.tokenRows,\s*\.\.\.extraTokenRows\],\s*"right",\s*true\)/);
  assert.match(source, /gridTemplateColumns:\s*isMobile\s*\?\s*"1fr"\s*:\s*"minmax\(220px,\s*1fr\)\s*auto\s*auto"/);
});
