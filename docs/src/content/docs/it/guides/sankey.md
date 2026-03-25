---
title: Diagramma di Sankey
description: Sankey
---

La visualizzazione **Sankey Diagram** è un potente strumento per visualizzare il flusso e le relazioni tra le entità in un set di dati. È particolarmente utile per mostrare la distribuzione e la trasformazione dei valori attraverso un sistema o processo.

## Struttura dei dati del diagramma di Sankey

Per rappresentare un diagramma Sankey, puoi utilizzare la seguente interfaccia `NodeLinkData`:

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
- **Rappresentazione del flusso:** visualizza in modo efficace il flusso di valori o quantità tra entità in un sistema o processo.

- **Approfondimento sulla distribuzione:** Offre approfondimenti su come i valori vengono distribuiti e trasformati in ogni fase.

#### Contro
- **Complessità con numerosi nodi:** possono verificarsi disordini visivi con un numero elevato di nodi, che influiscono sulla leggibilità.

- **Caso d'uso specializzato:** Progettato principalmente per visualizzare il flusso e la distribuzione; potrebbe non essere adatto a tutti i tipi di set di dati.

## Esempio di diagramma di Sankey

![Sankey Diagram Example](/Illustry-monorepo/sankey.gif)
