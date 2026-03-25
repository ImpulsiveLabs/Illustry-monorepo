---
title: Mappa dell'albero
description: Mappa dell'albero doc
---

La visualizzazione **Mappa ad albero** è un modo dinamico e gerarchico di rappresentare i dati che fornisce una chiara panoramica di strutture complesse. Utilizzando rettangoli nidificati, la Treemap visualizza in modo efficiente le relazioni gerarchiche dei dati, rendendola uno strumento prezioso per convogliare sia il tutto che le parti all'interno di un set di dati.

## Struttura dei dati della mappa ad albero

Per rappresentare i dati di una mappa ad albero, è possibile utilizzare la seguente interfaccia `HierarchyData`:

```typescript
{{HierarchyNode}}

{{HierarchyData}}
```
### Attributi chiave

- **nome:** il nome del nodo.
- **valore:** un numero che rappresenta una metrica per determinare quanto è grande il nodo.
- **categoria:** Descrive la categoria o il tipo a cui appartiene il nodo.
- **bambini:** questa proprietà è facoltativa e rappresenta un array di oggetti HierarchyNode. Significa che il nodo può avere nodi figli, creando una struttura gerarchica. Ogni nodo figlio segue la stessa struttura HierarchyNode, consentendo la rappresentazione di una gerarchia ad albero.

### Pro e contro

#### Pro
- **Comprensione gerarchica:** le mappe ad albero eccellono nella visualizzazione di strutture di dati gerarchiche, fornendo una gerarchia visiva che aiuta a comprendere le relazioni tra i diversi livelli.

- **Rappresentazione proporzionale:** il dimensionamento proporzionale dei rettangoli consente una rappresentazione intuitiva dei valori o delle dimensioni relativi delle diverse categorie di dati.

- **Efficienza dello spazio:** le mappe ad albero utilizzano in modo efficiente lo spazio, consentendo agli utenti di visualizzare set di dati di grandi dimensioni senza ingombrare lo schermo.

- **Identificazione rapida dei modelli:** gli utenti possono identificare rapidamente modelli, valori anomali e concentrazioni all'interno del set di dati attraverso la disposizione visiva dei rettangoli.

#### Contro
- **Complessità con etichette sovrapposte:** nei casi in cui le etichette si sovrappongono, soprattutto in mappe ad albero densamente popolate, la leggibilità può rappresentare una sfida.

- **Difficoltà di precisione:** sebbene le mappe ad albero forniscano un'ampia panoramica, ottenere confronti precisi tra singoli punti dati potrebbe essere difficile a causa della natura gerarchica.

- **Limitato ai dati gerarchici:** le mappe ad albero sono più efficaci quando si visualizzano dati gerarchici; per set di dati non gerarchici, visualizzazioni alternative potrebbero essere più adatte.

## Esempio di mappa ad albero

![Tree Map Example](/Illustry-monorepo/tree-map.gif)
