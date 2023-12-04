import lt from "long-timeout";
import { findNextPhaseDate } from "./lib/utils";
import { LUNAR_PHASES } from "./lib/const";

export { LUNAR_PHASES };

//TODO: add optional date generation object (handy for testing?)
export function createLunarCron() {
  /**
   * job with associated details.
   *
   * @typedef {Object} Job
   * @property {string} jobName - The name of the job.
   * @property {keyof LUNAR_PHASES} lunarPhase - The moon phase associated with the job ("FULL" or "NEW").
   * @property {function(Job)} callBack - The callback function associated with the job.
   * @property {number} offsetTime - The number of days to offset the job.
   * @property {number} offsetHours - The number of hours to offset the job.
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
    const firstJob = _jobs[0];

    const now = Date.now();
    const then = firstJob.executionTime;

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
    const nextPhaseDate = findNextPhaseDate(new Date(), job.lunarPhase);

    nextPhaseDate.setDate(nextPhaseDate.getDate() + job.offsetDays);
    nextPhaseDate.setTime(nextPhaseDate.getTime() + job.offsetHours * 60 * 60 * 1000); //read it was better not to use setHours()

    // add the executionTime to the job
    job.executionTime = nextPhaseDate.getTime();

    sortJobList();
  }

  /**
   * @param {string} jobName - unique name of this job, if already present it will be replaced
   * @param {function(Job)} callBack - function to be called
   * @param {keyof LUNAR_PHASES} lunarPhase - lunarPhase phase of the moon
   * @param {number} offsetDays - 3 = 3 days after the phase, -1 = 1 day before the phase,
   * @param {number} offsetHours -  3 = 3 hours after the phase, -1 = 1 hour before the phase,
   * @param {number} repeat - number of times the job will be scheduled and executed again, -1 for infinit times, 0 the job will be executed only once and not be repeated
   */
  function addJob(jobName, callBack, lunarPhase, offsetDays = 0, offsetHours = 0, repeat = -1) {
    //check data
    if (!(jobName && callBack && lunarPhase)) throw new Error("missing or incorrect arguments");

    lunarPhase = lunarPhase.toUpperCase();

    if (!Object.keys(LUNAR_PHASES).find((p) => p === lunarPhase))
      return console.error(jobName, "has invalid lunarPhase '", lunarPhase, "'");

    repeat = repeat < 0 ? -1 : repeat;

    if (offsetDays + offsetHours / 24 < -31)
      return console.warn(
        "Job",
        jobName,
        "is not added as it most likely be triggered in the past due to high negative offset values"
      );

    jobName = jobName.toLowerCase();

    //try to remove the job if already present
    removeJob(jobName);

    //add the job to the jobList
    _jobs.push({ jobName, callBack, lunarPhase, offsetDays, offsetHours, repeat: repeat, executed: 0 });

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
    _jobs = _jobs.filter((j) => j.jobName !== jobName);
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
