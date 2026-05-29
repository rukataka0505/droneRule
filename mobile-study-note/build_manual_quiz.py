import json
import random
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "extracted-sections.json"
OUTPUT = ROOT / "manual_quiz_questions.json"

LEADING_MARK = re.compile(
    r"^(?:[①②③④⑤⑥⑦⑧⑨⑩]|[⚫●・]|[ア-ン]\.|[a-z]\)|[a-z]\.|[（(]\d+[）)]|\d+[）)]|[（(][ア-ン][）)]|[（(][a-z][）)])\s*"
)

IMPORTANT_TERMS = [
    "無人航空機",
    "航空機",
    "模型航空機",
    "登録記号",
    "リモートID",
    "機体認証",
    "型式認証",
    "技能証明",
    "特定飛行",
    "カテゴリーI",
    "カテゴリーII",
    "カテゴリーIII",
    "立入管理措置",
    "第三者",
    "第三者上空",
    "人口集中地区",
    "緊急用務空域",
    "空港等周辺",
    "地表又は水面から150m以上",
    "夜間飛行",
    "目視外飛行",
    "30m未満",
    "催し場所上空",
    "危険物輸送",
    "物件投下",
    "飛行計画",
    "飛行日誌",
    "事故",
    "重大インシデント",
    "救護",
    "危険防止措置",
    "小型無人機等飛行禁止法",
    "道路交通法",
    "民法",
    "個人情報保護法",
    "電波法",
    "GNSS",
    "GPS",
    "ジャイロ",
    "加速度",
    "方位",
    "気圧",
    "フライトコントロールシステム",
    "フェールセーフ",
    "リチウムポリマーバッテリー",
    "プロペラ",
    "キャリブレーション",
    "CRM",
    "リスク",
    "ハザード",
    "気象",
    "風",
    "乱流",
    "雲",
    "視程",
    "ホバリング",
    "垂直離着陸",
    "揚力",
    "抗力",
    "推力",
    "重力",
]

GENERIC_DISTRACTORS = [
    "飛行計画",
    "飛行日誌",
    "機体認証",
    "技能証明",
    "登録記号",
    "立入管理措置",
    "第三者",
    "航空機",
    "リスク",
    "ハザード",
    "GNSS",
    "フェールセーフ",
    "CRM",
    "事故",
    "重大インシデント",
    "気象",
]

FALLBACK_STOPWORDS = {
    "こと",
    "もの",
    "ため",
    "場合",
    "必要",
    "確認",
    "飛行",
    "機体",
    "安全",
    "当該",
    "これ",
    "それ",
    "する",
    "いる",
    "ある",
    "できる",
    "しない",
    "ならない",
}


def clean_text(text: str) -> str:
    text = text.replace("\u3000", " ")
    text = re.sub(r"(?<=[一-龯ぁ-んァ-ヶ]) (?=[一-龯ぁ-んァ-ヶ])", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = text.replace(" )", ")").replace("( ", "(")
    text = text.replace("（ ", "（").replace(" ）", "）")
    return text


def is_list_item(text: str) -> bool:
    return bool(LEADING_MARK.match(text))


def split_blocks(lines: list[dict]) -> list[dict]:
    blocks = []
    paragraph = []
    pages = []

    def flush() -> None:
        nonlocal paragraph, pages
        if not paragraph:
            return
        text = clean_text(" ".join(paragraph))
        if len(text) >= 24:
            blocks.append({"text": text, "page": min(pages), "kind": "paragraph"})
        paragraph = []
        pages = []

    for item in lines:
        text = clean_text(item["text"])
        page = item["page"]
        if is_list_item(text):
            flush()
            stripped = clean_text(LEADING_MARK.sub("", text))
            if len(stripped) >= 16:
                blocks.append({"text": stripped, "page": page, "kind": "list"})
            continue

        paragraph.append(text)
        pages.append(page)
        joined = " ".join(paragraph)
        if text.endswith(("。", "である。", "こと。", "する。", "ない。", "いる。", "た。")) or len(joined) > 180:
            flush()

    flush()
    return blocks


def candidate_terms(text: str) -> list[str]:
    terms = []
    for term in IMPORTANT_TERMS:
        if term in text:
            terms.append(term)

    terms.extend(re.findall(r"\d+(?:\.\d+)?\s?(?:m|km|g|kg|分|年|日|時間|MHz|GHz)", text))
    terms.extend(re.findall(r"[A-Z]{2,}(?:\s?[A-Z]{2,})?", text))
    terms.extend(re.findall(r"「([^」]{3,24})」", text))
    terms.extend(re.findall(r"（([^（）]{3,24})）", text))
    terms.extend(re.findall(r"[一-龯ぁ-んァ-ヶA-Za-z0-9]{3,16}(?:制度|措置|義務|承認|許可|認証|証明|登録|飛行|空域|方式|点検|確認|管理|評価|計画|情報|性能|操作|安全|事故|法|規則)", text))

    cleaned = []
    seen = set()
    for term in terms:
        term = clean_text(term)
        if len(term) < 2 or len(term) > 28:
            continue
        if term in seen:
            continue
        if re.match(r"^(?:により|における|に関する|として|ための|から|では|又は|及び|並びに|その|この|あの|各)", term):
            continue
        if re.search(r"(?:する|した|される|できる|ある|いる|なる|ない)$", term):
            continue
        if re.fullmatch(r"(?:飛行|機体|場合|もの|こと|ため|以下|以上|必要|安全|確認|操作|管理|情報|制度|措置|義務|承認|許可|認証|登録|点検|評価|計画)", term):
            continue
        if term in {"こと", "もの", "ため", "以下", "以上", "場合", "必要", "できる"}:
            continue
        seen.add(term)
        cleaned.append(term)
    return cleaned


def best_answer(text: str) -> str | None:
    terms = candidate_terms(text)
    if not terms:
        terms = fallback_terms(text)
    if not terms:
        return None
    terms.sort(key=lambda value: (value in IMPORTANT_TERMS, len(value)), reverse=True)
    return terms[0]


def fallback_terms(text: str) -> list[str]:
    patterns = [
        r"「([^」]{3,24})」",
        r"（([^（）]{3,24})）",
        r"\d+(?:\.\d+)?\s?(?:m|km|g|kg|グラム|分|年|日|時間|MHz|GHz)",
        r"[一-龯ぁ-んァ-ヶA-Za-z0-9]{3,18}(?:制度|措置|義務|承認|許可|認証|証明|登録|飛行|空域|方式|点検|確認|管理|評価|計画|情報|性能|操作|安全|事故|法|規則|場合|場所|事項|状況|通報|報告|判断|機能|装置|距離|高度|速度|方法|者)",
        r"[一-龯ぁ-んァ-ヶA-Za-z0-9]{2,12}",
    ]
    terms = []
    seen = set()
    for pattern in patterns:
        for value in re.findall(pattern, text):
            term = clean_text(value)
            if len(term) < 2 or len(term) > 24:
                continue
            if term in seen or term in FALLBACK_STOPWORDS:
                continue
            if re.search(r"(?:する|した|される|できる|ある|いる|なる|ない)$", term):
                continue
            seen.add(term)
            terms.append(term)
    return terms


def mask_quote(quote: str, answer: str) -> str:
    return quote.replace(answer, "＿＿＿＿", 1)


def choose_distractors(answer: str, local_pool: list[str], global_pool: list[str], seed: int) -> list[str]:
    rng = random.Random(seed)
    pool = [item for item in local_pool + global_pool + GENERIC_DISTRACTORS if item != answer and item not in answer and answer not in item]
    unique = []
    for item in pool:
        if item not in unique:
            unique.append(item)
    unique.sort(key=lambda value: abs(len(value) - len(answer)))
    top = unique[:24] if len(unique) >= 24 else unique
    rng.shuffle(top)
    selected = top[:2]
    while len(selected) < 2:
        fallback = GENERIC_DISTRACTORS[len(selected)]
        if fallback != answer and fallback not in selected:
            selected.append(fallback)
    return selected


def main() -> None:
    sections = json.loads(SOURCE.read_text(encoding="utf-8"))
    section_blocks = []
    global_terms = []
    for section in sections:
        blocks = split_blocks(section.get("lines", []))
        terms = []
        for block in blocks:
            terms.extend(candidate_terms(block["text"]))
        global_terms.extend(terms)
        section_blocks.append((section, blocks, terms))

    questions = []
    serial = 1
    for section, blocks, section_terms in section_blocks:
        if not blocks:
            continue
        for block_index, block in enumerate(blocks, start=1):
            answer = best_answer(block["text"])
            if not answer:
                continue
            quote = block["text"]
            if answer not in quote:
                continue
            choices = [answer] + choose_distractors(answer, section_terms, global_terms, serial)
            rng = random.Random(serial * 7919)
            rng.shuffle(choices)
            questions.append(
                {
                    "id": f"manual-{serial:04d}",
                    "bank": "教則網羅クイズ",
                    "source": "無人航空機の飛行の安全に関する教則",
                    "category": section["title"],
                    "section": section["title"],
                    "sectionId": section["id"],
                    "page": block["page"],
                    "order": serial,
                    "question": mask_quote(quote, answer),
                    "choices": choices,
                    "answer": choices.index(answer),
                    "explanation": f"正解は「{answer}」。教則本文の流れを保ったまま、この語句を補って読み進めます。",
                    "reference": f"{section['title']} / PDF p.{block['page']}",
                    "quote": quote,
                }
            )
            serial += 1

    OUTPUT.write_text(json.dumps(questions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(questions)} questions to {OUTPUT.name}")


if __name__ == "__main__":
    main()
