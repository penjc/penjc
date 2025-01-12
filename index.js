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
    const response = await fetch(
      `https://devapi.qweather.com/v7/weather/now?key=${process.env.QWEATHER_API_KEY}&location=101020100`
    ).then(r=>r.json())
      .then(r=>{
        DATA.shanghai_temperature = r.now.temp; // 当前温度
        DATA.shanghai_weather = r.now.text; // 天气描述（如多云、晴天）
        DATA.shanghai_weather_icon = `https://cdn.heweather.com/cond_icon/${r.now.icon}.png`; // 天气图标
        DATA.shanghai_wind_direction = r.now.windDir; // 风向
        DATA.shanghai_wind_speed = `${r.now.windSpeed} km/h`; // 风速
        DATA.shanghai_humidity = `${r.now.humidity}%`; // 湿度
        DATA.shanghai_pressure = `${r.now.pressure} hPa`; // 气压
        DATA.shanghai_visibility = `${r.now.vis} km`; // 能见度
        DATA.shanghai_precipitation = `${r.now.precip} mm`; // 降水量
        DATA.shanghai_feels_like = `${r.now.feelsLike}°C`; // 体感温度
        DATA.shanghai_cloud_cover = `${r.now.cloud}%`; // 云量
      })
}

async function generateReadMe() {
  await fs.readFile(MUSTACHE_MAIN_DIR, 'utf-8', (err, template) => {
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
    /**
     * Fetch Weather
     */
    await setWeatherInformation();

    /**
     * Generate README
     */
    await generateReadMe();
  } catch (error) {
    console.error('An error occurred during the action execution:', error);
  } finally {
    // 确保关闭 puppeteer
    if (puppeteerService.browser || puppeteerService.page) {
      await puppeteerService.close();
    }
  }
}

action();