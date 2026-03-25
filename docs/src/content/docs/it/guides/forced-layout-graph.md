---
title: Grafico a layout forzato
description: Doc. grafico layout forzato
---

La visualizzazione **Grafico a layout forzato** è una rappresentazione dinamica e coinvolgente di dati interconnessi. Utilizza un algoritmo di layout diretto dalla forza per trasmettere visivamente le relazioni tra le entità all'interno di un set di dati.

## Struttura dati grafico a layout forzato

Per rappresentare un grafico a layout forzato, è possibile utilizzare la seguente interfaccia `NodeLinkData`:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}

```
### Attributi chiave

- **nome:** un identificatore univoco per il nodo.
- **categoria:** classifica il nodo in un gruppo o cluster specifico.
- **source:** Identifica il nodo di origine del collegamento.
- **target:** Identifica il nodo di destinazione del collegamento.
- **valore:** Rappresenta un valore numerico associato al collegamento che suggerisce quanto sono fortemente connessi i nodi.

### Pro e contro

#### Pro
- **Visualizzazione delle relazioni:** rappresenta chiaramente le relazioni tra entità attraverso nodi e collegamenti connessi.

- **Layout dinamico:** utilizza un layout diretto dalla forza per una rappresentazione organica e visivamente accattivante.

#### Contro
- **Complessità con grafici densi:** nei grafici densamente interconnessi, la confusione visiva può influire sulla leggibilità.

- **Limitato ai dati di rete:** più efficace per visualizzare dati di rete o basati sulle relazioni; potrebbe non essere adatto a tutti i tipi di set di dati.

## Esempio di grafico con layout forzato

![Forced Layout Graph Example](/Illustry-monorepo/forced-layout-graph.gif)
