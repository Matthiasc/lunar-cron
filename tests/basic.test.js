import { expect, test, vi, beforeAll, assert } from "vitest";
import { createLunarCron, LUNAR_PHASES } from "../index";
import { findNextPhaseDate } from "../lib/utils";

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2023, 0, 1));
});

test("basic", () => {
  const lc = createLunarCron();
  expect(lc.addJob).toBeDefined();
  expect(lc.getScheduledJobs).toBeDefined();
  expect(lc.removeJob).toBeDefined();
  expect(lc.start).toBeDefined();
  expect(lc.stop).toBeDefined();

  const job = lc.addJob("job1", () => {}, LUNAR_PHASES.NEW);
  expect(job.callBack).toBeDefined();
  expect(job.executed).toBe(0);
  expect(job.executionTime).toBeDefined();
  expect(job.jobName).toBe("job1");
  expect(job.lunarPhase).toBeDefined();
  expect(job.offsetTime).toBe(0);
  expect(job.repeat).toBe(-1);
});

test("offsetTime too negative throws error", () => {
  const lc = createLunarCron();

  assert.throws(() => {
    lc.addJob("job", () => {}, LUNAR_PHASES.NEW, -30 * 24 * 60 * 60 * 1000);
  }, "Job 'job' is not allowed to have a negative offset time larger then a lunar cycle");

  const jobs = lc.getScheduledJobs();
  expect(jobs.length).toBe(0);
});

test("createLunarCron", () => {
  const lc = createLunarCron();

  lc.addJob("job", () => {}, LUNAR_PHASES.NEW);
  lc.addJob("job", () => {}, LUNAR_PHASES.FULL); //update

  const jobs = lc.getScheduledJobs();
  expect(jobs.length).toBe(1);
});

test("trigger each phase", async () => {
  Object.keys(LUNAR_PHASES).forEach((phase) => {
    const mf = vi.fn();
    const phaseTime = findNextPhaseDate(new Date(), phase).getTime();
    const timeLeft = phaseTime - Date.now();

    const lc = createLunarCron();
    lc.addJob("job1", mf, phase);
    lc.start();
    vi.advanceTimersByTime(timeLeft);
    expect(mf).toHaveBeenCalledTimes(1);
  });
});

test("should trigger a few times", async () => {
  const phaseTime = findNextPhaseDate(new Date(), LUNAR_PHASES.FULL).getTime();
  const timeLeft = phaseTime - Date.now();

  const mf = vi.fn();

  const lc = createLunarCron();
  lc.addJob("job", mf, LUNAR_PHASES.FULL, 0);
  lc.start();
  vi.advanceTimersByTime(timeLeft - 1);

  expect(mf).toHaveBeenCalledTimes(0);

  vi.advanceTimersByTime(1);

  expect(mf).toHaveBeenCalledTimes(1);

  vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000);

  expect(mf).toHaveBeenCalledTimes(2);

  vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000);

  expect(mf).toHaveBeenCalledTimes(3);
});

test("repeat 0 should trigger once", async () => {
  const phaseTime = findNextPhaseDate(new Date(), LUNAR_PHASES.FIRST_QUARTER).getTime();
  const timeLeft = phaseTime - Date.now();

  const mf = vi.fn();

  const lc = createLunarCron();
  lc.addJob("job", mf, LUNAR_PHASES.FIRST_QUARTER, 0, 0);
  lc.start();
  vi.advanceTimersByTime(timeLeft);

  expect(mf).toHaveBeenCalledTimes(1);

  vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000);

  expect(mf).toHaveBeenCalledTimes(1);
});

test("positive offsetTime", async () => {
  const phaseTime = findNextPhaseDate(new Date(), LUNAR_PHASES.FIRST_QUARTER).getTime();
  const timeLeft = phaseTime - Date.now();
  const oneDayOffset = 24 * 60 * 60 * 1000;
  const mf = vi.fn();

  const lc = createLunarCron();
  lc.addJob("job", mf, LUNAR_PHASES.FIRST_QUARTER, oneDayOffset, 0);
  lc.start();
  vi.advanceTimersByTime(timeLeft);

  expect(mf).toHaveBeenCalledTimes(0);

  vi.advanceTimersByTime(oneDayOffset);

  expect(mf).toHaveBeenCalledTimes(1);
});

test("negative offsetTime", async () => {
  const phaseTime = findNextPhaseDate(new Date(), LUNAR_PHASES.FIRST_QUARTER).getTime();
  const timeLeft = phaseTime - Date.now();
  const oneDayOffset = 24 * 60 * 60 * 1000;
  const mf = vi.fn();

  const lc = createLunarCron();
  lc.addJob("job", mf, LUNAR_PHASES.FIRST_QUARTER, -oneDayOffset, 0);
  lc.start();
  vi.advanceTimersByTime(timeLeft - oneDayOffset - 1);

  expect(mf).toHaveBeenCalledTimes(0);

  vi.advanceTimersByTime(1);

  expect(mf).toHaveBeenCalledTimes(1);
});

test("removing jobs", async () => {
  const phaseTime = findNextPhaseDate(new Date(), LUNAR_PHASES.NEW).getTime();
  const timeLeft = phaseTime - Date.now();
  const mf = vi.fn();

  const lc = createLunarCron();
  lc.addJob("job1", mf, LUNAR_PHASES.NEW);
  lc.addJob("job2", mf, LUNAR_PHASES.NEW);
  lc.start();
  lc.removeJob("job1");

  vi.advanceTimersByTime(timeLeft);

  let jobs = lc.getScheduledJobs();

  expect(jobs.length).toBe(1);

  expect(mf).toHaveBeenCalledTimes(1);
});
