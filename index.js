const puppeteer = require("puppeteer");
const fs = require("fs");

const pcArray = [];


const scrapper = async (url) => {
  const browser = await puppeteer.launch({ headless: false });

  const page = await browser.newPage();

  await page.goto(url);

  await page.setViewport({ width: 1080, height: 1024 });

  const cookieButton = await page.$("#pwa-consent-layer-accept-all-button");
  if (cookieButton) {
    await cookieButton.click();
  }

  await repeat(page);
  await browser.close();
};

const repeat = async (page) => {
  await page.waitForSelector(
    ".sc-b0a2f165-0.hJZrCI.sc-1ecb3c22-3.kAEzmY.sc-1036526f-2.bmkiWp"
  );

  const arrayDivs = await page.$$(
    '[data-test="mms-search-srp-productlist"] div.sc-b0c0d999-0'
  );
  if (arrayDivs.length === 0) {
    await paginate(page);
    return;
  }

  for (const pcDivs of arrayDivs) {
    try {
      let price = await pcDivs.$eval(
        ".sc-f524209-0.eDhLj span.sc-3f2da4f5-0.sc-dd1a61d2-2.efAprc",
        (el) => el.textContent.trim()
      );

      let title = await pcDivs.$eval("p.sc-3f2da4f5-0.fLePRG", (el) =>
        el.textContent.trim()
      );

      let img = await pcDivs.$eval("img", (el) => el.src);

      const pc = {
        img,
        title,
        price,
      };
      pcArray.push(pc);
    } catch (error) {
      console.error(`Error procesando un div: ${error}`);
    }
  }
  await paginate(page);
};


const paginate = async (page) => {
  const nextPageButton = await page.$('[data-test="mms-search-srp-loadmore"]');
  if (nextPageButton) {
    try {
      await nextPageButton.click();
      await page.waitForNavigation();
      await repeat(page);
    } catch (error) {
      console.error(`Error en la paginación: ${error}`);
      write(pcArray);
    }
  } else {
    write(pcArray);
  }
};

const write = (pcArray) => {
  fs.writeFile("pc.json", JSON.stringify(pcArray, null, 2), (err) => {
    if (err) {
      console.log("Error escribiendo archivo", err);
    } else {
      console.log("Archivo escrito");
    }
  });
};

scrapper(
  "https://www.mediamarkt.es/es/category/port%C3%A1tiles-con-windows-1551.html?page=1"
);
