import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { google, sheets_v4 } from "googleapis";
import { Page } from "puppeteer";

export async function waitLoadURL(page: Page, urls: string[]) {
  let actualUrl = page.url();
  let urlIndexList = 0

  while (!urls.some((url) => actualUrl.startsWith(url))) {
    await page.waitForTimeout(1000);
    await page.goto(urls[urlIndexList], { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    actualUrl = page.url();

    urlIndexList = urlIndexList + 1 === urls.length ? 0 : urlIndexList + 1;
  }
}

export async function prepareSheet(doc: GoogleSpreadsheet, headerValues: string[], sheetTitle: string) {
  const foundedSheet = doc.sheetsByTitle[sheetTitle]

  if (!foundedSheet) {
    return await doc.addSheet({
      title: sheetTitle,
      headerValues
    });
  }

  return foundedSheet;
}

export function inMonthInterval(date: Date, month: number) {
  const currentYear = new Date().getFullYear();

  return currentYear === date.getFullYear() && date.getMonth() === month - 1;
}

export async function getAuthSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.CLIENT_EMAIL ?? '',
      private_key: (process.env.PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const client = await auth.getClient();

  const googleSheets = google.sheets({ version: 'v4', auth: client });

  return {
    sheets: googleSheets,
    auth,
    client
  }
}

type TColumnChart = {
  sourceSheetId: string;
  sourceSheetTitle: string;
  title: string;
  columnTitle: string;
  valueTitle: string;
  maxRow?: number;
  columnPositionChart: number;
}

type TPivotChart = {
  sourceSheetId: string;
  sourceSheetTitle: string;
  startColumnIndex: number;
  endColumnIndex: number;
  maxRow?: number;
  indexColumnRows: number;
  indexColumnSum: number;
  lastColumnSourceIndex: number;
}

export async function addColumnChart(data: TColumnChart) {
  const { sheets, auth } = await getAuthSheets();
  const { sourceSheetId, sourceSheetTitle, title, columnTitle, valueTitle, maxRow, columnPositionChart } = data;
  const sheetProperties = await sheets.spreadsheets.get({
    auth,
    spreadsheetId: sourceSheetId,
  })

  const sheet = sheetProperties.data.sheets?.find(sheet => sheet.properties?.title === sourceSheetTitle);

  if (!sheet || !sheet.properties) {
    throw new Error(`Sheet ${sourceSheetTitle} not found`);
  }

  const sheetId = sheet.properties.sheetId;

  const requests: sheets_v4.Schema$Request[] = [
    {
      addChart: {
        chart: {
          spec: {

            title,
            basicChart: {
              chartType: "COLUMN",
              legendPosition: "BOTTOM_LEGEND",
              axis: [
                {
                  position: "BOTTOM_AXIS",
                  title: columnTitle
                },
                {
                  position: "LEFT_AXIS",
                  title: valueTitle
                }
              ],
              domains: [
                {
                  domain: {
                    sourceRange: {
                      sources: [
                        {
                          sheetId: sheetId,
                          startRowIndex: 0,
                          endRowIndex: maxRow ?? 100,
                          startColumnIndex: 1,
                          endColumnIndex: 2
                        }
                      ]
                    }
                  }
                }
              ],
              series: [
                {
                  series: {
                    sourceRange: {
                      sources: [
                        {
                          sheetId: sheetId,
                          startRowIndex: 0,
                          endRowIndex: maxRow ?? 100,
                          startColumnIndex: 3,
                          endColumnIndex: 4
                        }
                      ]
                    },
                  },
                  targetAxis: "LEFT_AXIS"
                }
              ],
              headerCount: 1,
            }
          },
          position: {
            sheetId: sheetId,
          }
        }
      }
    }
  ];

  await sheets.spreadsheets.batchUpdate({
    requestBody: {
      requests,
    },
    spreadsheetId: sourceSheetId,
  });
}

export async function addPivotGrid(data: TPivotChart) {
  const { sheets, auth } = await getAuthSheets();
  const { 
    sourceSheetId, 
    sourceSheetTitle, 
    indexColumnRows, 
    indexColumnSum, 
    maxRow, 
    lastColumnSourceIndex,
    endColumnIndex, 
    startColumnIndex
  } = data;
  const sheetProperties = await sheets.spreadsheets.get({
    auth,
    spreadsheetId: sourceSheetId,
  })

  const sheet = sheetProperties.data.sheets?.find(sheet => sheet.properties?.title === sourceSheetTitle);

  if (!sheet || !sheet.properties) {
    throw new Error(`Sheet ${sourceSheetTitle} not found`);
  }

  const sheetId = sheet.properties.sheetId;

  const requests: sheets_v4.Schema$Request[] = [
    {
      updateCells: {
        rows: [
          {
            values: [
              {
                pivotTable: {
                  source: {
                    "sheetId": sheetId,
                    "startRowIndex": 0,
                    startColumnIndex,
                    "endRowIndex": maxRow ?? 100,
                    endColumnIndex: endColumnIndex + 1
                  },
                  rows: [
                    {
                      showTotals: false,
                      sortOrder: "ASCENDING",
                      sourceColumnOffset: indexColumnRows,
                    }
                  ],
                  values: [
                    {
                      summarizeFunction: "SUM",
                      sourceColumnOffset: indexColumnSum,
                    },
                  ],
                  filterSpecs: [
                    {
                      columnOffsetIndex: indexColumnRows,
                      filterCriteria: {
                        condition: {
                          type: "NOT_BLANK"
                        },
                        visibleByDefault: true
                      },

                    }
                  ],
                  valueLayout: "VERTICAL"
                }
              }
            ]
          }
        ],
        start: {
          "sheetId": sheetId,
          "rowIndex": 5,
          "columnIndex": lastColumnSourceIndex + 1
        },
        fields: "pivotTable"
      }
    }
  ]

  await sheets.spreadsheets.batchUpdate({
    requestBody: {
      requests,
    },
    spreadsheetId: sourceSheetId,
  });
}

export function convertDateToString(date: Date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export async function saveInSheets(sheet: GoogleSpreadsheetWorksheet, row: number, values: any) {
  let throws = true

  while (throws) {
    try {
      const rows = await sheet.getRows({
        offset: row,
        limit: 1,
      });

      if (rows.length === 0) {
        await sheet.addRow(values);
      }

      if (rows.length > 0) {
        Object.entries(values).forEach(([key, value]) => {
          if (value !== rows[0][key]) {
            rows[0][key] = value;
          }
        });

        await rows[0].save();
      }

      throws = false;
    } catch (error) {
      throws = true;
    }
  }
}


// https://www.youtube.com/watch?v=PxphXQmtHLo
// https://www.twilio.com/pt-br/docs/sms
// https://www.twilio.com/pt-br/docs/whatsapp/quickstart/node
// https://www.twilio.com/pt-br/docs/whatsapp/api