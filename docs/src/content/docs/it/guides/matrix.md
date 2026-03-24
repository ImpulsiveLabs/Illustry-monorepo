---
title: Matrice
description: Matrice doc
---

La visualizzazione **Matrix** è una visualizzazione multidimensionale, in cui i nodi di 2 categorie possono essere visualizzati come complementari l'uno con l'altro

## Struttura dei dati a matrice

Per rappresentare una matrice, puoi utilizzare la seguente interfaccia `NodeLinkData`:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Attributi chiave

- **nome:** un identificatore univoco per il nodo.
- **categoria:** classifica il nodo in un gruppo o cluster specifico.
- **etichette:** sono un array di valori di nome che rappresentano attributi specifici del nodo.
- **source:** Identifica il nodo di origine del collegamento.
- **target:** Identifica il nodo di destinazione del collegamento.
- **valore:** Rappresenta un valore numerico associato al collegamento che suggerisce quanto sono fortemente connessi i nodi.

### Pro e contro

#### Pro
- **Dati di grandi dimensioni:** è possibile visualizzare una quantità molto grande di dati in un'unica finestra.

- **Filtraggio:** Filtraggio sulle righe e sulle colonne.

#### Contro
- **Scorrimento necessario:** è possibile che troppi dati necessitino di uno scorrimento per visualizzarli tutti.


## Esempio di matrice

![Matrix Example](/Illustry-monorepo/matrix.gif)
