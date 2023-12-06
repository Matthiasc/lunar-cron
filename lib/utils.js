// import { Moon } from "lunarphase-js";
import lune from "lune";
import { LUNAR_PHASES } from "./const.js";

//mapping the phases used in lune.js to LUNAR_PHASES
const PHASE_MAP = [LUNAR_PHASES.NEW, LUNAR_PHASES.FIRST_QUARTER, LUNAR_PHASES.FULL, LUNAR_PHASES.LAST_QUARTER];

// const PHASE_PERCENTAGE = 1 / Object.keys(LUNAR_PHASES).length;

// /**
//  * Find the moon phase for a given date.
//  * @param {Date} date to find the moon phase for
//  */
// export function lunarEventPhase(date) {
//   const per = Moon.lunarAgePercent(date);

//   console.log("!", date);
//   console.log(new Date());
//   console.log(lune.phase_hunt(date));

//   if (per > PHASE_PERCENTAGE * 4) return LUNAR_PHASES.NEW;
//   else if (per > PHASE_PERCENTAGE * 3) return LUNAR_PHASES.LAST_QUARTER;
//   else if (per > PHASE_PERCENTAGE * 2) return LUNAR_PHASES.FULL;
//   else if (per > PHASE_PERCENTAGE * 1) return LUNAR_PHASES.FIRST_QUARTER;

//   return LUNAR_PHASES.NEW;
// }

/**
 * Find the next date for a given phase.
 * @param {Date} startDate from where to find the next phase
 * @param {keyof LUNAR_PHASES} phase - lunarPhase phase of the moon
   
 */
export function findNextPhaseDate(startDate, phase = "FULL") {
  const oneMSecondAhead = new Date(startDate.getTime() + 1); //to skip possible current phase
  const oneMonthAhead = new Date(oneMSecondAhead.getTime() + 31 * 24 * 60 * 60 * 1000);

  const phaseDate = lune.phase_range(
    oneMSecondAhead,
    oneMonthAhead,
    PHASE_MAP.findIndex((i) => i === phase)
  )[0];

  return phaseDate;
}
