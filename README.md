# Twitter Automation App

## Description

Node.js app scrapes content from `coinness.com`, translates it using the DeepL API, and posts it to Twitter.
Also makes sure no duplicate tweets - logs all tweets in a text file.

## Setup

1. Install dependencies:

   ```bash
   npm install puppeteer axios twitter-api-v2 dotenv

   ```

2. Create a .production.env file in the root directory with the following keys:
   DEEPL_AUTH_KEY=your_deepl_auth_key
   TWITTER_APP_KEY=your_twitter_app_key
   TWITTER_APP_SECRET=your_twitter_app_secret
   TWITTER_ACCESS_TOKEN=your_twitter_access_token
   TWITTER_ACCESS_SECRET=your_twitter_access_secret

## Running app

1. Execute the script using Node.js:
   node index.js

## Features

1. Scrapes content from coinness.com.
2. Translates content to English.
3. Posts tweets and avoids duplicates.
4. Logs tweets in tweets.log file with timestamps.

## Keep in mind

1. Rate limits of Twitter and DeepL APIs.
