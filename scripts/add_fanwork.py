#!/usr/bin/env python3
"""
为 fanworks-data.js 添加二创
用法: python scripts/add_fanwork.py
"""
import os, re, json, shutil

DATA_FILE = "js/fanworks-data.js"
IMG_DIR   = "assets/images/creation"

ALL_TAGS = [
    "动态", "作画", "生活", "AI", "3D",
    "周边无料", "动画", "游戏", "特摄", "设计", "视频", "其他"
]


def load_data():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        text = f.read()

    m = re.search(r"var\s+fanworksData\s*=\s*(\[)", text)
    if not m:
        raise ValueError("未找到 fanworksData 数组")

    start = m.start(1)
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

    array_js = obj_to_js(data, indent=0)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        text = f.read()

    m = re.search(r"var\s+fanworksData\s*=\s*\[", text)
    start = m.start() + m.group().index("[")
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


def copy_images(paths):
    os.makedirs(IMG_DIR, exist_ok=True)
    result = []
    for src in paths:
        src = src.strip().strip('"').strip("'")
        if not src or not os.path.exists(src):
            print(f"  ⚠ 图片不存在，跳过: {src}")
            continue
        fname = os.path.basename(src)
        dst = os.path.join(IMG_DIR, fname)
        shutil.copy2(src, dst)
        result.append(IMG_DIR.replace("\\", "/") + "/" + fname)
        print(f"  ✓ 已复制: {fname}")
    return result


def pick_tags():
    """交互式选择 tag"""
    print("\n可选 tag（输入数字，多选用逗号分隔）:")
    for i, t in enumerate(ALL_TAGS):
        print(f"  {i} - {t}")
    sel = input("> ").strip()
    if not sel:
        return []
    idxs = [int(s.strip()) for s in sel.split(",") if s.strip().isdigit()]
    return [ALL_TAGS[i] for i in idxs if 0 <= i < len(ALL_TAGS)]


def main():
    print("=" * 50)
    print("  添加二创")
    print("=" * 50)

    # 作者
    print("\n--- 作者信息 ---")
    author_id = input("作者 ID: ").strip()

    data = load_data()

    # 查找已有作者
    user = None
    for u in data:
        if u["id"] == author_id:
            user = u
            print(f"  ✓ 已有作者「{author_id}」，将追加到其下方")
            break

    if not user:
        author_link = input("作者主页网址: ").strip()
        user = {"id": author_id, "idLink": author_link, "groups": [], "likes": 0}
        data.append(user)
        print(f"  ✓ 新建作者「{author_id}」")

    # 视频还是图片
    print("\n--- 类型 ---")
    print("  1 - 图片")
    print("  2 - 视频")
    media_type = input("请选择 (1/2): ").strip()
    while media_type not in ("1", "2"):
        media_type = input("请输入 1 或 2: ").strip()

    is_video = media_type == "2"

    if is_video:
        print("\n--- 视频信息 ---")
        print("封面图（文件路径）:")
        cover_input = input("> ").strip()
        covers = copy_images([cover_input]) if cover_input else []

        link = input("视频源网址: ").strip()

        # 视频封面加播放标识，后续 tags 再补
        group = {
            "date": "",
            "images": covers,
            "title": "",
            "link": link,
            "tags": [],
            "isVideo": True
        }

        print("\n--- 视频 tag ---")
        tags = pick_tags()
        group["tags"] = tags

        print("\n视频标题: ")
        title = input("> ").strip()
        group["title"] = title if title else "视频"
    else:
        print("\n--- 图片信息 ---")
        print("图片（文件路径，多张用逗号分隔）:")
        img_input = input("> ").strip()
        img_paths = [p.strip() for p in img_input.split(",") if p.strip()] if img_input else []

        images = copy_images(img_paths)

        link = input("二创源网址: ").strip()

        tags = pick_tags()

        print("\n作品标题（可选）:")
        title = input("> ").strip()

        date_str = input("日期 (YYYY-MM-DD，可选): ").strip()

        group = {
            "date": date_str if date_str else "",
            "images": images,
            "title": title if title else "",
            "link": link,
            "tags": tags
        }

    # 点赞数
    print("\n点赞数（直接回车默认为 0）:")
    likes_input = input("> ").strip()
    likes = int(likes_input) if likes_input.isdigit() else 0

    group["likes"] = likes
    user["groups"].append(group)

    # 更新作者总点赞
    total = sum(g.get("likes", 0) for g in user["groups"])
    user["likes"] = total

    # 作者按总点赞降序
    data.sort(key=lambda u: u.get("likes", 0), reverse=True)
    # 每组内按点赞降序
    for u in data:
        u["groups"].sort(key=lambda g: g.get("likes", 0), reverse=True)

    save_data(data)
    print(f"\n✓ 已添加到「{author_id}」({total} 赞)")


if __name__ == "__main__":
    main()
