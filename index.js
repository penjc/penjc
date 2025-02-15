require('dotenv').config();
const Mustache = require('mustache');
const fetch = require('node-fetch');
const fs = require('fs');
const puppeteerService = require('./services/puppeteer.service');

const MUSTACHE_MAIN_DIR = './main.mustache';

let DATA = {
  refresh_date: new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
    timeZone: 'Asia/Shanghai',
  }),
};

// 使用 Google 翻译 API 翻译文本
async function translateText(text, targetLang = 'en') {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const response = await fetch(url);
    const result = await response.json();
    return result[0][0][0]; // 提取翻译后的文本
  } catch (error) {
    console.error('Error translating text:', error);
    return text; // 如果翻译失败，返回原文本
  }
}

async function setWeatherInformation() {
  try {
    const response = await fetch(
      `https://devapi.qweather.com/v7/weather/now?key=${process.env.QWEATHER_API_KEY}&location=101020100`
    );
    const weatherData = await response.json();

    const translatedWeather = await translateText(weatherData.now.text);

    DATA.shanghai_temperature = weatherData.now.temp; // 当前温度
    DATA.shanghai_weather = translatedWeather; // 翻译后的天气描述
    DATA.shanghai_weather_icon = `https://cdn.heweather.com/cond_icon/${weatherData.now.icon}.png`; // 天气图标
    DATA.shanghai_wind_direction = await translateText(weatherData.now.windDir); // 翻译后的风向
    DATA.shanghai_wind_speed = `${weatherData.now.windSpeed} km/h`; // 风速
    DATA.shanghai_humidity = `${weatherData.now.humidity}%`; // 湿度
    DATA.shanghai_pressure = `${weatherData.now.pressure} hPa`; // 气压
    DATA.shanghai_visibility = `${weatherData.now.vis} km`; // 能见度
    DATA.shanghai_precipitation = `${weatherData.now.precip} mm`; // 降水量
    DATA.shanghai_feels_like = `${weatherData.now.feelsLike}°C`; // 体感温度
    DATA.shanghai_cloud_cover = `${weatherData.now.cloud}%`; // 云量
  } catch (error) {
    console.error('Error fetching weather information:', error);
  }
}

async function generateReadMe() {
  fs.readFile(MUSTACHE_MAIN_DIR, 'utf-8', (err, template) => {
    if (err) {
      console.error('Error reading main.mustache:', err);
      throw err;
    }

    // 渲染模板
    const output = Mustache.render(template, DATA);

    // 写入 README.md
    fs.writeFileSync('README.md', output, 'utf-8');
    console.log('README.md generated successfully!');
  });
}

async function action() {
  try {
    await setWeatherInformation();
    await generateReadMe();
  } catch (error) {
    console.error('An error occurred during the action execution:', error);
  } finally {
    if (puppeteerService.browser || puppeteerService.page) {
      await puppeteerService.close();
    }
  }
}

action();
