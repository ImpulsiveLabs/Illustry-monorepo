---
title: Edge bundling gerarchico
description: Edge bundling gerarchico doc
---

La visualizzazione **Hierarchical Edge Bundling** è una tecnica sofisticata per rappresentare relazioni e connessioni gerarchiche all'interno di un set di dati. Sfrutta il raggruppamento dei bordi per ridurre l'ingombro visivo evidenziando al tempo stesso la struttura delle relazioni in modo gerarchico.

## Struttura gerarchica dei dati dell'Edge Bundling

Per rappresentare un Edge Bundling gerarchico, è possibile utilizzare la seguente interfaccia `NodeLinkData`:

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
- **Estetica e leggibilità migliorate:** i bordi raggruppati contribuiscono a una visualizzazione più pulita ed esteticamente gradevole. Riducendo l'ingombro visivo, gli utenti possono interpretare più facilmente le relazioni tra i nodi, migliorando la leggibilità complessiva.

- **Maggiore attenzione alle relazioni chiave:** L'edge bundling consente agli utenti di concentrarsi sulle relazioni chiave all'interno della struttura gerarchica, enfatizzando le connessioni più significative. Ciò può aiutare a identificare percorsi critici o nodi centrali in set di dati complessi.

#### Contro
- **Difficoltà nell'identificazione di percorsi paralleli:** L'identificazione di percorsi paralleli o connessioni in un'area densamente raggruppata può rappresentare una sfida per gli utenti. Distinguere tra bordi ravvicinati che rappresentano relazioni diverse può essere complesso, influenzando la precisione dell'analisi.

- **Sfide con la percezione della direzionalità:** gli utenti potrebbero avere difficoltà a percepire la direzionalità dei bordi raggruppati, in particolare in scenari in cui è presente un elevato grado di sovrapposizione. Ciò può influire sull'interpretazione accurata del flusso delle relazioni.

## Esempio di raggruppamento di edge gerarchico

![Hierarchical Edge Bundling Example](/Illustry-monorepo/hierarchical-edge-bundling.gif)
