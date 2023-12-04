import { expect, test } from "vitest";
import { LUNAR_PHASES } from "../index";
import { findNextPhaseDate } from "../lib/utils";
import { LUNAR_PHASES } from "../lib/const";

import { createLunarCron } from "../index";

test("findNextPhaseDate", () => {
  //new moon on 1ms before exact this date
  const d = new Date("2024-01-11T11:58:05.836Z");

  expect(findNextPhaseDate(d, LUNAR_PHASES.NEW).toISOString()).toBe("2024-01-11T11:58:05.837Z");
  expect(findNextPhaseDate(d, LUNAR_PHASES.FIRST_QUARTER).toISOString()).toBe("2024-01-18T03:53:55.999Z");
  expect(findNextPhaseDate(d, LUNAR_PHASES.FULL).toISOString()).toBe("2024-01-25T17:54:43.323Z");
  expect(findNextPhaseDate(d, LUNAR_PHASES.LAST_QUARTER).toISOString()).toBe("2024-02-02T23:20:08.968Z");

  d.setTime(d.getTime() + 1);
  //should find the next phase
  expect(findNextPhaseDate(d, LUNAR_PHASES.NEW).toISOString()).toBe("2024-02-09T23:00:44.854Z");
});
