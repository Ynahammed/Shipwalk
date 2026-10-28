import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkSubmission, MIN_SCORE_FOR_CERTIFICATE } from "../lib/submit-guard.ts";

const requestUrl = "https://shipweek.example.workers.dev/api/submit";

const good = {
  title: "CampusBus",
  url: "https://campusbus.example.workers.dev",
  description:
    "A live shuttle tracker for one campus route. Students see the next bus and a walking ETA; the driver flips one switch when leaving the gate. Built with Next.js and D1, tested with forty students for a week.",
  requestUrl,
};

describe("submission guard", () => {
  it("accepts a described project with its own link", () => {
    assert.deepEqual(checkSubmission(good), { ok: true });
  });

  it("rejects keyboard mash, which is what produced an 82/100", () => {
    const result = checkSubmission({
      title: "nsbsghGHX",
      url: "https://shipweek.example.workers.dev/submit/naveed-mp4",
      description: "SBASHGCAH",
      requestUrl,
    });
    assert.equal(result.ok, false);
  });

  it("rejects a link that points back at this site", () => {
    const result = checkSubmission({
      ...good,
      url: "https://shipweek.example.workers.dev/submit/naveed-mp4",
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /back to ShipWeek/i);
  });

  it("rejects descriptions shorter than the documented minimum", () => {
    const result = checkSubmission({ ...good, description: "Lost and found app for college." });
    assert.equal(result.ok, false);
    assert.match(result.error, /couple of sentences/i);
  });

  it("rejects a single long token with no real words", () => {
    const result = checkSubmission({
      ...good,
      description: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });
    assert.equal(result.ok, false);
  });

  it("rejects a URL without a host", () => {
    const result = checkSubmission({ ...good, url: "https://notaurl" });
    assert.equal(result.ok, false);
  });

  it("keeps the certificate floor below any judged project", () => {
    assert.equal(MIN_SCORE_FOR_CERTIFICATE, 25);
  });
});
