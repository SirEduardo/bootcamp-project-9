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

};

const repeat = async (page) => {
 
  await page.waitForSelector('[data-test="mms-search-srp-productlist"] div.sc-b0c0d999-0', { timeout: 10000 })

  const arrayDivs = await page.$$(
    '[data-test="mms-search-srp-productlist"] div.sc-b0c0d999-0'
  );
  if (arrayDivs.length === 0) {
    await paginate(page);
    return;
  }

  for (const pcDivs of arrayDivs) {
    try {
      let price = await safeEvaluate(pcDivs, ".sc-f524209-0.eDhLj span.sc-3f2da4f5-0.sc-dd1a61d2-2.efAprc");
      let title = await safeEvaluate(pcDivs, "p.sc-3f2da4f5-0.fLePRG");
      let img = await safeEvaluate(pcDivs, "img", el => el.src);

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

const safeEvaluate = async (element, selector, evalFn = el => el.textContent.trim()) => {
  try {
    await element.waitForSelector(selector, { timeout: 5000 });
    return await element.$eval(selector, evalFn);
  } catch (error) {
    console.error(`Error evaluando un selector ${selector}: ${error}`);
  }
}


const paginate = async (page) => {

 try {
  const nextPageButton = await page.$('[data-test="mms-search-srp-loadmore"] span.sc-a8663f6a-0.iWuUrL');
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
 } catch (error) {
  console.log("Error encontrando el boton", error);
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
