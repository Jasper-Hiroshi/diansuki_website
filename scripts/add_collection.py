# -*- coding: utf-8 -*-
"""
diansss.com — 专题合集添加脚本

用法：
    python scripts/add_collection.py

流程：
    1. 选择「新建合集」或「在已有合集增加」
    2. （新建）输入合集名称 + 合集类型
    3. 逐条输入直播：date / time；标题、回放链接、封面若在 calendar-data.js 中能按「日期+时间」匹配到则自动补全，无需手动输入
    4. 自动按日期升序排序（展开后上方更早、下方更晚），写回 js/collections-data.js
"""
import json
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, "..", "js", "collections-data.js")

HEADER = """/**
 * diansss.com — 专题合集数据
 *
 * 数据结构：
 *   collections — 合集列表
 *     name    — 合集名称
 *     type    — 合集类型（合集条上的「分类类型」，可自由定义）
 *     streams — 合集内直播（格式同 calendar-data.js 的 streams，展开后按日期升序）
 *       date / time / title / link / topic / category / cover
 *
 * 数据由 scripts/add_collection.py 维护，也可手动编辑。
 */
"""


def load():
    if not os.path.exists(DATA_PATH):
        print("找不到 %s" % DATA_PATH)
        sys.exit(1)
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        text = f.read()
    m = re.search(r"collectionsData\s*=\s*(\{.*\});?\s*$", text, re.DOTALL)
    if not m:
        print("无法解析 collections-data.js 中的 collectionsData 对象")
        sys.exit(1)
    return json.loads(m.group(1))


def save(data):
    body = "var collectionsData = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        f.write(HEADER + body)
    print("已保存到 js/collections-data.js")


CAL_DATA_PATH = os.path.join(SCRIPT_DIR, "..", "js", "calendar-data.js")


def norm_time(t):
    """把 '2:00' 规整成 '02:00'，便于与 calendar-data.js 的时间对齐。"""
    t = (t or "").strip()
    if ":" in t:
        try:
            h, m = t.split(":", 1)
            return "%02d:%02d" % (int(h), int(m))
        except ValueError:
            pass
    return t


def load_calendar_lookup():
    """读取 calendar-data.js，返回 {(date, time): stream} 映射，供自动补全标题等字段。"""
    if not os.path.exists(CAL_DATA_PATH):
        return {}
    with open(CAL_DATA_PATH, "r", encoding="utf-8") as f:
        text = f.read()
    m = re.search(r"var\s+calendarData\s*=\s*\{", text)
    if not m:
        return {}
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
    try:
        arr = json.loads(text[start:end])
    except json.JSONDecodeError:
        return {}
    lookup = {}
    for entry in arr:
        date = entry.get("date", "")
        for st in entry.get("streams", []):
            lookup[(date, norm_time(st.get("time", "")))] = st
    return lookup


def ask(prompt, default=""):
    suffix = (" [%s]" % default) if default else ""
    val = input(prompt + suffix + ": ").strip()
    return val if val else default


def add_streams(collection):
    cal = load_calendar_lookup()
    print("\n逐条添加直播（日期留空并回车即结束）：")
    while True:
        date = ask("日期 YYYY-MM-DD")
        if not date:
            break
        time = ask("时间 HH:MM", "00:00")
        found = cal.get((date, norm_time(time)))
        if found and found.get("title"):
            title = found["title"]
            print("  标题（从日历读取）：%s" % title)
        else:
            title = ask("标题")
        # 回放链接、封面：日历里能匹配到就自动补全，不再询问
        link = (found or {}).get("link", "")
        if not link:
            link = ask("回放链接（可空）")

        cover = (found or {}).get("cover", "")
        if not cover:
            cover = ask("封面路径（可空）")

        # 选题 / 分类：日历里有就用默认值（回车即接受），也可手动覆盖
        topic = ask("选题 topic（可空）", (found or {}).get("topic", ""))
        category = ask("分类 category（可空）", (found or {}).get("category", ""))
        collection["streams"].append({
            "date": date,
            "time": time,
            "title": title,
            "link": link,
            "topic": topic,
            "category": category,
            "cover": cover,
        })
        print("  已添加 %s %s「%s」" % (date, time, title))
    # 按日期升序：上方更早、下方更晚
    collection["streams"].sort(key=lambda s: s.get("date", ""))


def main():
    data = load()
    cols = data.get("collections", [])

    print("当前共 %d 个合集：" % len(cols))
    for i, c in enumerate(cols, 1):
        print("  %d. %s（类型：%s，%d 场直播）" % (i, c.get("name", ""), c.get("type", ""), len(c.get("streams", []))))

    print("\n请选择操作：")
    print("  1. 新建合集")
    print("  2. 在已有合集增加直播")
    choice = ask("输入 1 或 2")

    if choice == "1":
        name = ask("合集名称")
        if not name:
            print("合集名称不能为空，已取消")
            return
        ctype = ask("合集类型（可空）")
        col = {"name": name, "type": ctype, "streams": []}
        cols.append(col)
        print("已新建合集「%s」" % name)
    elif choice == "2":
        if not cols:
            print("还没有合集，请先新建")
            return
        idx = ask("选择合集编号")
        try:
            col = cols[int(idx) - 1]
        except (ValueError, IndexError):
            print("编号无效，已取消")
            return
        print("将添加到「%s」" % col.get("name", ""))
    else:
        print("输入无效，已取消")
        return

    add_streams(col)
    data["collections"] = cols
    save(data)


if __name__ == "__main__":
    main()
