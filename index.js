require("dotenv").config({ path: ".production.env" });
const fs = require("fs");
const puppeteer = require("puppeteer");
const axios = require("axios");
const { TwitterApi } = require("twitter-api-v2");

const deeplAuthKey = process.env.DEEPL_AUTH_KEY;
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function translateText(text, targetLang) {
  const api_url = "https://api-free.deepl.com/v2/translate";
  try {
    const response = await axios.post(api_url, `text=${encodeURIComponent(text)}&target_lang=${targetLang}`, {
      headers: {
        Authorization: `DeepL-Auth-Key ${deeplAuthKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data.translations[0].text;
  } catch (error) {
    console.error("Error during translation:", error);
    return text;
  }
}

const formatDate = () => {
  const now = new Date();
  return now.toISOString();
};

async function postTweet(title, previewText) {
  const sourceUrl = "www.coinness.com";
  let tweetContent = `🚨 [${title.toUpperCase()}] ${previewText}`;
  const maxTextLength = 280 - (sourceUrl.length + 5);

  if (tweetContent.length > maxTextLength) {
    tweetContent = tweetContent.slice(0, maxTextLength - 5) + "… " + sourceUrl;
  } else {
    tweetContent += " " + sourceUrl;
  }
  const previousTweets = fs.readFileSync("tweets.log", "utf-8");
  if (!previousTweets.includes(tweetContent)) {
    try {
      await twitterClient.v2.tweet(tweetContent);
      const logEntry = `Date: ${formatDate()}\nTweet: ${tweetContent}\n---\n`;
      fs.appendFileSync("tweets.log", logEntry);
      console.log("Tweet posted:", tweetContent);
    } catch (error) {
      console.error("Error posting tweet:", error);
    }
  } else {
    console.log("Duplicate tweet detected, not posting.");
  }
}

async function scrapeData() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://coinness.com/", { waitUntil: "networkidle0" });

  const buttonSelector = "#root > div > div.sc-eSmhDH.iOhMPT > div > main > button.sc-ePcVlk.kBORSt";
  if ((await page.$(buttonSelector)) !== null) {
    await page.click(buttonSelector);
    console.log("Clicked button for new content");
  }

  const contentSelector = "#root > div > div.sc-eSmhDH.iOhMPT > div > main > div.sc-cnojMS.RUnNO > div > div.sc-dDqAVe.kTMZWg > div:nth-child(1) > div";
  try {
    await page.waitForSelector(contentSelector, { timeout: 5000 });
    const scrapedContent = await page.evaluate(() => {
      const titleElement = document.querySelector("#root > div > div.sc-eSmhDH.iOhMPT > div > main > div.sc-cnojMS.RUnNO > div > div.sc-dDqAVe.kTMZWg > div:nth-child(1) > div > div.sc-jnmCrQ.dTRqFK > a");
      const previewTextElement = document.querySelector("#root > div > div.sc-eSmhDH.iOhMPT > div > main > div.sc-cnojMS.RUnNO > div > div.sc-dDqAVe.kTMZWg > div:nth-child(1) > div > div.sc-jnmCrQ.dTRqFK > div.sc-foSUKL.eeDdDS.omit");

      return {
        title: titleElement ? titleElement.innerText.toUpperCase() : "",
        previewText: previewTextElement ? previewTextElement.innerText : "",
      };
    });

    if (scrapedContent) {
      const translatedTitle = await translateText(scrapedContent.title, "EN");
      const translatedPreviewText = await translateText(scrapedContent.previewText, "EN");

      postTweet(translatedTitle, translatedPreviewText);
    } else {
      console.log("No content scraped");
    }
  } catch (error) {
    console.log("Error waiting for content or posting to Twitter:", error);
  } finally {
    await browser.close();
  }
}

async function startScrapingProcess() {
  while (true) {
    await scrapeData();
    await new Promise((resolve) => setTimeout(resolve, 60000)); // 60 seconds before next run
  }
}

startScrapingProcess();
