import 'dotenv/config';
import { scheduleJob, RecurrenceRule } from 'node-schedule';
import areaIndicators from './area_indicators';
import wardAttendance from './wards_attendance';

const rule = new RecurrenceRule();

rule.dayOfWeek = [0, 1, 2, 3];
rule.hour = 17;
rule.minute = 0;
rule.tz = 'America/Sao_Paulo'

// scheduleJob(rule, () => {
//   wardAttendance.start().catch(err => {
//     console.log(err);
//   });
// });
// scheduleJob(rule, () => {
//   areaIndicators.start().catch(err => {
//     console.log(err);
//   });
// });

// console.log('Jobs are scheduled!');

  wardAttendance.start().catch(err => {
    console.log(err);
  });