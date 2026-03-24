---
title: Grafico a dispersione
description: Documento di dispersione
---

La visualizzazione **Scatter Plot** è un potente strumento per visualizzare le relazioni tra due variabili numeriche. Utilizza punti su un piano cartesiano per rappresentare singoli punti dati, semplificando l'identificazione di modelli, correlazioni e valori anomali.


## Struttura dei dati del grafico a dispersione

Per rappresentare un grafico a dispersione, è possibile utilizzare la seguente interfaccia `ScatterData`:

```typescript
{{ScatterPoint}}

{{ScatterData}}
```

### Attributi chiave

- **valore:** una matrice di due valori numerici [x, y], che rappresentano le coordinate di un punto dati sugli assi X e Y.
- **valori:** una stringa che indica la categoria o il gruppo a cui appartiene il punto dati.


### Pro e contro

#### Pro
- **Identificazione delle relazioni:** i grafici a dispersione eccellono nel rivelare relazioni, modelli e tendenze tra due variabili numeriche.

- **Rilevamento valori anomali:** i valori anomali, ovvero i punti dati che si discostano in modo significativo dalla norma, possono essere facilmente identificati su un grafico a dispersione.

#### Contro

- **Potenziale sovratracciamento:** nei casi con un'elevata densità di punti dati, potrebbe verificarsi un sovratracciamento, che influisce sulla visibilità dei singoli punti.

## Esempio di grafico a dispersione

![Scatter Plot Example](/Illustry-monorepo/scatter.gif)
