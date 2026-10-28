import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { submissionFlags } from "../lib/submission-signals.ts";

describe("submission review signals", () => {
  it("flags a corporate multi-month team project", () => {
    const flags = submissionFlags({
      title: "xjscnbc",
      url: "https://example.workers.dev",
      description:
        "Project Overview • Goal: Replace an outdated legacy system with a modern, responsive web application to improve user engagement and cut support tickets by 30%. • Duration: 4 months • Team: 2 UI/UX designers, 4 frontend/backend developers, 1 QA engineer. Tools Used to Track Progress: Jira for sprints and task velocity, Gantt charts via Microsoft Project for milestones, Asana for weekly reviews.",
    });
    assert.ok(flags.some((flag) => /timeline longer/i.test(flag)), flags.join(" | "));
    assert.ok(flags.some((flag) => /team rather than one student/i.test(flag)), flags.join(" | "));
    assert.ok(flags.some((flag) => /corporate tooling/i.test(flag)), flags.join(" | "));
  });

  it("flags a thin description with no feature", () => {
    const flags = submissionFlags({
      title: "Thing",
      url: "https://thing.workers.dev",
      description: "This project is very good and it does many useful things for many people and everything about it is nice.",
    });
    assert.ok(flags.some((flag) => /words of description/i.test(flag)), flags.join(" | "));
    assert.ok(flags.some((flag) => /No specific feature/i.test(flag)), flags.join(" | "));
  });

  it("leaves a genuine solo 60-minute AI build unflagged", () => {
    const flags = submissionFlags({
      title: "DeadlineDecoder",
      url: "https://deadlinedecoder.workers.dev",
      description:
        "I paste a syllabus and get back one table of deliverables and dates, plus what to start tonight. One server route calls a hosted LLM with a strict JSON schema and the page renders the rows as cards; rows without a parseable date are dropped instead of guessed. I built it with Next.js in the session and opened it to two friends during the placement block.",
    });
    assert.deepEqual(flags, []);
  });
});
