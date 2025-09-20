#!/bin/bash

# 1. 公開用のフォルダ(public)がもしあれば一度削除し、新しく作る
rm -rf public
mkdir public

# 2. script.jsのプレースホルダーを、Netlifyの環境変数で置き換える
#    そして、完成したファイルを public/script.js として保存する
sed -e "s|__API_URL__|${API_URL}|g" \
    -e "s|__SECRET_KEY__|${SECRET_KEY}|g" \
    script.js > public/script.js

# 3. HTMLとCSSファイルをそのまま public フォルダにコピーする
cp index.html public/index.html
cp style.css public/style.css

echo "ビルドが完了しました！"