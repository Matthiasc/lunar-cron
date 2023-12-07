# lunar-cron 🌕⏱️

- Basic moon phase based cron functionality.
- Uses only one setTimeout in the background.
- Does not store jobs/progress in case of service restart/stop/fail.

```js
import { createLunarCron, LUNAR_PHASES } from "lunar-cron";

const lc = createLunarCron();

lc.addJob(
  "unique job name", //unique job name
  () => console.log("job running!"), //callback / job to run
  LUNAR_PHASES.NEW, //lunar phase as trigger for the job
  0, //offset in ms (optional)
  -1 //times to repeat the job (-1 for infinite times) (optional)
);

lc.removeJob("unique job name"); //remove a job and it's possible future executions

lc.start(); //start the service

lc.stop(); //stop the service

lc.getScheduledJobs(); //list the jobs that are still scheduled/active
```
