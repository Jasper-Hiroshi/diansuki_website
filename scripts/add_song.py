"""交互式或从 TSV 文件向 js/songs-data.js 添加歌曲。"""

import argparse
import csv
import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "js" / "songs-data.js"
DATA_PATTERN = re.compile(r"var\s+songsData\s*=\s*(\{.*?\})\s*;", re.DOTALL)
BV_PATTERN = re.compile(r"^BV[0-9A-Za-z]+$", re.IGNORECASE)


def required(prompt):
    value = input(prompt).strip()
    if not value:
        raise ValueError("输入不能为空")
    return value


def read_data():
    text = DATA_FILE.read_text(encoding="utf-8")
    match = DATA_PATTERN.search(text)
    if not match:
        raise ValueError("无法解析 js/songs-data.js")
    return text, match, json.loads(match.group(1))


def normalize_bv(value):
    match = re.search(r"(?:video/)?(BV[0-9A-Za-z]+)", value.strip(), re.IGNORECASE)
    normalized = match.group(1) if match else value.strip()
    if not BV_PATTERN.fullmatch(normalized):
        raise ValueError("BV号格式不正确")
    return "BV" + normalized[2:]


def validate_date(value):
    datetime.strptime(value, "%Y-%m-%d")
    return value


def write_data(text, match, data):
    payload = json.dumps(data, ensure_ascii=False, indent=2)
    DATA_FILE.write_text(text[:match.start(1)] + payload + text[match.end(1):], encoding="utf-8")


def import_tsv(path):
    text, match, data = read_data()
    songs = data.setdefault("songs", [])
    by_title = {entry.get("title"): entry for entry in songs}
    added = 0
    updated = 0

    with Path(path).open("r", encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source, delimiter="\t")
        required_columns = {"曲名", "演唱者", "题材"}
        if not reader.fieldnames or not required_columns.issubset(reader.fieldnames):
            raise ValueError("文件必须包含曲名、演唱者、题材三列")

        for line_number, row in enumerate(reader, start=2):
            title = (row.get("曲名") or "").strip()
            singer = (row.get("演唱者") or "").strip()
            genre = (row.get("题材") or "").strip()
            if not title or not singer or not genre:
                raise ValueError(f"第{line_number}行存在空白字段")

            existing = by_title.get(title)
            if existing:
                if existing.get("singer") != singer or existing.get("genre") != genre:
                    existing["singer"] = singer
                    existing["genre"] = genre
                    updated += 1
                continue

            song = {"title": title, "singer": singer, "genre": genre, "items": []}
            songs.append(song)
            by_title[title] = song
            added += 1

    write_data(text, match, data)
    print(f"批量导入完成：新增{added}首，更新{updated}首，共{len(songs)}首。")


def interactive_main():
    print("添加歌曲或演唱记录")
    lookup_title = required("歌名: ")
    text, match, data = read_data()
    songs = data.setdefault("songs", [])
    song = next((entry for entry in songs if entry.get("title") == lookup_title), None)
    is_new_song = song is None

    if is_new_song:
        print("未找到该歌曲，将新建条目。")
        title = input(f"曲名（回车使用“{lookup_title}”）: ").strip() or lookup_title
        song = {
            "title": title,
            "singer": required("演唱者: "),
            "genre": required("题材: "),
            "items": [],
        }
        songs.append(song)
    else:
        print(f"已找到：{song['title']} / {song.get('singer', '')} / {song.get('genre', '')}")

    date_input = input("日期（YYYY-MM-DD，留空暂不添加子条目）: ").strip()
    if not date_input:
        if is_new_song:
            write_data(text, match, data)
            print(f"已新建歌曲：{song['title']}（暂未添加子条目）")
        else:
            print("未添加子条目，数据保持不变。")
        return

    item = {
        "date": validate_date(date_input),
        "bv": normalize_bv(required("BV号: ")),
    }
    if item in song.setdefault("items", []):
        print("该日期和BV号已存在，未重复写入。")
        return

    song["items"].append(item)
    song["items"].sort(key=lambda entry: entry.get("date", ""))
    write_data(text, match, data)
    print(f"已写入：{song['title']} / {item['date']} / {item['bv']}")


def main():
    parser = argparse.ArgumentParser(description="添加歌曲或演唱记录")
    parser.add_argument("--file", help="批量导入包含曲名、演唱者、题材三列的TSV文件")
    args = parser.parse_args()
    if args.file:
        import_tsv(args.file)
    else:
        interactive_main()


if __name__ == "__main__":
    try:
        main()
    except (ValueError, json.JSONDecodeError) as error:
        print(f"错误：{error}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n已取消。")
        sys.exit(0)
