import lt from "long-timeout";
import { findNextPhaseDate } from "./lib/utils.js";
import { LUNAR_PHASES } from "./lib/const.js";

export { LUNAR_PHASES };

const SYNODIC_MONTH_IN_MS = 29.53058868 * 24 * 60 * 60 * 1000;

//TODO: add optional date generation object (handy for testing?)
export function createLunarCron() {
  /**
   * job with associated details.
   *
   * @typedef {Object} Job
   * @property {string} jobName - The name of the job.
   * @property {keyof LUNAR_PHASES} lunarPhase - The moon phase associated with the job ("FULL" or "NEW").
   * @property {function(Job)} callBack - The callback function associated with the job.
   * @property {number} offsetTime - The time to offset the job schedule.
   * @property {number} repeat - How many times the job will be executed (default is -1 for infinite times);
   * @property {number} executed - How many times the job is executed;
   * @property {number} executionTime - The next execution time for the callback to be invoked
   */

  let _setTimeoutId;
  let _started = false;
  /**
   * An array of jobs.
   *
   * @type {Job[]}
   */
  let _jobs = [];

  /**
   * @type {Job}
   */
  let _scheduledJob;

  function start() {
    _started = true;
    //for moon cycle rythms, an interval of one hour
    scheduleFirstJob();
  }

  function stop() {
    _started = false;

    if (!_setTimeoutId) return;

    lt.clearTimeout(_setTimeoutId);
    _setTimeoutId = null;
  }

  function scheduleFirstJob() {
    if (_setTimeoutId) return;

    if (_jobs.length <= 0) return;

    //find next job
    sortJobList();
    const firstJob = (_scheduledJob = _jobs[0]);

    const now = Date.now();
    const then = _scheduledJob.executionTime;

    _setTimeoutId = lt.setTimeout(
      function () {
        _setTimeoutId = null;
        firstJob.executed++;
        try {
          firstJob.callBack({ ...firstJob });
        } catch (error) {
          console.warn("Job execution failed for", firstJob.jobName);
        }
        removeFinishedJobs();
        setJobExecutionTime(firstJob.jobName);
        scheduleFirstJob();
      },
      then < now ? 0 : then - now
    );
  }

  function sortJobList() {
    _jobs.sort((a, b) => {
      if (a.executionTime > b.executionTime) return 1;
      if (a.executionTime < b.executionTime) return -1;
      return 0;
    });
  }

  function setJobExecutionTime(jobName) {
    //find the job
    const job = _jobs.find((j) => j.jobName === jobName);

    if (!job) return;

    // get job pattern

    // calculate next job date
    let nextPhaseDate = findNextPhaseDate(new Date(), job.lunarPhase);

    nextPhaseDate.setTime(nextPhaseDate.getTime() + job.offsetTime);

    //add a month if appears in the past.
    if (Date.now() > nextPhaseDate) {
      nextPhaseDate = findNextPhaseDate(new Date(Date.now() + SYNODIC_MONTH_IN_MS), job.lunarPhase);
      nextPhaseDate.setTime(nextPhaseDate.getTime() + job.offsetTime);
      console.error("adding one ", nextPhaseDate);
    }

    if (Date.now() > nextPhaseDate) {
      console.log("this should not happen", getScheduledJobs());
    }

    // add the executionTime to the job
    job.executionTime = nextPhaseDate.getTime();

    sortJobList();
  }

  /**
   * @param {string} jobName - unique name of this job, if already present it will be replaced
   * @param {function(Job)} callBack - function to be called
   * @param {keyof LUNAR_PHASES} lunarPhase - lunarPhase phase of the moon
   * @param {number} offsetTime - time in ms, 24 * 60 * 60 * 1000 = 1 day after the phase, -24 * 60 * 60 * 1000 = 1 day before the phase,
   * @param {number} repeat - number of times the job will be scheduled and executed again, -1 for infinit times, 0 the job will be executed only once and not be repeated
   */
  function addJob(jobName, callBack, lunarPhase, offsetTime = 0, repeat = -1) {
    //check data
    if (!(jobName && callBack && lunarPhase)) throw new Error("missing or incorrect arguments");

    lunarPhase = lunarPhase.toUpperCase();

    if (!Object.keys(LUNAR_PHASES).find((p) => p === lunarPhase))
      return console.error(jobName, "has invalid lunarPhase '", lunarPhase, "'");

    repeat = repeat < 0 ? -1 : repeat;

    if (offsetTime < -SYNODIC_MONTH_IN_MS)
      throw new Error("Job '" + jobName + "' is not allowed to have a negative offset time larger then a lunar cycle");

    jobName = jobName.toLowerCase();

    //try to remove the job if already present
    removeJob(jobName);

    //add the job to the jobList
    _jobs.push({ jobName, callBack, lunarPhase, offsetTime, repeat: repeat, executed: 0 });

    //determine the next executionTime for the job
    setJobExecutionTime(jobName);

    //sort
    sortJobList();

    //schedule job is possible
    if (_started) scheduleFirstJob();

    return { ..._jobs.find((j) => j.jobName === jobName) };
  }

  /**
   *
   * @param {string} jobName
   */
  function removeJob(jobName) {
    //remove the job from the list
    _jobs = _jobs.filter((j) => j.jobName !== jobName);
    //cancel if there is a current scheduled job
    if (_scheduledJob?.jobName === jobName) {
      lt.clearTimeout(_setTimeoutId);
      _scheduledJob = null;
      _setTimeoutId = null;
      scheduleFirstJob();
    }
  }

  /**
   * remove jobs that should not be triggered any more.
   */
  function removeFinishedJobs() {
    _jobs = _jobs.filter((j) => j.repeat === -1 || j.repeat + 1 > j.executed);
    sortJobList();
  }

  /**
   * An array of jobsExecutions
   *
   * @returns {JobExecution[]}
   */
  function getScheduledJobs() {
    //return a copy
    return [..._jobs].map((j) => ({ ...j }));
  }

  return {
    start,
    stop,
    addJob,
    removeJob,
    getScheduledJobs,
  };
}
