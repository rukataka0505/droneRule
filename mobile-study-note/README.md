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
- `app.js`: 検索、目次ジャンプ、続きから読む、ダークモード
- `generate_drone_study_site.py`: PDFからページを再生成するスクリプト
- `extracted-sections.json`: 抽出済み本文データ
