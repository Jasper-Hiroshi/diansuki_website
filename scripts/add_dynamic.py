#!/usr/bin/env python3
"""
为 dynamics-data.js 添加新动态（原创/转发）
内容从 .txt 文件读取，支持多行文本。

用法: python scripts/add_dynamic.py
"""
import os, re, json, shutil

DATA_FILE = "js/dynamics-data.js"
IMG_DIR   = "assets/images/dynamics"


def read_file(path):
    """读取 .txt 文件，返回纯文本内容"""
    path = path.strip().strip('"').strip("'")
    if not os.path.exists(path):
        print(f"  ⚠ 文件不存在: {path}")
        return None

    ext = os.path.splitext(path)[1].lower()
    if ext != ".txt":
        print(f"  ⚠ 仅支持 .txt 文件")
        return None

    with open(path, "r", encoding="utf-8") as f:
        return f.read().strip()


def input_content(label="内容"):
    """输入 Word 文件路径并读取内容，空行则手动输入纯文本"""
    path = input(f"{label}（.docx / .txt 文件路径，空行则手动输入）: ").strip()
    if path:
        text = read_file(path)
        if text:
            print(f"  ✓ 已读取 {len(text)} 个字符")
            return text
        # 读取失败，回退到手动输入
    print("  请输入纯文本（可多行，输入 END 结束）:")
    lines = []
    while True:
        line = input()
        if line.strip() == "END":
            break
        lines.append(line)
    return "\n".join(lines)


def load_data():
    """读取 dynamics-data.js，返回 dynamics 列表"""
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        text = f.read()

    m = re.search(r"var\s+dynamicsData\s*=\s*(\[)", text)
    if not m:
        raise ValueError("未找到 dynamicsData 数组")

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
    """将数据写回 dynamics-data.js"""
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

    m = re.search(r"var\s+dynamicsData\s*=\s*\[", text)
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
    """将图片复制到 assets/images/dynamics/ 并返回相对路径"""
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


def main():
    print("=" * 50)
    print("  添加新动态（内容从 .docx 读取）")
    print("=" * 50)

    # 选择类型
    print("\n类型:")
    print("  1 - 原创动态")
    print("  2 - 转发动态")
    print("  3 - 转发视频")
    print("  4 - 投稿视频")
    print("  5 - 转发文章")
    t = input("请选择 (1/2/3/4/5): ").strip()
    while t not in ("1", "2", "3", "4", "5"):
        t = input("请输入 1、2、3、4 或 5: ").strip()

    # 公共输入
    print("\n--- 基本信息 ---")
    date_str = input("日期 (YYYY-MM-DD): ").strip()
    time_str = input("时间 (HH:MM): ").strip()

    content = input_content("动态内容")

    print("\n图片（文件路径，多张用逗号分隔，无则回车）:")
    img_input = input("> ").strip()
    img_paths = [p.strip() for p in img_input.split(",") if p.strip()] if img_input else []

    link = input("源动态网址: ").strip()

    images = []
    if img_paths:
        print()
        images = copy_images(img_paths)

    dyn = {
        "time": time_str,
        "content": content,
        "link": link
    }
    if images:
        dyn["images"] = images

    if t == "2":
        print("\n--- 转发的原动态信息 ---")
        repost_id = input("原作者 ID: ").strip()
        repost_content = input_content("原动态内容")

        print("\n原动态图片（文件路径，多张用逗号分隔，无则回车）:")
        r_img_input = input("> ").strip()
        r_img_paths = [p.strip() for p in r_img_input.split(",") if p.strip()] if r_img_input else []

        repost_link = input("原动态源网址: ").strip()

        r_images = []
        if r_img_paths:
            print()
            r_images = copy_images(r_img_paths)

        repost = {
            "id": repost_id,
            "content": repost_content,
            "link": repost_link
        }
        if r_images:
            repost["images"] = r_images

        dyn["repost"] = repost

    if t == "3":
        print("\n--- 转发的视频信息 ---")
        v_repost_id = input("原作者 ID: ").strip()
        v_repost_content = input_content("视频简介")
        v_dynamic_link = ""
        if v_repost_content:
            v_dynamic_link = input("原视频动态网址: ").strip()
        v_repost_title = input("视频标题: ").strip()

        print("\n视频封面（文件路径，无则回车）:")
        v_cover_input = input("> ").strip()
        v_cover = []
        if v_cover_input:
            v_cover = copy_images([v_cover_input])

        v_repost_link = input("视频网址: ").strip()

        v_repost = {
            "id": v_repost_id,
            "title": v_repost_title,
            "link": v_repost_link,
            "type": "video"
        }
        if v_repost_content:
            v_repost["content"] = v_repost_content
        if v_dynamic_link:
            v_repost["dynamic_link"] = v_dynamic_link
        if v_cover:
            v_repost["cover"] = v_cover[0]

        dyn["repost"] = v_repost

    if t == "5":
        print("\n--- 转发的文章信息 ---")
        a_repost_id = input("原作者 ID: ").strip()
        a_repost_title = input("文章标题: ").strip()

        print("\n文章封面（文件路径，无则回车）:")
        a_cover_input = input("> ").strip()
        a_cover = []
        if a_cover_input:
            a_cover = copy_images([a_cover_input])

        a_repost_link = input("文章网址: ").strip()

        a_repost = {
            "id": a_repost_id,
            "title": a_repost_title,
            "link": a_repost_link,
            "type": "article"
        }
        if a_cover:
            a_repost["cover"] = a_cover[0]

        dyn["repost"] = a_repost

    if t == "4":
        print("\n--- 投稿视频信息 ---")
        p_title = input("视频标题: ").strip()

        print("\n视频封面（文件路径，无则回车）:")
        p_cover_input = input("> ").strip()
        p_cover = []
        if p_cover_input:
            p_cover = copy_images([p_cover_input])

        p_link = input("视频网址: ").strip()

        p_repost = {
            "title": p_title,
            "link": p_link,
            "type": "post_video"
        }
        if p_cover:
            p_repost["cover"] = p_cover[0]

        dyn["repost"] = p_repost

    data = load_data()

    found = False
    for entry in data:
        if entry["date"] == date_str:
            entry["dynamics"].append(dyn)
            found = True
            break

    if not found:
        data.append({"date": date_str, "dynamics": [dyn]})
        data.sort(key=lambda e: e["date"], reverse=True)

    save_data(data)
    print(f"\n✓ 已添加至 {date_str}，共 {len(data)} 个日期分组")


if __name__ == "__main__":
    main()
