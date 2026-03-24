---
title: Scoppio del sole
description: Scoppio del sole doc
---

La visualizzazione **Sun Burst Chart** è una rappresentazione dinamica e coinvolgente dei dati gerarchici. Utilizza un layout radiale per trasmettere la gerarchia degli elementi e le loro relazioni all'interno di un set di dati.


## Struttura dei dati del Sun Burst

Per rappresentare i dati della mappa, puoi utilizzare la seguente interfaccia `HierarchyData`:

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
- **Comprensione gerarchica:** i Sunburst eccellono nella visualizzazione di strutture di dati gerarchiche, fornendo una gerarchia visiva che aiuta a comprendere le relazioni tra i diversi livelli.

- **Layout radiale:** il layout radiale fornisce una rappresentazione visivamente accattivante e organizzata delle strutture gerarchiche.

#### Contro
- **Potenziale disordine:** nei casi con un numero elevato di segmenti, il grafico potrebbe risultare disordinato, compromettendo la leggibilità.

- **Limitato ai dati gerarchici:** le mappe ad albero sono più efficaci quando si visualizzano dati gerarchici; per set di dati non gerarchici, visualizzazioni alternative potrebbero essere più adatte.

## Esempio di scoppio del sole

![Sun Burst Example](/Illustry-monorepo/sun-burst.gif)
