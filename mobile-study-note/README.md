# Drone Study Mobile Note

スマホで読みやすいWeb記事形式に整えた「無人航空機の飛行の安全に関する教則」学習ページです。

## 開き方

このフォルダで静的サーバーを起動し、`index.html` を開きます。

```powershell
python -m http.server 8000
```

## 内容

- `index.html`: 学習ページ本体
- `style.css`: スマホ向けレイアウトと表示テーマ
- `app.js`: 検索、目次ジャンプ、ダークモード
- `quiz.html`: クイズ専用ページ
- `quiz.css`: クイズ専用ページのレイアウト
- `quiz.js`: 穴埋め網羅・本試験形式の切り替え、複数分野選択、ランダム10問、回答保存、正誤表示
- `manual_quiz_questions.json`: 教則本文から生成した網羅クイズ872問
- `exam_style_questions.json`: 重要知識を問う本試験形式クイズ163問
- `build_manual_quiz.py`: 網羅クイズの生成スクリプト
- `generate_drone_study_site.py`: PDFからページを再生成するスクリプト
- `extracted-sections.json`: 抽出済み本文データ
