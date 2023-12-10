import lune from "lune";
import { LUNAR_PHASES, SYNODIC_MONTH_IN_MS } from "./const.js";

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
 * @param {keyof LUNAR_PHASES} lunarPhase - phase of the moon
   
 */
export function findNextPhaseDate(startDate, lunarPhase = "FULL") {
  const oneMSecondAhead = new Date(startDate.getTime() + 1); //to skip possible current phase
  const oneMonthAhead = new Date(oneMSecondAhead.getTime() + 31 * 24 * 60 * 60 * 1000);

  const phaseDate = lune.phase_range(
    oneMSecondAhead,
    oneMonthAhead,
    PHASE_MAP.findIndex((i) => i === lunarPhase)
  )[0];

  return phaseDate;
}

/**
 *
 * @param {keyof LUNAR_PHASES } lunarPhase - phase of the moon
 * @param {number} offsetTime - the time in ms to offset the phase
 * @param {Date} [startDate=new Date()] - the date from where to find the next scheduleDate (optional)
 */
export function findNextScheduleDate(lunarPhase, offsetTime, startDate = new Date()) {
  if (offsetTime <= -SYNODIC_MONTH_IN_MS)
    throw Error("Cannot schedule negative offsets bigger then 29.53058868 days (one synodic month)");

  // calculate next job date
  let date = findNextPhaseDate(startDate, lunarPhase);
  date.setTime(date.getTime() + offsetTime);

  // if appears in the past: move 1 month - 1 day into the future,
  if (date < Date.now()) {
    date = findNextPhaseDate(new Date(startDate.getTime() + SYNODIC_MONTH_IN_MS - 24 * 60 * 60 * 1000), lunarPhase);
    date.setTime(date.getTime() + offsetTime);
  }

  return date;
}
