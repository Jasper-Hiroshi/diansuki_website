"""
add_song.py — 向 songs-data.js 添加歌曲

用法：
    python scripts/add_song.py

交互式添加歌曲，支持：
  - 新建歌曲（含封面复制到 assets/images/songs/）
  - 向已有歌曲追加子条目（版本名、日期、源链接、音频文件复制到 assets/songs/）
"""
import os
import re
import shutil
import sys
from pathlib import Path

# 项目根目录（脚本所在目录）
ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "js" / "songs-data.js"
IMAGES_DIR = ROOT / "assets" / "images" / "songs"
SONGS_DIR = ROOT / "assets" / "songs"


def read_data():
    """读取 songs-data.js，返回 (头部文本, 歌曲列表)"""
    text = DATA_FILE.read_text(encoding="utf-8")
    m = re.search(r"var songsData = (\{.*?\n\});", text, re.DOTALL)
    if not m:
        print("错误：无法解析 songs-data.js 中的 songsData")
        sys.exit(1)
    return text, m.group(1)


def parse_songs(raw):
    """从 JS 对象字符串中提取 songs 数组文本"""
    # 找到 "songs:" 后的 "[" 位置，然后找到匹配的 "]"
    start = raw.index("songs:")
    bracket_start = raw.index("[", start)
    depth = 0
    i = bracket_start
    while i < len(raw):
        ch = raw[i]
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return raw[bracket_start + 1:i]  # 不含最外层 [ ]
        i += 1
    print("错误：无法解析 songs 数组")
    sys.exit(1)


def find_song(songs_raw, title):
    """在 songs 原始文本中查找指定 title 的歌曲，返回 (index, start_pos) 或 (-1, None)"""
    pattern = re.compile(
        r'\{\s*title:\s*"(' + re.escape(title) + r')"',
        re.DOTALL
    )
    m = pattern.search(songs_raw)
    if m:
        return m.start(), m
    return -1, None


def build_song_entry(title, cover_path, items_raw):
    """构建一首歌的 JS 文本"""
    lines = []
    lines.append("    {")
    lines.append(f'      title: "{title}",')
    lines.append(f'      cover: "{cover_path}",')
    lines.append("      items: [")
    lines.append(items_raw)
    lines.append("      ]")
    lines.append("    }")
    return "\n".join(lines)


def build_item(note, date, link, audio):
    """构建一个子条目的 JS 文本（单行）"""
    parts = []
    parts.append(f'note: "{note}"')
    parts.append(f'date: "{date}"')
    if link:
        parts.append(f'link: "{link}"')
    if audio:
        parts.append(f'audio: "{audio}"')
    return "        { " + ", ".join(parts) + " }"


def copy_file(src, dest_dir, label):
    """复制文件到目标目录，返回相对路径"""
    if not src or not src.strip():
        return ""
    src_path = Path(src.strip())
    if not src_path.exists():
        print(f"  警告：文件不存在 — {src}")
        return ""

    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / src_path.name

    if dest_path.exists():
        answer = input(f"  {label}文件 '{src_path.name}' 已存在，覆盖？(y/n): ").strip().lower()
        if answer != "y":
            print(f"  跳过复制，使用已存在的文件")
            return str(dest_path.relative_to(ROOT)).replace("\\", "/")

    shutil.copy2(src_path, dest_path)
    print(f"  已复制: {src_path.name} -> {label}")
    return str(dest_path.relative_to(ROOT)).replace("\\", "/")


def write_data(text, songs_raw):
    """将新的 songs 数组写回文件（括号匹配替换）"""
    # 找到 "songs:" 后的 "[" 位置，匹配到对应的 "]"
    start = text.index("songs:")
    bracket_start = text.index("[", start)
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
        print("错误：无法找到 songs 数组结束位置")
        sys.exit(1)

    before = text[:bracket_start + 1]
    after = text[bracket_end:]
    new_text = before + songs_raw + after
    DATA_FILE.write_text(new_text, encoding="utf-8")
    print(f"\n已写入: {DATA_FILE}")


def main():
    print("=" * 50)
    print("  添加歌曲到 songs-data.js")
    print("=" * 50)

    # 输入歌曲名
    print()
    title = input("① 歌曲名: ").strip()
    if not title:
        print("错误：歌曲名不能为空")
        sys.exit(1)

    # 读取现有数据
    text, raw = read_data()
    songs_raw = parse_songs(raw)

    cover_path = ""
    pos, _ = find_song(songs_raw, title)

    if pos >= 0:
        print(f"  ✓ 歌曲 '{title}' 已存在，跳过封面设置")
    else:
        print(f"\n  → 新建歌曲 '{title}'")
        cover_input = input("② 封面文件路径（拖入文件或输入路径）: ").strip().strip('"')
        if cover_input:
            cover_path = copy_file(cover_input, IMAGES_DIR, "封面")
        else:
            print("  跳过封面（留空）")

    # 子条目输入
    print()
    print("③ 子条目信息")
    note = input('  版本名（如“翻唱练习”）: ').strip()
    if not note:
        print("错误：版本名不能为空")
        sys.exit(1)

    date = input("  日期（YYYY-MM-DD）: ").strip()
    if not date:
        print("错误：日期不能为空")
        sys.exit(1)
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date):
        print("警告：日期格式建议为 YYYY-MM-DD")

    link = input("  源视频链接（bilibili等，可留空）: ").strip()

    audio_input = input("  音频文件路径（拖入文件或留空跳过）: ").strip().strip('"')
    audio_path = ""
    if audio_input:
        audio_path = copy_file(audio_input, SONGS_DIR, "音频")

    # 构建子条目
    new_item = build_item(note, date, link, audio_path)

    # 更新 songs 文本
    if pos >= 0:
        # 在已有歌曲的 items 数组中追加
        # 找到该歌曲 items 数组的最后一个 ]
        song_end = songs_raw.find("]", pos)
        # 往前找到 items: [ 的位置
        items_start = songs_raw.rfind("[", pos, song_end)
        closing_bracket_pos = song_end  # items 的 ]
        # 在 ] 之前插入新条目
        before = songs_raw[:closing_bracket_pos]
        after = songs_raw[closing_bracket_pos:]

        # 检查 items 是否已有内容
        existing_items = songs_raw[items_start + 1:closing_bracket_pos].strip()
        if existing_items:
            new_songs_raw = before + ",\n" + new_item + "\n      " + after
        else:
            new_songs_raw = before + "\n" + new_item + "\n      " + after
    else:
        # 新建歌曲
        new_song = build_song_entry(title, cover_path, new_item)
        existing = songs_raw.strip()
        if existing:
            new_songs_raw = existing.rstrip() + ",\n" + new_song + "\n  "
        else:
            new_songs_raw = "\n" + new_song + "\n  "

    # 确认
    print()
    print("-" * 50)
    print("  预览即将添加的内容：")
    print(f"  歌曲: {title}")
    if cover_path:
        print(f"  封面: {cover_path}")
    print(f"  版本: {note}")
    print(f"  日期: {date}")
    if link:
        print(f"  源链: {link}")
    if audio_path:
        print(f"  音频: {audio_path}")
    print("-" * 50)

    confirm = input("确认写入？(y/n): ").strip().lower()
    if confirm != "y":
        print("已取消。")
        sys.exit(0)

    write_data(text, new_songs_raw)
    print("✓ 完成！")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n已取消。")
        sys.exit(0)
