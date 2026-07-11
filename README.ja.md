# 橘猫の Hermes ツール箱

[中文](README.md) | [English](README.en.md)

これは、Hermes Agent を実際の作業で使う中で見つかったニーズをもとに、Vibe Coding で作成した小さなツール、スクリプト、関連スキルを集めるための公開個人ツール箱です。

このリポジトリは意図的に軽量に保ちます。各ツールまたはスクリプトは `tools/` 配下の独立したフォルダに置き、再利用可能な Agent 向け手順は `skills/` 配下の独立したフォルダに置きます。人間が読んで再利用するワークフロー、プロンプト、チェックリストは `playbooks/` 配下に置きます。トップレベル README はそれらのフォルダを索引するだけにします。具体的な使い方、依存関係、テスト方法、副作用、ロールバック手順は、それぞれのフォルダ内のドキュメントに書きます。

## ツール索引

| ツール | 状態 | 用途 |
|--------|------|------|
| [aria2-download](tools/aria2-download/) | `usable` | aria2 を使って大容量ファイル、URL 一括、再開可能なダウンロードを安全に実行します。 |
| [hosted-ppt](tools/hosted-ppt/) | `wip` | 人間と AI Agent 両方向けのプレゼンテーション hosting プラットフォーム。メール認証、閲覧 tracking、分析 dashboard、Agent API を搭載。 |
| [steam-activity](tools/steam-activity/) | `usable` | Steam ライブラリ、最近プレイしたゲーム、現在プレイ中のゲームを読み取ります。 |

## スキル索引

| スキル | 状態 | 用途 |
|--------|------|------|
| [aria2-download](skills/aria2-download/) | `usable` | 大容量・一括・再開可能なダウンロード時に、Agent がローカル aria2 wrapper を使い検証まで行うための手順です。 |
| [hosted-ppt](skills/hosted-ppt/) | `wip` | hosted-ppt プラットフォームのデプロイ、プレゼンテーション追加、トラブルシューティング、Agent API の利用を Agent が行うための手順です。 |
| [initialize-github-repository](skills/initialize-github-repository/) | `usable` | GitHub リポジトリ初期化時に、secret チェック、デプロイ先決定、ガバナンス文書、Issue/PR テンプレート、初回 commit と push を Agent が安全に進めるための手順です。 |
| [steam-activity](skills/steam-activity/) | `usable` | Steam の現在状態、最近のプレイ、ライブラリ、プレイ時間ランキングを照会して解釈するための Agent 手順です。 |
| [weixin-elder-setup](skills/weixin-elder-setup/) | `wip` | Hermes のインストール、モデルと WeChat の接続が完了した後、お年寄りの WeChat アシスタントとして設定：補助モデル、SOUL.md ペルソナ、DM ホワイトリスト、毎日天気 cron。 |

## プレイブック索引

| 項目 | 種類 | 用途 |
|------|------|------|
| [AGENTS.md 初期化草案](playbooks/prompts/initialize-agents-md.md) | `prompt` | Agent に現在のリポジトリを先に調査させ、`AGENTS.md`、`AGENTS_CHANGELOGS.md`、`CODEGUIDE.md` の初期化案を議論するためのプロンプトです。 |
| [コード文書の階層別メンテナンスルール](playbooks/prompts/code-documentation-layered-maintenance.md) | `prompt` | Agent が L0-L4 の階層に沿ってコード構造文書を維持し、アーキテクチャ、原則、ドメインモデル、モジュール詳細、運用手順の混在を避けるためのプロンプトです。 |

## 状態ラベル

| 状態 | 意味 |
|------|------|
| `idea` | アイデアまたは方向性の記録。未実装で、実行可能であることは期待しません。 |
| `wip` | 開発中。不完全、不安定、または未テストの可能性があります。 |
| `usable` | 実装済み、テスト済みで、ドキュメントに書かれた用途に使えることを確認済み。 |
| `deprecated` | 参考として残しますが、新規利用は推奨しません。 |

## リポジトリルール

- 1 つのツールまたはスクリプトは、`tools/` 配下の 1 つの独立フォルダに対応します。
- 1 つの再利用可能な Agent 向け手順は、`skills/` 配下の 1 つの独立フォルダに対応します。
- 人間が読んで再利用する 1 つのワークフロー、プロンプト、チェックリストは、`playbooks/` 配下の 1 つの Markdown ファイルに対応します。
- トップレベル README は索引専用です。特定ツールやスキルの詳細ドキュメントにはしません。
- ツール索引、スキル索引、プレイブック索引は分けて管理します。
- ツールを索引で `usable` と表示する前に、そのツールフォルダには必ず独自の `README.md` が必要です。
- 各スキルフォルダには必ず独自の `SKILL.md` が必要です。
- `playbooks/README.md` は、人間向けプレイブックの目録と管理ルールを維持します。
- デフォルト README は中国語です。英語版と日本語版は中国語版と同期して維持してください。
- Git 履歴をきれいに保ちます。ツールがテストされ、利用可能であることを確認してから commit / push します。
- secrets、token、ローカル Hermes 状態、非公開設定、session、auth ファイルを commit しないでください。

Agent 向けのメンテナンスルールは `AGENTS.md` にあります。

## License

MIT
