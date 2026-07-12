#!/usr/bin/env python3
"""
为 calendar-data.js 添加直播记录
用法: python scripts/add_stream.py
"""
import os, re, json, shutil

DATA_FILE = "js/calendar-data.js"
IMG_DIR   = "assets/images/stream"


def load_data():
    """读取 calendar-data.js，返回 streams 列表"""
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        text = f.read()

    m = re.search(r"var\s+calendarData\s*=\s*\{", text)
    if not m:
        raise ValueError("未找到 calendarData")

    start = text.index("[", m.start())
    depth = 0
    end = start
    for i, ch in enumerate(text[start:], start):
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    array_text = text[start:end]
    try:
        data = json.loads(array_text)
    except json.JSONDecodeError:
        import subprocess
        result = subprocess.run(
            ["node", "-e", "console.log(JSON.stringify(" + array_text + "))"],
            capture_output=True, text=True,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )
        data = json.loads(result.stdout)
    return data


def save_data(data):
    """将数据写回 calendar-data.js"""
    def obj_to_js(obj, indent=0):
        prefix = "  " * indent
        if obj is None:
            return "null"
        if isinstance(obj, bool):
            return "true" if obj else "false"
        if isinstance(obj, (int, float)):
            return str(obj)
        if isinstance(obj, str):
            return json.dumps(obj, ensure_ascii=False)
        if isinstance(obj, list):
            if not obj:
                return "[]"
            items = []
            for item in obj:
                items.append(prefix + "  " + obj_to_js(item, indent + 1))
            return "[\n" + ",\n".join(items) + "\n" + prefix + "]"
        if isinstance(obj, dict):
            if not obj:
                return "{}"
            keys = list(obj.keys())
            items = []
            for k in keys:
                v = obj_to_js(obj[k], indent + 1)
                items.append(prefix + "  " + json.dumps(k) + ": " + v)
            return "{\n" + ",\n".join(items) + "\n" + prefix + "}"

    array_js = obj_to_js(data, indent=2)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        text = f.read()

    m = re.search(r"var\s+calendarData\s*=\s*\{", text)
    start = text.index("[", m.start())
    depth = 0
    end = start
    for i, ch in enumerate(text[start:], start):
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    new_text = text[:start] + array_js + text[end:]
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        f.write(new_text)


def copy_image(path):
    """复制封面图到 assets/images/dynamics/"""
    path = path.strip().strip('"').strip("'")
    if not path or not os.path.exists(path):
        return None
    os.makedirs(IMG_DIR, exist_ok=True)
    fname = os.path.basename(path)
    dst = os.path.join(IMG_DIR, fname)
    shutil.copy2(path, dst)
    return IMG_DIR.replace("\\", "/") + "/" + fname


def main():
    print("=" * 50)
    print("  添加直播")
    print("=" * 50)

    print()
    date_str = input("日期 (YYYY-MM-DD): ").strip()
    time_str = input("时间 (HH:MM): ").strip()
    title    = input("标题: ").strip()

    print("\n封面图（文件路径，无则回车）:")
    cover_input = input("> ").strip()
    cover = None
    if cover_input:
        cover = copy_image(cover_input)
        if cover:
            print(f"  ✓ 已复制")

    link = input("回放链接: ").strip()

    stream = {"time": time_str, "title": title, "link": link}
    if cover:
        stream["cover"] = cover
    else:
        stream["cover"] = ""

    data = load_data()

    # 查找或创建日期分组
    found = False
    for entry in data:
        if entry["date"] == date_str:
            entry["streams"].append(stream)
            found = True
            break

    if not found:
        data.append({"date": date_str, "streams": [stream]})
        data.sort(key=lambda e: e["date"], reverse=True)

    save_data(data)
    print(f"\n✓ 已添加至 {date_str}")


if __name__ == "__main__":
    main()
