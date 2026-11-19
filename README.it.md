# Fairdrive

[English](README.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [한국어](README.ko.md)

*Tradotto da Claude; revisione di un madrelingua in attesa. Fa fede il [README](README.md) inglese.*

31 piccoli agenti MCP per concessionari (ufficiali e indipendenti), officine e carrozzerie. Ogni agente ha **un solo compito**, legge i file che il vostro DMS, il gestionale d’officina, il sistema di preventivazione, il finanziatore delle scorte o la casa madre esportano già, e scrive un elenco di lavoro: cosa manca, è in ritardo, è pagato meno del dovuto o è sbagliato.

Licenza MIT · Node 20 o successivo · solo file locali · nessuna credenziale · solo dati di prova fittizi

Messa in opera a prezzo fisso: [Fairdrive](https://fair-agents.com/fairdrive.html).

## Provare

```bash
npm install
npm test
node packages/fairdrive-floorplan-audit/bin/fairdrive-floorplan-audit.js demo
node packages/fairdrive-contracts-in-transit/bin/fairdrive-contracts-in-transit.js demo
```

Ogni agente ha una `demo` su file fittizi, un `eval` con i propri casi di prova e un server MCP (`<agent> mcp --root <cartella>`).

## Gli agenti

**Vendite e F&I:** [`fairdrive-deal-jackets`](packages/fairdrive-deal-jackets), [`fairdrive-contracts-in-transit`](packages/fairdrive-contracts-in-transit), [`fairdrive-finance-reserve`](packages/fairdrive-finance-reserve), [`fairdrive-product-cancellations`](packages/fairdrive-product-cancellations), [`fairdrive-service-contract-remittances`](packages/fairdrive-service-contract-remittances), [`fairdrive-ofac-red-flags`](packages/fairdrive-ofac-red-flags), [`fairdrive-customer-deposits`](packages/fairdrive-customer-deposits), [`fairdrive-we-owes`](packages/fairdrive-we-owes), [`fairdrive-sales-commissions`](packages/fairdrive-sales-commissions)

**Veicoli e finanziamento scorte:** [`fairdrive-floorplan-audit`](packages/fairdrive-floorplan-audit), [`fairdrive-curtailments`](packages/fairdrive-curtailments), [`fairdrive-used-vehicle-aging`](packages/fairdrive-used-vehicle-aging), [`fairdrive-reconditioning`](packages/fairdrive-reconditioning), [`fairdrive-loaner-fleet`](packages/fairdrive-loaner-fleet), [`fairdrive-trade-payoffs`](packages/fairdrive-trade-payoffs), [`fairdrive-title-tracking`](packages/fairdrive-title-tracking), [`fairdrive-incentive-claims`](packages/fairdrive-incentive-claims)

**Officina, ricambi e carrozzeria:** [`fairdrive-warranty-claims`](packages/fairdrive-warranty-claims), [`fairdrive-open-repair-orders`](packages/fairdrive-open-repair-orders), [`fairdrive-repair-order-margins`](packages/fairdrive-repair-order-margins), [`fairdrive-comebacks`](packages/fairdrive-comebacks), [`fairdrive-flat-rate-hours`](packages/fairdrive-flat-rate-hours), [`fairdrive-policy-adjustments`](packages/fairdrive-policy-adjustments), [`fairdrive-sublet-invoices`](packages/fairdrive-sublet-invoices), [`fairdrive-parts-obsolescence`](packages/fairdrive-parts-obsolescence), [`fairdrive-parts-receiving`](packages/fairdrive-parts-receiving), [`fairdrive-estimate-vs-invoice`](packages/fairdrive-estimate-vs-invoice), [`fairdrive-insurance-supplements`](packages/fairdrive-insurance-supplements)

**Contabilità:** [`fairdrive-gl-schedules`](packages/fairdrive-gl-schedules), [`fairdrive-dmv-fees`](packages/fairdrive-dmv-fees), [`fairdrive-sales-tax`](packages/fairdrive-sales-tax)

## Come restano sicuri

- **Solo file locali.** Nessun accesso a DMS, banche, portali della casa madre, motorizzazione o assicurazioni; niente rete, niente telemetria.
- **Mascherato prima che il modello lo veda.** Nomi, telefoni, e-mail, indirizzi e numeri di documento dei clienti, e i nomi del personale (venditori, tecnici, accettatori), diventano pseudonimi (`CU-3f9a1c2e`, `ST-8cea1a2d`).
- **Agiscono le persone.** Pagare, finanziare, immatricolare, presentare, inviare e registrare sono rifiutati; bozze e distinte di pagamento attendono il clic di una persona indicata per nome, anche in modalità Auto.
- **Impostazioni, non regole fisse.** Giorni, tassi, piani provvigionali, aliquote e limiti li conferma la vostra azienda.
- **Nessun giudizio di conformità.** L’agente OFAC e Red Flags controlla solo che le registrazioni esistano.

## Verificato

816 test e 559 casi di valutazione, tutti superati (Windows, Node 24). Input ostili e argomenti malformati: 0 rilievi. Le esportazioni in nove lingue sono lette allo stesso modo. Dettagli in [REVIEW-ver1.md](REVIEW-ver1.md).
