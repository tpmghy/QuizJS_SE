#!/bin/bash

echo "ビルドを開始します..."

# publicフォルダをクリーンアップして再作成
rm -rf public
mkdir public

# script.jsのプレースホルダーを環境変数で置き換える
sed -e "s|__API_URL__|${API_URL}|g" \
    -e "s|__SECRET_KEY__|${SECRET_KEY}|g" \
    script.js > public/script.js

# HTMLとCSSをpublicフォルダにコピー
cp index.html public/index.html
cp style.css public/style.css

echo "ビルドが完了しました！"
