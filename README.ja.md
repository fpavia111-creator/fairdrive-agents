# Fairdrive

[English](README.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [한국어](README.ko.md)

*Claude による翻訳です。ネイティブによる確認はまだです。英語の [README](README.md) が正です。*

自動車ディーラー（正規・独立系）、整備工場、板金塗装工場のための 31 個の小さな MCP エージェントです。各エージェントは **一つの仕事だけ** を担当し、DMS、整備管理システム、見積システム、在庫金融会社、メーカーがすでに出力しているファイルを読み、足りないもの・遅れているもの・不足払い・誤りを作業リストにします。

MIT ライセンス · Node 20 以上 · ローカルファイルのみ · 認証情報不要 · 架空のテストデータのみ

固定価格のセットアップ: [Fairdrive](https://fair-agents.com/fairdrive.html).

## 試す

```bash
npm install
npm test
node packages/fairdrive-floorplan-audit/bin/fairdrive-floorplan-audit.js demo
node packages/fairdrive-contracts-in-transit/bin/fairdrive-contracts-in-transit.js demo
```

各エージェントには架空ファイルで動く `demo`、独自のテストケースによる `eval`、MCP サーバー（`<agent> mcp --root <フォルダー>`）があります。

## エージェント一覧

**販売と F&I:** [`fairdrive-deal-jackets`](packages/fairdrive-deal-jackets), [`fairdrive-contracts-in-transit`](packages/fairdrive-contracts-in-transit), [`fairdrive-finance-reserve`](packages/fairdrive-finance-reserve), [`fairdrive-product-cancellations`](packages/fairdrive-product-cancellations), [`fairdrive-service-contract-remittances`](packages/fairdrive-service-contract-remittances), [`fairdrive-ofac-red-flags`](packages/fairdrive-ofac-red-flags), [`fairdrive-customer-deposits`](packages/fairdrive-customer-deposits), [`fairdrive-we-owes`](packages/fairdrive-we-owes), [`fairdrive-sales-commissions`](packages/fairdrive-sales-commissions)

**車両と在庫金融:** [`fairdrive-floorplan-audit`](packages/fairdrive-floorplan-audit), [`fairdrive-curtailments`](packages/fairdrive-curtailments), [`fairdrive-used-vehicle-aging`](packages/fairdrive-used-vehicle-aging), [`fairdrive-reconditioning`](packages/fairdrive-reconditioning), [`fairdrive-loaner-fleet`](packages/fairdrive-loaner-fleet), [`fairdrive-trade-payoffs`](packages/fairdrive-trade-payoffs), [`fairdrive-title-tracking`](packages/fairdrive-title-tracking), [`fairdrive-incentive-claims`](packages/fairdrive-incentive-claims)

**サービス・部品・板金:** [`fairdrive-warranty-claims`](packages/fairdrive-warranty-claims), [`fairdrive-open-repair-orders`](packages/fairdrive-open-repair-orders), [`fairdrive-repair-order-margins`](packages/fairdrive-repair-order-margins), [`fairdrive-comebacks`](packages/fairdrive-comebacks), [`fairdrive-flat-rate-hours`](packages/fairdrive-flat-rate-hours), [`fairdrive-policy-adjustments`](packages/fairdrive-policy-adjustments), [`fairdrive-sublet-invoices`](packages/fairdrive-sublet-invoices), [`fairdrive-parts-obsolescence`](packages/fairdrive-parts-obsolescence), [`fairdrive-parts-receiving`](packages/fairdrive-parts-receiving), [`fairdrive-estimate-vs-invoice`](packages/fairdrive-estimate-vs-invoice), [`fairdrive-insurance-supplements`](packages/fairdrive-insurance-supplements)

**経理:** [`fairdrive-gl-schedules`](packages/fairdrive-gl-schedules), [`fairdrive-dmv-fees`](packages/fairdrive-dmv-fees), [`fairdrive-sales-tax`](packages/fairdrive-sales-tax)

## 安全のしくみ

- **ローカルファイルのみ。** DMS、銀行、メーカーポータル、陸運局、保険会社にはログインしません。通信もテレメトリーもありません。
- **モデルが見る前にマスク。** 顧客の氏名・電話・メール・住所・身分証番号は仮名（`CU-3f9a1c2e`）に置き換えます。
- **行動するのは人。** 支払い、融資実行、登録、申請、送信、記帳はすべて拒否し、下書きや支払リストは指名された人のクリックを Auto モードでも待ちます。
- **固定ルールではなく設定。** 日数、料率、歩合プラン、税率、上限はお店が確認します。
- **コンプライアンス判定はしません。** OFAC・Red Flags エージェントは記録の有無だけを確認します。

## 確認済み

812 件のテストと 559 件の評価ケースがすべて合格（Windows、Node 24）。敵対的入力・壊れた引数の検査は指摘 0 件。9 言語のエクスポートを同じように読みます。詳細は [REVIEW-ver1.md](REVIEW-ver1.md)。
