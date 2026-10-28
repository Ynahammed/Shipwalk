import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cleanName,
  isValidEmail,
  maskEmail,
  normalizePhone,
  percent,
  refPrefix,
  slugifySource,
  truncate,
} from "../lib/utils.ts";

describe("signup validation", () => {
  it("accepts a normal email and rejects malformed ones", () => {
    assert.equal(isValidEmail("student@college.ac.in"), true);
    assert.equal(isValidEmail("student@college"), false);
    assert.equal(isValidEmail("not-an-email"), false);
    assert.equal(isValidEmail(" spaced@college.edu "), true, "the signup route trims before validating");
    assert.equal(isValidEmail("a@b.co"), true);
  });

  it("normalizes Indian mobile numbers and rejects short input", () => {
    assert.equal(normalizePhone("98765 43210"), "9876543210");
    assert.equal(normalizePhone("+91 98765 43210"), "9876543210");
    assert.equal(normalizePhone("09876543210"), "9876543210");
    assert.equal(normalizePhone("12345"), null);
    assert.equal(normalizePhone(""), null);
  });

  it("trims and collapses whitespace in names", () => {
    assert.equal(cleanName("  Aarav   Sharma  "), "Aarav Sharma");
  });

  it("keeps referral codes inside the schema's allowed charset", () => {
    const prefix = refPrefix("Aarav Sharma");
    assert.match(prefix, /^[a-z0-9]+$/);
    assert.ok(prefix.length > 0 && prefix.length <= 10);
  });

  it("only allows known traffic sources", () => {
    assert.equal(slugifySource("LinkedIn"), "linkedin");
    assert.equal(slugifySource("whatsapp"), "whatsapp");
    assert.equal(slugifySource("some random thing"), "direct");
  });
});

describe("display helpers", () => {
  it("masks emails without dropping the domain", () => {
    const masked = maskEmail("student@college.edu");
    assert.ok(!masked.includes("student"));
    assert.ok(masked.endsWith("@college.edu"));
  });

  it("returns safe percentages", () => {
    assert.equal(percent(1, 4), 25);
    assert.equal(percent(0, 0), 0);
    assert.equal(percent(5, 0), 0);
  });

  it("truncates without breaking short strings", () => {
    assert.equal(truncate("short", 10), "short");
    assert.ok(truncate("a".repeat(20), 8).length <= 8);
  });
});
