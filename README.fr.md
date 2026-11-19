# Fairdrive

[English](README.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [한국어](README.ko.md)

*Traduit par Claude ; relecture par un locuteur natif en attente. Le [README](README.md) anglais fait foi.*

31 petits agents MCP pour les concessionnaires (de marque ou indépendants), les garages et les carrosseries. Chaque agent a **une seule tâche**, lit les fichiers que votre DMS, votre logiciel d’atelier, votre outil de chiffrage, votre financeur de stock ou le constructeur exportent déjà, et rédige une liste de travail : ce qui manque, est en retard, est payé en moins ou est faux.

Licence MIT · Node 20 ou plus récent · fichiers locaux uniquement · aucun identifiant · données de test fictives

Mise en place à prix fixe: [Fairdrive](https://fair-agents.com/fairdrive.html).

## Essayer

```bash
npm install
npm test
node packages/fairdrive-floorplan-audit/bin/fairdrive-floorplan-audit.js demo
node packages/fairdrive-contracts-in-transit/bin/fairdrive-contracts-in-transit.js demo
```

Chaque agent a une `demo` sur des fichiers fictifs, un `eval` avec ses propres cas de test et un serveur MCP (`<agent> mcp --root <dossier>`).

## Les agents

**Ventes et F&I:** [`fairdrive-deal-jackets`](packages/fairdrive-deal-jackets), [`fairdrive-contracts-in-transit`](packages/fairdrive-contracts-in-transit), [`fairdrive-finance-reserve`](packages/fairdrive-finance-reserve), [`fairdrive-product-cancellations`](packages/fairdrive-product-cancellations), [`fairdrive-service-contract-remittances`](packages/fairdrive-service-contract-remittances), [`fairdrive-ofac-red-flags`](packages/fairdrive-ofac-red-flags), [`fairdrive-customer-deposits`](packages/fairdrive-customer-deposits), [`fairdrive-we-owes`](packages/fairdrive-we-owes), [`fairdrive-sales-commissions`](packages/fairdrive-sales-commissions)

**Véhicules et financement de stock:** [`fairdrive-floorplan-audit`](packages/fairdrive-floorplan-audit), [`fairdrive-curtailments`](packages/fairdrive-curtailments), [`fairdrive-used-vehicle-aging`](packages/fairdrive-used-vehicle-aging), [`fairdrive-reconditioning`](packages/fairdrive-reconditioning), [`fairdrive-loaner-fleet`](packages/fairdrive-loaner-fleet), [`fairdrive-trade-payoffs`](packages/fairdrive-trade-payoffs), [`fairdrive-title-tracking`](packages/fairdrive-title-tracking), [`fairdrive-incentive-claims`](packages/fairdrive-incentive-claims)

**Atelier, pièces et carrosserie:** [`fairdrive-warranty-claims`](packages/fairdrive-warranty-claims), [`fairdrive-open-repair-orders`](packages/fairdrive-open-repair-orders), [`fairdrive-repair-order-margins`](packages/fairdrive-repair-order-margins), [`fairdrive-comebacks`](packages/fairdrive-comebacks), [`fairdrive-flat-rate-hours`](packages/fairdrive-flat-rate-hours), [`fairdrive-policy-adjustments`](packages/fairdrive-policy-adjustments), [`fairdrive-sublet-invoices`](packages/fairdrive-sublet-invoices), [`fairdrive-parts-obsolescence`](packages/fairdrive-parts-obsolescence), [`fairdrive-parts-receiving`](packages/fairdrive-parts-receiving), [`fairdrive-estimate-vs-invoice`](packages/fairdrive-estimate-vs-invoice), [`fairdrive-insurance-supplements`](packages/fairdrive-insurance-supplements)

**Comptabilité:** [`fairdrive-gl-schedules`](packages/fairdrive-gl-schedules), [`fairdrive-dmv-fees`](packages/fairdrive-dmv-fees), [`fairdrive-sales-tax`](packages/fairdrive-sales-tax)

## Comment ils restent sûrs

- **Fichiers locaux uniquement.** Aucune connexion au DMS, aux banques, aux portails constructeur, à l’administration ou aux assureurs ; pas de réseau, pas de télémétrie.
- **Masqué avant que le modèle ne le voie.** Noms, téléphones, e-mails, adresses et numéros d’identité des clients, ainsi que les noms du personnel (vendeurs, techniciens, conseillers), deviennent des pseudonymes (`CU-3f9a1c2e`, `ST-8cea1a2d`).
- **Les personnes agissent.** Payer, financer, immatriculer, déposer, envoyer et comptabiliser sont refusés ; brouillons et listes de paiement attendent le clic d’une personne nommée, même en mode Auto.
- **Des réglages, pas des règles figées.** Délais, taux, plans de commission, taux de taxe et limites sont confirmés par votre établissement.
- **Aucun avis de conformité.** L’agent OFAC et Red Flags vérifie seulement que les justificatifs existent.

## Vérifié

816 tests et 559 cas d’évaluation, tous réussis (Windows, Node 24). Entrées hostiles et arguments cassés : 0 constat. Les exports en neuf langues sont lus de la même façon. Détails dans [REVIEW-ver1.md](REVIEW-ver1.md).
