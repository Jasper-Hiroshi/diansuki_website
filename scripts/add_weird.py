"""
add_weird.py — 向 columns-data.js 右栏添加文章

用法：
    python scripts/add_weird.py

交互输入：文章名称、日期、文章内容（多行，以单独一行 END 结束）
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "js" / "columns-data.js"


def read_data():
    text = DATA_FILE.read_text(encoding="utf-8")
    return text


def parse_articles(text, side):
    marker = side + ":"
    start = text.index(marker)
    articles_key = text.index("articles:", start)
    bracket_start = text.index("[", articles_key)
    depth = 0
    i = bracket_start
    while i < len(text):
        ch = text[i]
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return text[bracket_start + 1:i]
        i += 1
    print(f"错误：无法解析 {side} 的 articles 数组")
    sys.exit(1)


def escape_js_string(s):
    """转义字符串中的 JS 特殊字符"""
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")


def build_article(title, date, content):
    parts = []
    parts.append(f'title: "{title}"')
    parts.append(f'date: "{date}"')
    parts.append(f'content: "{escape_js_string(content)}"')
    return "      { " + ", ".join(parts) + " }"


def write_data(text, side, articles_raw):
    marker = side + ":"
    start = text.index(marker)
    articles_key = text.index("articles:", start)
    bracket_start = text.index("[", articles_key)
    depth = 0
    i = bracket_start
    while i < len(text):
        ch = text[i]
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                bracket_end = i
                break
        i += 1
    else:
        print(f"错误：无法找到 {side} articles 数组结束位置")
        sys.exit(1)

    before = text[:bracket_start + 1]
    after = text[bracket_end:]
    new_text = before + articles_raw + after
    DATA_FILE.write_text(new_text, encoding="utf-8")
    print(f"\n已写入: {DATA_FILE}")


def main():
    print("=" * 50)
    print("  添加文章 → 兵马酥的怪文书")
    print("=" * 50)
    print()

    title = input("① 文章名称: ").strip()
    if not title:
        print("错误：文章名称不能为空")
        sys.exit(1)

    date = input("② 日期（YYYY-MM-DD）: ").strip()
    if not date:
        print("错误：日期不能为空")
        sys.exit(1)
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date):
        print("警告：日期格式建议为 YYYY-MM-DD")

    print("③ 文章内容（多行输入，输入 END 结束）:")
    lines = []
    while True:
        try:
            line = input()
        except EOFError:
            break
        if line.strip() == "END":
            break
        lines.append(line)
    content = "\n".join(lines)

    if not content.strip():
        print("错误：文章内容不能为空")
        sys.exit(1)

    # 读取
    text = read_data()
    articles_raw = parse_articles(text, "right")

    new_item = build_article(title, date, content)

    existing = articles_raw.strip()
    if existing:
        new_articles = existing.rstrip() + ",\n" + new_item + "\n    "
    else:
        new_articles = "\n" + new_item + "\n    "

    # 确认
    print()
    print("-" * 50)
    print("  预览：")
    print(f"  栏位: 兵马酥的怪文书")
    print(f"  标题: {title}")
    print(f"  日期: {date}")
    print(f"  内容: {len(content)} 字")
    print("-" * 50)

    confirm = input("确认写入？(y/n): ").strip().lower()
    if confirm != "y":
        print("已取消。")
        sys.exit(0)

    write_data(text, "right", new_articles)
    print("✓ 完成！")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n已取消。")
        sys.exit(0)
