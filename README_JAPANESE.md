# ブロック崩し (Block Breaker) - GitHub Upload Guide

このフォルダはGitHubへのアップロード用に準備されたものです。

## フォルダ構成
- **playable_game**: すぐに遊べるゲームデータです。GitHubにアップロードして「GitHub Pages」を有効にすると、ブラウザで遊べるようになります。
- **src, public, etc**: ゲームのソースコード（プログラムの設計図）です。

## GitHubへのアップロード方法 (簡単)

### 1. ゲームを公開して遊びたい場合
`playable_game` フォルダの中身（index.html, assetsフォルダなど）を、GitHubのリポジトリにアップロードしてください。
その後、リポジトリの `Settings` -> `Pages` で `Branch: main (or master)`, `Folder: / (root)` を選択して Save すると、数分後に公開URLが表示されます。

### 2. ソースコードを保存したい場合
このフォルダ全体（`.git`などは含まれていませんが）をアップロードすれば、プロジェクトのバックアップとして保存できます。
`node_modules` は容量が大きいため意図的に削除しています（`npm install`で復元可能です）。
