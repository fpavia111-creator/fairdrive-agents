# Fairdrive

[English](README.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [한국어](README.ko.md)

*Von Claude übersetzt; Prüfung durch Muttersprachler steht aus. Die englische [README](README.md) ist maßgeblich.*

31 kleine MCP-Agenten für Autohäuser (Marken- und freie Händler), Werkstätten und Karosseriebetriebe. Jeder Agent hat **eine Aufgabe**, liest die Dateien, die Ihr DMS, Ihr Werkstattsystem, Ihr Kalkulationssystem, Ihr Einkaufsfinanzierer oder der Hersteller bereits exportiert, und schreibt eine Arbeitsliste: was fehlt, zu spät ist, zu wenig bezahlt wurde oder nicht stimmt.

MIT-Lizenz · Node 20 oder neuer · nur lokale Dateien · keine Zugangsdaten · nur fiktive Testdaten

Einrichtung als Festpreis-Paket: [Fairdrive](https://fair-agents.com/fairdrive.html).

## Ausprobieren

```bash
npm install
npm test
node packages/fairdrive-floorplan-audit/bin/fairdrive-floorplan-audit.js demo
node packages/fairdrive-contracts-in-transit/bin/fairdrive-contracts-in-transit.js demo
```

Jeder Agent hat eine `demo` mit fiktiven Dateien, ein `eval` mit eigenen Testfällen und einen MCP-Server (`<agent> mcp --root <ordner>`).

## Die Agenten

**Verkäufe und F&I:** [`fairdrive-deal-jackets`](packages/fairdrive-deal-jackets), [`fairdrive-contracts-in-transit`](packages/fairdrive-contracts-in-transit), [`fairdrive-finance-reserve`](packages/fairdrive-finance-reserve), [`fairdrive-product-cancellations`](packages/fairdrive-product-cancellations), [`fairdrive-service-contract-remittances`](packages/fairdrive-service-contract-remittances), [`fairdrive-ofac-red-flags`](packages/fairdrive-ofac-red-flags), [`fairdrive-customer-deposits`](packages/fairdrive-customer-deposits), [`fairdrive-we-owes`](packages/fairdrive-we-owes), [`fairdrive-sales-commissions`](packages/fairdrive-sales-commissions)

**Fahrzeuge und Einkaufsfinanzierung:** [`fairdrive-floorplan-audit`](packages/fairdrive-floorplan-audit), [`fairdrive-curtailments`](packages/fairdrive-curtailments), [`fairdrive-used-vehicle-aging`](packages/fairdrive-used-vehicle-aging), [`fairdrive-reconditioning`](packages/fairdrive-reconditioning), [`fairdrive-loaner-fleet`](packages/fairdrive-loaner-fleet), [`fairdrive-trade-payoffs`](packages/fairdrive-trade-payoffs), [`fairdrive-title-tracking`](packages/fairdrive-title-tracking), [`fairdrive-incentive-claims`](packages/fairdrive-incentive-claims)

**Service, Teile und Karosserie:** [`fairdrive-warranty-claims`](packages/fairdrive-warranty-claims), [`fairdrive-open-repair-orders`](packages/fairdrive-open-repair-orders), [`fairdrive-repair-order-margins`](packages/fairdrive-repair-order-margins), [`fairdrive-comebacks`](packages/fairdrive-comebacks), [`fairdrive-flat-rate-hours`](packages/fairdrive-flat-rate-hours), [`fairdrive-policy-adjustments`](packages/fairdrive-policy-adjustments), [`fairdrive-sublet-invoices`](packages/fairdrive-sublet-invoices), [`fairdrive-parts-obsolescence`](packages/fairdrive-parts-obsolescence), [`fairdrive-parts-receiving`](packages/fairdrive-parts-receiving), [`fairdrive-estimate-vs-invoice`](packages/fairdrive-estimate-vs-invoice), [`fairdrive-insurance-supplements`](packages/fairdrive-insurance-supplements)

**Buchhaltung:** [`fairdrive-gl-schedules`](packages/fairdrive-gl-schedules), [`fairdrive-dmv-fees`](packages/fairdrive-dmv-fees), [`fairdrive-sales-tax`](packages/fairdrive-sales-tax)

## Wie sie sicher bleiben

- **Nur lokale Dateien.** Keine Anmeldung bei DMS, Banken, Herstellerportalen, Zulassungsstellen oder Versicherern; kein Netzwerk, keine Telemetrie.
- **Maskiert, bevor das Modell es sieht.** Kundennamen, Telefonnummern, E-Mails, Adressen und Ausweisnummern werden zu Pseudonymen (`CU-3f9a1c2e`).
- **Menschen handeln.** Zahlen, Finanzieren, Zulassen, Einreichen, Senden und Buchen verweigert jeder Agent; Entwürfe und Zahllisten warten auf den Klick einer namentlich genannten Person, auch im Auto-Modus.
- **Einstellungen statt fester Regeln.** Tage, Sätze, Provisionspläne, Steuersätze und Grenzen bestätigt Ihr Betrieb.
- **Keine Compliance-Urteile.** Der OFAC- und Red-Flags-Agent prüft nur, ob Nachweise vorliegen.

## Geprüft

812 Tests und 559 Eval-Fälle, alle bestanden (Windows, Node 24). Feindliche Eingaben und kaputte Argumente: 0 Befunde. Exporte in neun Sprachen werden gleich gelesen. Details in [REVIEW-ver1.md](REVIEW-ver1.md).
