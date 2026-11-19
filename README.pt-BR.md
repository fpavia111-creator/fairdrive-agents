# Fairdrive

[English](README.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [한국어](README.ko.md)

*Traduzido pelo Claude; revisão por falante nativo pendente. O [README](README.md) em inglês é o que vale.*

31 pequenos agentes MCP para concessionárias (de marca e independentes), oficinas mecânicas e funilarias. Cada agente tem **uma única tarefa**, lê os arquivos que seu DMS, seu sistema de oficina, seu sistema de orçamentos, sua financeira de floor plan ou a montadora já exportam, e escreve uma lista de trabalho: o que falta, está atrasado, foi pago a menos ou está errado.

Licença MIT · Node 20 ou mais recente · apenas arquivos locais · sem credenciais · apenas dados de teste fictícios

Implantação a preço fixo: [Fairdrive](https://fair-agents.com/fairdrive.html).

## Experimentar

```bash
npm install
npm test
node packages/fairdrive-floorplan-audit/bin/fairdrive-floorplan-audit.js demo
node packages/fairdrive-contracts-in-transit/bin/fairdrive-contracts-in-transit.js demo
```

Cada agente tem uma `demo` com arquivos fictícios, um `eval` com seus próprios casos de teste e um servidor MCP (`<agent> mcp --root <pasta>`).

## Os agentes

**Vendas e F&I:** [`fairdrive-deal-jackets`](packages/fairdrive-deal-jackets), [`fairdrive-contracts-in-transit`](packages/fairdrive-contracts-in-transit), [`fairdrive-finance-reserve`](packages/fairdrive-finance-reserve), [`fairdrive-product-cancellations`](packages/fairdrive-product-cancellations), [`fairdrive-service-contract-remittances`](packages/fairdrive-service-contract-remittances), [`fairdrive-ofac-red-flags`](packages/fairdrive-ofac-red-flags), [`fairdrive-customer-deposits`](packages/fairdrive-customer-deposits), [`fairdrive-we-owes`](packages/fairdrive-we-owes), [`fairdrive-sales-commissions`](packages/fairdrive-sales-commissions)

**Veículos e floor plan:** [`fairdrive-floorplan-audit`](packages/fairdrive-floorplan-audit), [`fairdrive-curtailments`](packages/fairdrive-curtailments), [`fairdrive-used-vehicle-aging`](packages/fairdrive-used-vehicle-aging), [`fairdrive-reconditioning`](packages/fairdrive-reconditioning), [`fairdrive-loaner-fleet`](packages/fairdrive-loaner-fleet), [`fairdrive-trade-payoffs`](packages/fairdrive-trade-payoffs), [`fairdrive-title-tracking`](packages/fairdrive-title-tracking), [`fairdrive-incentive-claims`](packages/fairdrive-incentive-claims)

**Serviço, peças e funilaria:** [`fairdrive-warranty-claims`](packages/fairdrive-warranty-claims), [`fairdrive-open-repair-orders`](packages/fairdrive-open-repair-orders), [`fairdrive-repair-order-margins`](packages/fairdrive-repair-order-margins), [`fairdrive-comebacks`](packages/fairdrive-comebacks), [`fairdrive-flat-rate-hours`](packages/fairdrive-flat-rate-hours), [`fairdrive-policy-adjustments`](packages/fairdrive-policy-adjustments), [`fairdrive-sublet-invoices`](packages/fairdrive-sublet-invoices), [`fairdrive-parts-obsolescence`](packages/fairdrive-parts-obsolescence), [`fairdrive-parts-receiving`](packages/fairdrive-parts-receiving), [`fairdrive-estimate-vs-invoice`](packages/fairdrive-estimate-vs-invoice), [`fairdrive-insurance-supplements`](packages/fairdrive-insurance-supplements)

**Contabilidade:** [`fairdrive-gl-schedules`](packages/fairdrive-gl-schedules), [`fairdrive-dmv-fees`](packages/fairdrive-dmv-fees), [`fairdrive-sales-tax`](packages/fairdrive-sales-tax)

## Como eles continuam seguros

- **Apenas arquivos locais.** Não entram no DMS, bancos, portais da montadora, órgão de trânsito ou seguradoras; sem rede, sem telemetria.
- **Mascarado antes que o modelo veja.** Nomes, telefones, e-mails, endereços e números de documento dos clientes, e os nomes da equipe (vendedores, técnicos, consultores), viram pseudônimos (`CU-3f9a1c2e`, `ST-8cea1a2d`).
- **Pessoas agem.** Pagar, financiar, emplacar, protocolar, enviar e lançar são recusados; rascunhos e listas de pagamento esperam o clique de uma pessoa nomeada, inclusive no modo Auto.
- **Configurações, não regras fixas.** Prazos, taxas, planos de comissão, alíquotas e limites são confirmados pela sua loja.
- **Sem pareceres de conformidade.** O agente de OFAC e Red Flags só verifica se os registros existem.

## Verificado

812 testes e 559 casos de avaliação, todos aprovados (Windows, Node 24). Entradas hostis e argumentos quebrados: 0 apontamentos. Exportações em nove idiomas são lidas do mesmo jeito. Detalhes em [REVIEW-ver1.md](REVIEW-ver1.md).
