import "dotenv/config";
import areaIndicators from "./area_indicators";
import wardAttendance from "./wards_attendance";

async function run() {
  const day = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
  console.log(day);

  try {
    await wardAttendance.start();
    await areaIndicators.start();
  } catch (err) {
    console.log(err);
  }
}

run();
