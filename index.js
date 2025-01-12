require('dotenv').config();
const Mustache = require('mustache');
const fetch = require('node-fetch');
const fs = require('fs');
const puppeteerService = require('./services/puppeteer.service');

const MUSTACHE_MAIN_DIR = './main.mustache';

let DATA = {
  refresh_date: new Date().toLocaleDateString('en-GB', {
    weekday: 'long',       // 显示完整的星期（如 "Monday" -> "Monday"）
    month: 'long',         // 显示完整的月份（如 "January" -> "January")
    day: 'numeric',        // 显示日期的数字部分
    hour: 'numeric',       // 显示小时部分
    minute: 'numeric',     // 显示分钟部分
    timeZoneName: 'short', // 显示简短的时区信息
    timeZone: 'Asia/Shanghai', // 设置时区为中国上海
  }),
};

async function setWeatherInformation() {
  // 使用和风天气 API 获取上海的天气信息
  const QWEATHER_API_KEY = process.env.QWEATHER_API_KEY; // 和风天气 API 密钥
  const SHANGHAI_LOCATION = '101020100'; // 上海城市代码（和风天气）

  try {
    const response = await fetch(
      `https://api.qweather.com/v7/weather/now?location=${SHANGHAI_LOCATION}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${QWEATHER_API_KEY}`,
        },
      }
    );

    const r = await response.json();

    if (r.code === '200') {
      DATA.shanghai_temperature = r.now.temp; // 当前温度
      DATA.shanghai_weather = r.now.text; // 天气描述（如多云、晴天）
      DATA.shanghai_weather_icon = `https://cdn.heweather.com/cond_icon/${r.now.icon}.png`; // 天气图标
      DATA.shanghai_wind_direction = r.now.windDir; // 风向
      DATA.shanghai_wind_speed = `${r.now.windSpeed} km/h`; // 风速
    } else {
      console.error('Failed to fetch Shanghai weather:', r);
    }
  } catch (error) {
    console.error('Error fetching Shanghai weather:', error);
  }
}

async function generateReadMe() {
  await fs.readFile(MUSTACHE_MAIN_DIR, (err, data) => {
    if (err) throw err;
    const output = Mustache.render(data.toString(), DATA);
    fs.writeFileSync('README.md', output);
  });
}

async function action() {
  /**
   * Fetch Weather
   */
  await setWeatherInformation();

  /**
   * Generate README
   */
  await generateReadMe();

  /**
   * Fermeture de la boutique 👋
   */
  await puppeteerService.close();
}

action();