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

  it("leaves a genuine solo 3-day build unflagged", () => {
    const flags = submissionFlags({
      title: "CampusBus",
      url: "https://campusbus.workers.dev",
      description:
        "I built a live shuttle tracker for one campus route. Students open the page and see the next bus, its position on a small map, and a walking ETA; the driver taps one button when leaving the gate. I used Next.js and Cloudflare D1, then tested it with forty students for a week and the average wait dropped by six minutes.",
    });
    assert.deepEqual(flags, []);
  });
});
