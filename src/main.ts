import 'dotenv/config';
import { scheduleJob, RecurrenceRule } from 'node-schedule';
import areaIndicators from './area_indicators';
import wardAttendance from './wards_attendance';

const rule = new RecurrenceRule();

rule.dayOfWeek = [0, 1, 2, 3];
rule.hour = 17;
rule.minute = 0;
rule.tz = 'America/Sao_Paulo'

async function run() {
  try {
    await wardAttendance.start()
    await areaIndicators.start();
  } catch (err) {
    console.log(err);
  }
}

scheduleJob(rule, () => run());

console.log('Jobs are scheduled!');

run();