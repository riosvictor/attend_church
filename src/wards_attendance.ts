import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { Page } from "puppeteer";
import { attendanceHeaderValues } from "./helpers/constants";
import {
  goToHomeLcr,
  initPage,
  initSheet,
  prepareSheet,
  saveInSheets,
  waitLoadURL,
  waitXPathTimes,
} from "./helpers/functions";
import { TAttendance } from "./helpers/models";

let sheet: GoogleSpreadsheetWorksheet;

// operations
async function getWardsInfo(page: Page): Promise<TAttendance[]> {
  const wardCodes = JSON.parse(process.env.WARD_CODES || "[]");
  console.info("Going to wards page...");

  const attendanceWards: TAttendance[] = [];

  for (let ward of wardCodes) {
    const wardURL = `https://lcr.churchofjesuschrist.org/report/sacrament-attendance?lang=por&unitNumber=${ward.code}`;

    await page.goto(wardURL, { waitUntil: "networkidle2", timeout: 0 });
    await waitLoadURL(page, [wardURL]);

    // => Xpath parent element of months + children elements (div)
    // => //*[@id="__next"]/div/div[2]/div[2]/div + div
    const monthsElement = '//*[@id="__next"]/div/div[2]/div[2]/div/div';
    await waitXPathTimes(page, monthsElement);

    const months = await page.$x(monthsElement);

    const attendanceData = months.map(async (month) => {
      const monthName = await month.$eval("div", (el) => el.innerHTML);
      const details = await month.$$eval(
        "div:nth-child(4) > div",
        async (els) => {
          const filtered = els.filter(
            (el) =>
              el.innerHTML.includes("<div") && el.innerHTML.includes("<input")
          );

          const values = await Promise.all(
            filtered.map((el) => {
              const day = el.querySelector("div")?.innerText.replace(/\D/, "");
              const attendance =
                el.querySelector("div > input")?.getAttribute("value") ??
                undefined;

              return {
                day,
                attendance,
              };
            })
          );

          return values;
        }
      );
      const uniqueDetails = details.filter(
        (value, index, self) =>
          index === self.findIndex((t) => t.day === value.day)
      );

      const response = {
        month: monthName,
        days: uniqueDetails,
      };

      return response;
    });

    const attendance = await Promise.all(attendanceData);

    attendanceWards.push({
      ward,
      attendance: attendance,
    });
  }

  return attendanceWards;
}

//
function insertStakeInfo(attendance: TAttendance[]) {
  const stakeInfo = JSON.parse(
    process.env.STAKE_INFO || '{"name": "Stake", "code": "00000"}'
  );
  const initialValue = {
    ward: stakeInfo,
    attendance: [] as TAttendance["attendance"],
  };
  const stakeAttendance = attendance.reduce((previousValue, currentValue) => {
    const newObject = { ...previousValue };

    if (previousValue.attendance.length === 0) {
      newObject.attendance.push(
        ...currentValue.attendance.map((month) => {
          const days = month.days.map((day) => {
            return {
              day: day.day,
              attendance: "0",
            };
          });

          return {
            month: month.month,
            days,
          };
        })
      );
    }

    if (previousValue.attendance.length > 0) {
      const attendance = previousValue.attendance;

      for (let i = 0; i < attendance.length; i++) {
        const days = previousValue.attendance[i].days;

        for (let j = 0; j < days.length; j++) {
          const actualAttendance = Number(
            currentValue.attendance[i].days[j].attendance
          );
          days[j].attendance = String(
            Number(days[j].attendance) + actualAttendance
          );
        }
      }
    }

    return newObject;
  }, initialValue);

  attendance.push(stakeAttendance);

  return attendance;
}

async function savingAllData(
  doc: GoogleSpreadsheet,
  attendance: TAttendance[]
) {
  console.info("Saving in sheets...");

  for (let i = 0; i < attendance.length; i++) {
    const wardInfo = attendance[i];
    const { name, code } = wardInfo.ward;
    let row = 0;

    console.info(`Saving data from ${name}...`);

    sheet = await prepareSheet(doc, attendanceHeaderValues, code);

    for (let j = 0; j < wardInfo.attendance.length; j++) {
      const { days, month } = wardInfo.attendance[j];

      for (let k = 0; k < days.length; k++) {
        const { attendance, day } = days[k];

        await saveInSheets(sheet, row, {
          ward: name,
          month,
          day: day ?? "no day",
          attendance: attendance ?? "0",
        });

        row++;
      }
    }
  }
}

async function start() {
  console.info("> Starting Wards Attendance...");
  const sheetID = process.env.ATTENDANCE_SHEET_ID || "";
  const { page, browser } = await initPage();
  await goToHomeLcr(page);
  const attendance = await getWardsInfo(page);

  await browser.close();

  //
  const attendanceWithStake = insertStakeInfo(attendance);
  const { doc } = await initSheet(sheetID);
  await savingAllData(doc, attendanceWithStake);

  console.log("> Process to save Wards Attendance is Done!");
}

export default {
  start,
};

// https://jvvoliveira.medium.com/manipulando-google-sheets-com-node-js-4a551c68b270
// https://www.npmjs.com/package/google-spreadsheet
// https://github.com/puppeteer/puppeteer/issues/10729
