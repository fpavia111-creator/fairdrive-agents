# Fairdrive

[English](README.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [한국어](README.ko.md)

*Traducido por Claude; pendiente de revisión por un hablante nativo. El [README](README.md) en inglés es el que vale.*

31 pequeños agentes MCP para concesionarios (oficiales e independientes), talleres mecánicos y talleres de chapa y pintura. Cada agente tiene **una sola tarea**, lee los archivos que su DMS, su sistema de taller, su sistema de presupuestos, su financiera de plan de piso o el fabricante ya exportan, y escribe una lista de trabajo: lo que falta, llega tarde, se pagó de menos o está mal.

Licencia MIT · Node 20 o superior · solo archivos locales · sin credenciales · solo datos de prueba ficticios

Puesta en marcha a precio fijo: [Fairdrive](https://fair-agents.com/fairdrive.html).

## Probar

```bash
npm install
npm test
node packages/fairdrive-floorplan-audit/bin/fairdrive-floorplan-audit.js demo
node packages/fairdrive-contracts-in-transit/bin/fairdrive-contracts-in-transit.js demo
```

Cada agente tiene una `demo` con archivos ficticios, un `eval` con sus propios casos de prueba y un servidor MCP (`<agent> mcp --root <carpeta>`).

## Los agentes

**Ventas y F&I:** [`fairdrive-deal-jackets`](packages/fairdrive-deal-jackets), [`fairdrive-contracts-in-transit`](packages/fairdrive-contracts-in-transit), [`fairdrive-finance-reserve`](packages/fairdrive-finance-reserve), [`fairdrive-product-cancellations`](packages/fairdrive-product-cancellations), [`fairdrive-service-contract-remittances`](packages/fairdrive-service-contract-remittances), [`fairdrive-ofac-red-flags`](packages/fairdrive-ofac-red-flags), [`fairdrive-customer-deposits`](packages/fairdrive-customer-deposits), [`fairdrive-we-owes`](packages/fairdrive-we-owes), [`fairdrive-sales-commissions`](packages/fairdrive-sales-commissions)

**Vehículos y plan de piso:** [`fairdrive-floorplan-audit`](packages/fairdrive-floorplan-audit), [`fairdrive-curtailments`](packages/fairdrive-curtailments), [`fairdrive-used-vehicle-aging`](packages/fairdrive-used-vehicle-aging), [`fairdrive-reconditioning`](packages/fairdrive-reconditioning), [`fairdrive-loaner-fleet`](packages/fairdrive-loaner-fleet), [`fairdrive-trade-payoffs`](packages/fairdrive-trade-payoffs), [`fairdrive-title-tracking`](packages/fairdrive-title-tracking), [`fairdrive-incentive-claims`](packages/fairdrive-incentive-claims)

**Servicio, repuestos y chapa:** [`fairdrive-warranty-claims`](packages/fairdrive-warranty-claims), [`fairdrive-open-repair-orders`](packages/fairdrive-open-repair-orders), [`fairdrive-repair-order-margins`](packages/fairdrive-repair-order-margins), [`fairdrive-comebacks`](packages/fairdrive-comebacks), [`fairdrive-flat-rate-hours`](packages/fairdrive-flat-rate-hours), [`fairdrive-policy-adjustments`](packages/fairdrive-policy-adjustments), [`fairdrive-sublet-invoices`](packages/fairdrive-sublet-invoices), [`fairdrive-parts-obsolescence`](packages/fairdrive-parts-obsolescence), [`fairdrive-parts-receiving`](packages/fairdrive-parts-receiving), [`fairdrive-estimate-vs-invoice`](packages/fairdrive-estimate-vs-invoice), [`fairdrive-insurance-supplements`](packages/fairdrive-insurance-supplements)

**Contabilidad:** [`fairdrive-gl-schedules`](packages/fairdrive-gl-schedules), [`fairdrive-dmv-fees`](packages/fairdrive-dmv-fees), [`fairdrive-sales-tax`](packages/fairdrive-sales-tax)

## Cómo se mantienen seguros

- **Solo archivos locales.** No inician sesión en el DMS, bancos, portales del fabricante, la oficina de tránsito ni aseguradoras; sin red ni telemetría.
- **Enmascarado antes de que el modelo lo vea.** Nombres, teléfonos, correos, direcciones y números de identificación de clientes se vuelven seudónimos (`CU-3f9a1c2e`).
- **Las personas actúan.** Pagar, financiar, titular, presentar, enviar y contabilizar se rechazan; borradores y listas de pago esperan el clic de una persona con nombre, también en modo Auto.
- **Ajustes, no reglas fijas.** Días, tasas, planes de comisión, tasas de impuesto y límites los confirma su negocio.
- **Sin dictámenes de cumplimiento.** El agente de OFAC y Red Flags solo comprueba que los registros existan.

## Comprobado

812 pruebas y 559 casos de evaluación, todos aprobados (Windows, Node 24). Entradas hostiles y argumentos rotos: 0 hallazgos. Las exportaciones en nueve idiomas se leen igual. Detalles en [REVIEW-ver1.md](REVIEW-ver1.md).
