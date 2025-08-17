import os
import json
import time
import hashlib
import pathlib
import requests
import feedparser
from parsel import Selector
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
import re
from googletrans import Translator

class Readme:
    def __init__(self, path) -> None:
        self.root = pathlib.Path(__file__).parent.resolve()
        self.file_path = self.root / "{}.md".format(path)

        self.jinja = Environment(
            loader=FileSystemLoader(os.path.join(self.root, "jinja"))
        ).get_template("{}.jinja".format(path))


class Spider:
    def __init__(self) -> None:
        self.readme = [Readme("README"), Readme("README_zh")]
        self.translator = Translator()

    def fetch_blog(self, language="zh"):
        try:
            # 添加User-Agent头
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            # 先用requests获取内容
            response = requests.get("https://pengjiancheng.com/rss.xml", headers=headers)
            response.raise_for_status()
            
            feed = feedparser.parse(response.content)
            content = feed["entries"]
            
            if not content:
                return "暂无博客文章" if language == "zh" else "No blog posts available"
                
            entries = []
            for entry in content:
                title = entry["title"]
                
                # 如果是英文版本，翻译标题
                if language == "en":
                    try:
                        # 使用自动检测源语言，目标语言为英文
                        translated = self.translator.translate(title, dest='en')
                        title = translated.text
                        print(f"翻译成功: {entry['title']} -> {title}")
                    except Exception as e:
                        print(f"翻译失败，使用原标题: {e}")
                        # 翻译失败时使用原标题
                
                entry_str = "* <a href='{url}' target='_blank'>{title}</a> - {published}".format(
                    title=title,
                    url=entry["link"].split("#")[0],
                    published=datetime.strptime(
                        entry["published"], "%a, %d %b %Y %H:%M:%S %Z"
                    ).strftime("%Y-%m-%d"),
                )
                entries.append(entry_str)

            return "\n".join(entries[:5])
        except Exception as e:
            return "博客获取失败" if language == "zh" else "Failed to fetch blog posts"

    def fetch_now(self, type):
        now = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        if str(type).endswith("README.md"):
            return "[Automated by GitHub Actions at {}](build_readme.py)".format(
                now
            )
        elif str(type).endswith("README_zh.md"):
            return "[由 GitHub Actions 于 {} 自动构建](build_readme.py)".format(now)

    def main(self):
        for i in self.readme:
            file_path = i.file_path
            jinja = i.jinja
            fetch = spider.fetch_now(file_path)
            
            # 根据文件名判断语言并获取相应的博客内容
            if str(file_path).endswith("README.md"):
                # 英文版README，获取翻译后的博客内容
                blog = spider.fetch_blog("en")
            else:
                # 中文版README，获取原始中文博客内容
                blog = spider.fetch_blog("zh")
            
            context = {
                "fetch": fetch,
                "blog": blog,
            }
            custom_section = jinja.render(context)
            file_path.open("w", encoding="utf-8").write(custom_section)


if __name__ == "__main__":
    spider = Spider()
    spider.main()
