# Fairdrive

[English](README.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [한국어](README.ko.md)

*Claude가 번역했으며 원어민 검토는 아직입니다. 영어 [README](README.md)가 기준입니다.*

자동차 딜러(공식·독립), 정비소, 판금 도장 업체를 위한 31개의 작은 MCP 에이전트입니다. 각 에이전트는 **한 가지 일만** 맡아 DMS, 정비 관리 시스템, 견적 시스템, 재고금융사, 제조사가 이미 내보내는 파일을 읽고, 빠진 것·늦은 것·덜 받은 것·틀린 것을 작업 목록으로 만듭니다.

MIT 라이선스 · Node 20 이상 · 로컬 파일만 · 자격 증명 없음 · 가상 테스트 데이터만

고정 가격 설치 서비스: [Fairdrive](https://fair-agents.com/fairdrive.html).

## 사용해 보기

```bash
npm install
npm test
node packages/fairdrive-floorplan-audit/bin/fairdrive-floorplan-audit.js demo
node packages/fairdrive-contracts-in-transit/bin/fairdrive-contracts-in-transit.js demo
```

각 에이전트에는 가상 파일로 도는 `demo`, 자체 테스트 케이스가 있는 `eval`, MCP 서버(`<agent> mcp --root <폴더>`)가 있습니다.

## 에이전트 목록

**판매와 F&I:** [`fairdrive-deal-jackets`](packages/fairdrive-deal-jackets), [`fairdrive-contracts-in-transit`](packages/fairdrive-contracts-in-transit), [`fairdrive-finance-reserve`](packages/fairdrive-finance-reserve), [`fairdrive-product-cancellations`](packages/fairdrive-product-cancellations), [`fairdrive-service-contract-remittances`](packages/fairdrive-service-contract-remittances), [`fairdrive-ofac-red-flags`](packages/fairdrive-ofac-red-flags), [`fairdrive-customer-deposits`](packages/fairdrive-customer-deposits), [`fairdrive-we-owes`](packages/fairdrive-we-owes), [`fairdrive-sales-commissions`](packages/fairdrive-sales-commissions)

**차량과 재고금융:** [`fairdrive-floorplan-audit`](packages/fairdrive-floorplan-audit), [`fairdrive-curtailments`](packages/fairdrive-curtailments), [`fairdrive-used-vehicle-aging`](packages/fairdrive-used-vehicle-aging), [`fairdrive-reconditioning`](packages/fairdrive-reconditioning), [`fairdrive-loaner-fleet`](packages/fairdrive-loaner-fleet), [`fairdrive-trade-payoffs`](packages/fairdrive-trade-payoffs), [`fairdrive-title-tracking`](packages/fairdrive-title-tracking), [`fairdrive-incentive-claims`](packages/fairdrive-incentive-claims)

**서비스·부품·판금:** [`fairdrive-warranty-claims`](packages/fairdrive-warranty-claims), [`fairdrive-open-repair-orders`](packages/fairdrive-open-repair-orders), [`fairdrive-repair-order-margins`](packages/fairdrive-repair-order-margins), [`fairdrive-comebacks`](packages/fairdrive-comebacks), [`fairdrive-flat-rate-hours`](packages/fairdrive-flat-rate-hours), [`fairdrive-policy-adjustments`](packages/fairdrive-policy-adjustments), [`fairdrive-sublet-invoices`](packages/fairdrive-sublet-invoices), [`fairdrive-parts-obsolescence`](packages/fairdrive-parts-obsolescence), [`fairdrive-parts-receiving`](packages/fairdrive-parts-receiving), [`fairdrive-estimate-vs-invoice`](packages/fairdrive-estimate-vs-invoice), [`fairdrive-insurance-supplements`](packages/fairdrive-insurance-supplements)

**회계:** [`fairdrive-gl-schedules`](packages/fairdrive-gl-schedules), [`fairdrive-dmv-fees`](packages/fairdrive-dmv-fees), [`fairdrive-sales-tax`](packages/fairdrive-sales-tax)

## 안전 장치

- **로컬 파일만.** DMS, 은행, 제조사 포털, 차량 등록 기관, 보험사에 로그인하지 않으며 네트워크와 원격 수집이 없습니다.
- **모델이 보기 전에 마스킹.** 고객 이름·전화·이메일·주소·신분증 번호는 가명(`CU-3f9a1c2e`)으로 바뀝니다.
- **행동은 사람이.** 지급, 대출 실행, 등록, 신고, 발송, 전기는 모두 거부하며 초안과 지급 목록은 Auto 모드에서도 지정된 사람의 클릭을 기다립니다.
- **고정 규칙이 아닌 설정.** 일수, 요율, 커미션 계획, 세율, 한도는 매장이 확인합니다.
- **규정 준수 판정은 하지 않습니다.** OFAC·Red Flags 에이전트는 기록이 있는지만 확인합니다.

## 확인됨

테스트 812개와 평가 케이스 559개 모두 통과(Windows, Node 24). 악의적 입력·잘못된 인수 검사: 지적 0건. 9개 언어의 내보내기 파일을 똑같이 읽습니다. 자세한 내용은 [REVIEW-ver1.md](REVIEW-ver1.md).
