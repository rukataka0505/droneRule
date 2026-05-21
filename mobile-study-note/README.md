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
- `quiz.js`: 問題セット切り替え、分野絞り込み、回答保存、正誤表示
- `quiz_questions.json`: 公式サンプル50問の問題データ
- `sample_questions_100.json`: 分野別サンプル100問の問題データ
- `build_sample_questions.py`: 分野別サンプル100問の生成スクリプト
- `generate_drone_study_site.py`: PDFからページを再生成するスクリプト
- `extracted-sections.json`: 抽出済み本文データ
