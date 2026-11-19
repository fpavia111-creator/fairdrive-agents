# Fairdrive

[English](README.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [한국어](README.ko.md)

*由 Claude 翻译，尚待母语人士审校。以英文 [README](README.md) 为准。*

面向汽车经销商（品牌店和独立店）、维修厂和钣喷厂的 31 个小型 MCP 智能体。每个智能体**只做一件事**：读取您的 DMS、维修管理系统、定损系统、库存融资机构或厂家已经导出的文件，写出一份工作清单——缺什么、哪里逾期、哪里少付、哪里有错。

MIT 许可 · Node 20 或更高 · 仅本地文件 · 无需凭据 · 仅虚构测试数据

固定价格的部署服务: [Fairdrive](https://fair-agents.com/fairdrive.html).

## 试用

```bash
npm install
npm test
node packages/fairdrive-floorplan-audit/bin/fairdrive-floorplan-audit.js demo
node packages/fairdrive-contracts-in-transit/bin/fairdrive-contracts-in-transit.js demo
```

每个智能体都有基于虚构文件的 `demo`、带自有测试用例的 `eval`，以及 MCP 服务器（`<agent> mcp --root <文件夹>`）。

## 智能体列表

**销售与 F&I:** [`fairdrive-deal-jackets`](packages/fairdrive-deal-jackets), [`fairdrive-contracts-in-transit`](packages/fairdrive-contracts-in-transit), [`fairdrive-finance-reserve`](packages/fairdrive-finance-reserve), [`fairdrive-product-cancellations`](packages/fairdrive-product-cancellations), [`fairdrive-service-contract-remittances`](packages/fairdrive-service-contract-remittances), [`fairdrive-ofac-red-flags`](packages/fairdrive-ofac-red-flags), [`fairdrive-customer-deposits`](packages/fairdrive-customer-deposits), [`fairdrive-we-owes`](packages/fairdrive-we-owes), [`fairdrive-sales-commissions`](packages/fairdrive-sales-commissions)

**车辆与库存融资:** [`fairdrive-floorplan-audit`](packages/fairdrive-floorplan-audit), [`fairdrive-curtailments`](packages/fairdrive-curtailments), [`fairdrive-used-vehicle-aging`](packages/fairdrive-used-vehicle-aging), [`fairdrive-reconditioning`](packages/fairdrive-reconditioning), [`fairdrive-loaner-fleet`](packages/fairdrive-loaner-fleet), [`fairdrive-trade-payoffs`](packages/fairdrive-trade-payoffs), [`fairdrive-title-tracking`](packages/fairdrive-title-tracking), [`fairdrive-incentive-claims`](packages/fairdrive-incentive-claims)

**售后、配件与钣喷:** [`fairdrive-warranty-claims`](packages/fairdrive-warranty-claims), [`fairdrive-open-repair-orders`](packages/fairdrive-open-repair-orders), [`fairdrive-repair-order-margins`](packages/fairdrive-repair-order-margins), [`fairdrive-comebacks`](packages/fairdrive-comebacks), [`fairdrive-flat-rate-hours`](packages/fairdrive-flat-rate-hours), [`fairdrive-policy-adjustments`](packages/fairdrive-policy-adjustments), [`fairdrive-sublet-invoices`](packages/fairdrive-sublet-invoices), [`fairdrive-parts-obsolescence`](packages/fairdrive-parts-obsolescence), [`fairdrive-parts-receiving`](packages/fairdrive-parts-receiving), [`fairdrive-estimate-vs-invoice`](packages/fairdrive-estimate-vs-invoice), [`fairdrive-insurance-supplements`](packages/fairdrive-insurance-supplements)

**财务:** [`fairdrive-gl-schedules`](packages/fairdrive-gl-schedules), [`fairdrive-dmv-fees`](packages/fairdrive-dmv-fees), [`fairdrive-sales-tax`](packages/fairdrive-sales-tax)

## 如何保持安全

- **仅本地文件。** 不登录 DMS、银行、厂家门户、车管部门或保险公司；无网络、无遥测。
- **模型看到之前先脱敏。** 客户姓名、电话、邮箱、地址和证件号码，以及员工（销售、技师、服务顾问）姓名，会替换为假名（`CU-3f9a1c2e`、`ST-8cea1a2d`）。
- **由人来操作。** 付款、放款、上牌、申报、发送和记账一律拒绝；草稿和付款清单即使在 Auto 模式下也要等指定人员点击。
- **是设置，不是写死的规则。** 天数、费率、提成方案、税率和上限由您的门店确认。
- **不做合规判定。** OFAC 与 Red Flags 智能体只检查记录是否存在。

## 已检查

812 个测试和 559 个评测用例全部通过（Windows，Node 24）。恶意输入与错误参数检查：0 项发现。九种语言的导出文件读取结果一致。详情见 [REVIEW-ver1.md](REVIEW-ver1.md)。
