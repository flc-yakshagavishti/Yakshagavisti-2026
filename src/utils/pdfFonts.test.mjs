import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanPdfText } from "./pdfFonts.ts";

test("cleanPdfText preserves Kannada and English characters", () => {
  assert.equal(cleanPdfText("ಪುನೀತ್ H ಕರ್ಕೇರ"), "ಪುನೀತ್ H ಕರ್ಕೇರ");
  assert.equal(cleanPdfText("  ರುಧಿರಾಕ್ಷ (ವೀರಕಾಸುರ)  "), "ರುಧಿರಾಕ್ಷ (ವೀರಕಾಸುರ)");
  assert.equal(cleanPdfText("Dasharatha"), "Dasharatha");
  assert.equal(cleanPdfText("  Team   1  "), "Team 1");
});

test("cleanPdfText handles empty, null and undefined inputs safely", () => {
  assert.equal(cleanPdfText(""), "");
  assert.equal(cleanPdfText(null), "");
  assert.equal(cleanPdfText(undefined), "");
});

test("cleanPdfText strips non-printable control characters", () => {
  assert.equal(cleanPdfText("Hello\u0000\u0007World"), "HelloWorld");
});
