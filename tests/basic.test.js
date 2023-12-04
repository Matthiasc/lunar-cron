import { expect, test } from "vitest";
import { createLunarCron, LUNAR_PHASES } from "../index";

test("basic", () => {
  const lc = createLunarCron();
  expect(lc.addJob).toBeDefined();
  expect(lc.getScheduledJobs).toBeDefined();
  expect(lc.removeJob).toBeDefined();
  expect(lc.start).toBeDefined();
  expect(lc.stop).toBeDefined();
});

test("createLunarCron", () => {
  const lc = createLunarCron();

  lc.addJob("job1", () => {}, LUNAR_PHASES.NEW);
  lc.addJob("job1", () => {}, LUNAR_PHASES.FULL); //update
  lc.addJob("job2", () => {}, LUNAR_PHASES.NEW, -32); //too big negative offset

  const jobs = lc.getScheduledJobs();
  console.log(jobs.map((j) => ({ ...j, time: new Date(j.executionTime) })));
  expect(jobs.length).toBe(1);
});
