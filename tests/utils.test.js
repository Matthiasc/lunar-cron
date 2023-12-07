import { expect, test, vi, beforeAll, assert } from "vitest";
import { LUNAR_PHASES } from "../index";
import { findNextPhaseDate, findNextScheduleDate } from "../lib/utils";
import { LUNAR_PHASES } from "../lib/const";

beforeAll(() => {
  vi.useFakeTimers();
});

test("findNextPhaseDate", () => {
  //new moon event happens on 1ms after this exact date
  vi.setSystemTime(new Date("2024-01-11T11:58:05.836Z"));
  const d = new Date();

  expect(findNextPhaseDate(d, LUNAR_PHASES.NEW).toISOString()).toBe("2024-01-11T11:58:05.837Z");
  expect(findNextPhaseDate(d, LUNAR_PHASES.FIRST_QUARTER).toISOString()).toBe("2024-01-18T03:53:55.999Z");
  expect(findNextPhaseDate(d, LUNAR_PHASES.FULL).toISOString()).toBe("2024-01-25T17:54:43.323Z");
  expect(findNextPhaseDate(d, LUNAR_PHASES.LAST_QUARTER).toISOString()).toBe("2024-02-02T23:20:08.968Z");

  d.setTime(d.getTime() + 1);
  //should find the next phase
  expect(findNextPhaseDate(d, LUNAR_PHASES.NEW).toISOString()).toBe("2024-02-09T23:00:44.854Z");
});

test("findNextScheduleDate", () => {
  //new moon event happens on 1ms after this exact date
  vi.setSystemTime(new Date("2024-01-11T11:58:05.836Z"));

  expect(findNextScheduleDate(LUNAR_PHASES.NEW, -1).toISOString()).toBe("2024-01-11T11:58:05.836Z");
  expect(findNextScheduleDate(LUNAR_PHASES.NEW, 0).toISOString()).toBe("2024-01-11T11:58:05.837Z");
  expect(findNextScheduleDate(LUNAR_PHASES.NEW, 2).toISOString()).toBe("2024-01-11T11:58:05.839Z");
  expect(findNextScheduleDate(LUNAR_PHASES.NEW, -2).toISOString()).toBe("2024-02-09T23:00:44.852Z");
  expect(findNextScheduleDate(LUNAR_PHASES.NEW, -24 * 60 * 60 * 1000).toISOString()).toBe("2024-02-08T23:00:44.854Z");
});

test("big negative offset should move to the next FULL moon", () => {
  //new moon event happens on 1ms after this exact date
  vi.setSystemTime(new Date("2024-01-11T11:58:05.836Z"));
  expect(findNextScheduleDate(LUNAR_PHASES.FULL, 0).toISOString()).toBe("2024-01-25T17:54:43.323Z");
  expect(findNextScheduleDate(LUNAR_PHASES.FULL, -20 * 24 * 60 * 60 * 1000).toISOString()).toBe(
    "2024-02-04T12:31:19.525Z"
  );
});

test("should not be able to schedule with offsetTime smaller then synodic month", () => {
  assert.Throw(() => findNextScheduleDate(LUNAR_PHASES.FULL, -30 * 24 * 60 * 60 * 1000));
});
