import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { Page } from "puppeteer";
import {
  baptismHeaderValues,
  missionaryHeaderValues,
  recommendationsHeaderValues,
} from "./helpers/constants";
import {
  convertDateToString,
  goToHomeLcr,
  initPage,
  initSheet,
  prepareSheet,
  waitLoadURL,
} from "./helpers/functions";
import { TBaptisms, TMissionary, TRecommendations } from "./helpers/models";

let sheet: GoogleSpreadsheetWorksheet;

// operations
async function goToBaptismPage(page: Page): Promise<TBaptisms[]> {
  console.info("Going to baptism page...");

  const baptismPage =
    "https://lcr.churchofjesuschrist.org/report/custom-reports-details/6f6a7787-e5b1-4f9c-9784-518826dc3da5";

  await waitLoadURL(page, [baptismPage]);

  const selector = "#mainContent > div:nth-child(1) > div > div > div";

  await page.waitForSelector(selector);

  const nodes = await page.$$(`${selector} > *`);

  const aggregateUnitData = nodes.map(async (node) => {
    const ward = await node.$eval("h3", (el) => el.innerHTML);
    const count = await (
      await node.$$("custom-reports-table > table > tbody > tr")
    ).length;

    return {
      ward,
      count,
      month: new Date().getMonth() + 1,
    };
  });

  const aggregateUnitCounts = await Promise.all(aggregateUnitData);

  return aggregateUnitCounts;
}

async function goToMissionaryPage(page: Page): Promise<TMissionary[]> {
  console.info("Going to missionary page...");

  const missionaryPage = "https://lcr.churchofjesuschrist.org/orgs/-5?lang=eng";

  await waitLoadURL(page, [missionaryPage]);

  // //*[@id="mainContent"]/full-time-missionaries-table[1]/div/div[1]/table[1]
  await page.waitForXPath(
    '//*[@id="mainContent"]/full-time-missionaries-table[1]/div/div[1]/table[1]'
  );

  const rows = await page.$x(
    '//*[@id="mainContent"]/full-time-missionaries-table[1]/div/div[1]/table[1]/tbody/tr'
  );

  const missionaryValues = rows.map(async (row) => {
    const details = await row.$$eval("td", async (els) => {
      const values = await Promise.all(
        els.map((el) => {
          return el.textContent?.trim();
        })
      );

      return values;
    });

    const missionaryObject = {
      name: details[0],
      mission: details[1],
      begin: details[2] ? new Date(details[2]) : undefined,
      end: details[3] ? new Date(details[3]) : undefined,
      ward: details[4],
    };

    return missionaryObject;
  });

  const missionaries = await Promise.all(missionaryValues);
  const filteredMissionaries = missionaries.filter(
    (missionary) => missionary.mission !== "Church-Service Mission"
  );

  return filteredMissionaries;
}

async function goToRecommendationsTemple(
  page: Page
): Promise<TRecommendations[]> {
  console.info("Going to recommendations temple page...");

  const recommendationsPage =
    "https://lcr.churchofjesuschrist.org/report/custom-reports-details/92b2a18b-edb4-4aef-a7b2-36ca781c9c01";

  await waitLoadURL(page, [recommendationsPage]);

  // #mainContent > div:nth-child(1) > div > div > div
  const selector = "#mainContent > div:nth-child(1) > div > div > div";

  await page.waitForSelector(selector);

  const nodes = await page.$$(`${selector} > *`);

  const aggregateUnitData = nodes.map(async (node) => {
    const ward = await node.$eval("h3", (el) => el.innerHTML);
    const count = await (
      await node.$$("custom-reports-table > table > tbody > tr")
    ).length;

    return {
      ward,
      count,
      month: new Date().getMonth() + 1,
    };
  });

  const aggregateUnitCounts = await Promise.all(aggregateUnitData);

  return aggregateUnitCounts;
}

async function saveBaptismInfo(
  doc: GoogleSpreadsheet,
  baptismData: TBaptisms[]
) {
  console.info("Saving baptism info...");

  sheet = await prepareSheet(doc, baptismHeaderValues, "baptism");

  const rows = await sheet.getRows();
  const currentDate = new Date();

  for (let i = 0; i < baptismData.length; i++) {
    const item = baptismData[i];
    const index = rows.findIndex((row) => {
      return row.month === String(item.month) && row.ward === item.ward;
    });

    const hasMonthInSheet = index !== -1;

    if (hasMonthInSheet) {
      if (item.count > rows[index].count) {
        rows[index].count = item.count;
        rows[index].updatedAt = convertDateToString(new Date());

        await rows[index].save();
      }
    }

    if (!hasMonthInSheet) {
      const data = {
        ward: item.ward,
        month: item.month,
        count: item.count,
        updatedAt: convertDateToString(currentDate),
      };

      await sheet.addRow(data);
    }
  }
}

async function saveMissionariesInField(
  doc: GoogleSpreadsheet,
  missionaryData: TMissionary[]
) {
  const wardCodes = JSON.parse(process.env.WARD_CODES || "[]");

  console.info("Saving missionary in field...");

  sheet = await prepareSheet(doc, missionaryHeaderValues, "missionary");

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const rows = await sheet.getRows();

  for (let i = 0; i < wardCodes.length; i++) {
    const wardInfo = wardCodes[i];

    const filteredMissionaries = missionaryData.filter((missionary) => {
      const ward = wardInfo.name.toLowerCase();

      if (
        ward.includes("31") &&
        missionary.ward?.toLowerCase().includes("trinta e um")
      ) {
        return true;
      }

      return missionary.ward?.toLowerCase().includes(ward.toLowerCase());
    });

    const index = rows.findIndex((row) => {
      return row.month === String(currentMonth) && row.ward === wardInfo.name;
    });
    const hasMonthInSheet = index !== -1;

    if (hasMonthInSheet) {
      if (filteredMissionaries.length > rows[index].quantity) {
        rows[index].quantity = filteredMissionaries.length;
        rows[index].updatedAt = convertDateToString(currentDate);

        await rows[index].save();
      }
    }

    if (!hasMonthInSheet) {
      const data = {
        ward: wardInfo.name,
        month: currentMonth,
        quantity: filteredMissionaries.length,
        updatedAt: convertDateToString(currentDate),
      };

      await sheet.addRow(data);
    }
  }
}

async function saveRecommendationsInfo(
  doc: GoogleSpreadsheet,
  recommendationsData: TRecommendations[]
) {
  console.info("Saving recommendations info...");

  sheet = await prepareSheet(
    doc,
    recommendationsHeaderValues,
    "recommendations"
  );

  const rows = await sheet.getRows();
  const currentDate = new Date();

  for (let i = 0; i < recommendationsData.length; i++) {
    const item = recommendationsData[i];
    const index = rows.findIndex((row) => {
      return row.month === String(item.month) && row.ward === item.ward;
    });

    const hasMonthInSheet = index !== -1;

    if (hasMonthInSheet) {
      if (item.count > rows[index].count) {
        rows[index].count = item.count;
        rows[index].updatedAt = convertDateToString(new Date());

        await rows[index].save();
      }
    }

    if (!hasMonthInSheet) {
      const data = {
        ward: item.ward,
        month: item.month,
        count: item.count,
        updatedAt: convertDateToString(currentDate),
      };

      await sheet.addRow(data);
    }
  }
}

async function start() {
  console.info("> Starting Area Indicators...");
  const sheetID = process.env.AREA_SHEET_ID || "";
  const { page, browser } = await initPage();
  await goToHomeLcr(page);

  const recommendationsData = await goToRecommendationsTemple(page);
  const missionaryData = await goToMissionaryPage(page);
  const baptismData = await goToBaptismPage(page);

  await browser.close();

  //
  const { doc } = await initSheet(sheetID);

  await saveRecommendationsInfo(doc, recommendationsData);
  await saveMissionariesInField(doc, missionaryData);
  await saveBaptismInfo(doc, baptismData);

  console.log("> Process to save Area Indicators is Done!");
}

export default {
  start,
};
