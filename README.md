# CRYSTAL STORY

マイコンBASICマガジン 1988年掲載のMSX2 BASICゲーム「CRYSTAL STORY」（作：永山治）を、現代のブラウザで遊べるよう移植したものです。

**▷ [ブラウザで遊ぶ](https://naga3.github.io/crystal-story/)**

## 特徴

- **ORIGINAL モード** — 原典のドット絵・パレット・PSGサウンドを忠実に再現
- **ARRANGE モード** — 0x72のダンジョンタイルセット ＋ シンセウェーブBGM ＋ Sci-fi SFXで現代風アレンジ
- 全30面
- PC（キーボード）/ スマートフォン（タッチUI）両対応

## 遊び方

「詰めペンゴ」系のパズルです。

- 自分を動かして、**クリスタル（宝箱）を縦か横で3つ並べる**とクリア（斜めはNG）
- クリスタルは押すと滑って端まで進む。背後に障害物があると動かない
- ブロック（青ボタン）は押すと滑る。背後に何かあると **壊れる**
- 各面に **ステップ数の上限** あり。超えるとクリア不能
- **外枠に沿った3並びはクリアにならない**

## 操作

| キー | 動作 |
|---|---|
| カーソルキー / WASD | 移動・タイトルでメニュー選択 |
| Enter / Space | クリア後、次の面へ |
| R | 同じ面をリトライ |
| G | タイトル画面に戻る |
| C | タイトルでコンティニュー（中断面から再開） |

スマートフォンは画面下の十字 ＋ A/R/G ボタン。

## 開発

```bash
npm install
npm run dev       # http://localhost:5173/
npm run build     # 本番ビルド → dist/
```

[Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/) で書かれています。

`main` への push で [GitHub Actions](https://github.com/naga3/crystal-story/actions) が自動デプロイします。

## ライセンス

ソースコード: MIT License

ARRANGEモードで使う第三者素材は全て **CC0**（パブリックドメイン）です。詳細は [CREDITS.md](CREDITS.md) を参照してください。

原典の BASIC プログラム由来のロジック・ステージデータ・グラフィックは、作者本人（永山治）による移植です。
