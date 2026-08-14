#!/usr/bin/env python3
"""
检索 calendar-data.js 中缺少 topic 或 category 的 stream 条目，
在终端逐个提示用户补充。
用法: python scripts/fill_missing_fields.py
"""
import os, re, json, subprocess, tempfile

DATA_FILE = "js/calendar-data.js"
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 有效的选题和分类（与 add_stream.py 保持一致）
TOPICS = {
    "1": ("杂谈", ["早台", "古文", "粉丝投稿", "晚台", "视听", "专题", "竖屏", "工作", "午台"]),
    "2": ("游戏", ["悬恐解", "3A", "AVG", "休闲", "体感", "模拟经营", "网游", "棋牌", "音游", "galgame", "回合制RPG"]),
    "3": ("音声", ["日常", "专题"]),
    "4": ("联动", ["游戏", "杂谈"]),
}


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
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".js", encoding="utf-8", delete=False
        ) as tmp:
            tmp.write(array_text)
            tmp_path = tmp.name
        try:
            result = subprocess.run(
                ["node", "-e",
                 "const fs=require('fs');"
                 "const arr=eval('('+fs.readFileSync('" + tmp_path.replace("\\", "\\\\") + "','utf8')+')');"
                 "console.log(JSON.stringify(arr));"],
                capture_output=True, text=True, cwd=ROOT_DIR
            )
            if result.returncode != 0:
                raise RuntimeError(f"Node 解析失败: {result.stderr}")
            data = json.loads(result.stdout)
        finally:
            os.unlink(tmp_path)
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
            return str(obj) if obj == int(obj) else str(obj)
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
            # 保持字段顺序: time, title, link, topic, category, cover
            key_order = ["time", "title", "link", "topic", "category", "cover"]
            existing_keys = list(obj.keys())
            ordered = [k for k in key_order if k in existing_keys]
            # 追加未在 order 中的 key
            ordered += [k for k in existing_keys if k not in ordered]
            items = []
            for k in ordered:
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


def find_missing(data):
    """找出所有缺失 topic 或 category 的 stream 条目"""
    missing = []
    for entry in data:
        date_str = entry["date"]
        for i, stream in enumerate(entry["streams"]):
            lacks = []
            if "topic" not in stream or not stream["topic"]:
                lacks.append("topic")
            if "category" not in stream or not stream["category"]:
                lacks.append("category")
            if lacks:
                missing.append({
                    "date": date_str,
                    "index": i,
                    "stream": stream,
                    "missing": lacks,
                })
    return missing


def prompt_for_topic():
    """交互式选择 topic"""
    print("\n  选题：")
    for k, v in TOPICS.items():
        print(f"    {k}. {v[0]}")
    print("    回车跳过")
    choice = input("  选题编号: ").strip()
    if choice in TOPICS:
        return TOPICS[choice][0]
    return ""


def prompt_for_category(topic):
    """根据已选 topic 选择 category"""
    cats = None
    for k, v in TOPICS.items():
        if v[0] == topic:
            cats = v[1]
            break
    if not cats:
        return ""
    print(f"\n  分类（{topic}）：")
    for i, c in enumerate(cats, 1):
        print(f"    {i}. {c}")
    print("    回车跳过")
    choice = input("  分类编号: ").strip()
    if choice.isdigit():
        idx = int(choice) - 1
        if 0 <= idx < len(cats):
            return cats[idx]
    return ""


def main():
    print("=" * 55)
    print("  检索 calendar-data.js 中缺少 topic/category 的条目")
    print("=" * 55)

    data = load_data()
    missing = find_missing(data)

    if not missing:
        print("\n✓ 所有条目都已包含 topic 和 category！")
        return

    print(f"\n找到 {len(missing)} 个缺失条目：\n")
    for m in missing:
        lack_str = "、".join(m["missing"])
        s = m["stream"]
        print(f"  {m['date']}  {s.get('time', '??:??')}  {s['title'][:30]}")
        print(f"    缺失: {lack_str}")

    print(f"\n{'─' * 55}")
    ans = input(f"\n是否逐个补充？(y/n，默认 y): ").strip().lower()
    if ans == "n":
        print("已取消。")
        return

    modified = 0
    for i, m in enumerate(missing):
        s = m["stream"]
        print(f"\n{'─' * 55}")
        print(f"  [{i+1}/{len(missing)}]  {m['date']}  {s.get('time', '??:??')}")
        print(f"  标题: {s['title']}")
        print(f"  缺失: {'、'.join(m['missing'])}")

        if "topic" in m["missing"] and "category" not in m["missing"]:
            # 只缺 topic
            topic = prompt_for_topic()
            if topic:
                s["topic"] = topic
                modified += 1
                print(f"  ✓ 已设 topic = {topic}")
        elif "category" in m["missing"] and "topic" not in m["missing"]:
            # 只缺 category，有 topic
            print(f"\n  已有 topic: {s['topic']}")
            cat = prompt_for_category(s["topic"])
            if cat:
                s["category"] = cat
                modified += 1
                print(f"  ✓ 已设 category = {cat}")
        else:
            # 两个都缺
            print()
            topic = prompt_for_topic()
            if topic:
                s["topic"] = topic
                print(f"  ✓ 已设 topic = {topic}")
                cat = prompt_for_category(topic)
                if cat:
                    s["category"] = cat
                    print(f"  ✓ 已设 category = {cat}")
                modified += 1
            else:
                # topic 跳过，仍可单独设 category
                cat = prompt_for_category("")
                if cat:
                    s["category"] = cat
                    modified += 1
                    print(f"  ✓ 已设 category = {cat}")

    if modified > 0:
        print(f"\n{'─' * 55}")
        print(f"  共修改 {modified} 个条目，正在保存...")
        save_data(data)
        print("  ✓ 已保存到 calendar-data.js")
    else:
        print("\n未做任何修改。")


if __name__ == "__main__":
    main()
