import 'dotenv/config';
import { scheduleJob, RecurrenceRule } from 'node-schedule';
import areaIndicators from './area_indicators';
import wardAttendance from './wards_attendance';

const rule = new RecurrenceRule();

rule.dayOfWeek = [2];
rule.hour = 16;
rule.minute = 30;
rule.tz = 'America/Sao_Paulo'

async function run() {
   const day = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

   console.log(day);

  try {
    // await wardAttendance.start()
    await areaIndicators.start();
  } catch (err) {
    console.log(err);
  }
}

//scheduleJob(rule, () => run());

//console.log('Jobs are scheduled!');

run();
