import { scheduleJob, RecurrenceRule } from 'node-schedule';
import areaIndicators from './area_indicators'
import wardAttendance from './wards_attendance'

const rule = new RecurrenceRule();

rule.dayOfWeek = [0, 1, 2];
rule.hour = 22;
rule.minute = 0;

scheduleJob(rule, () => {
  wardAttendance.start().catch(err => {
    console.log(err);
  });
});
scheduleJob(rule, () => {
  areaIndicators.start().catch(err => {
    console.log(err);
  });
}); 