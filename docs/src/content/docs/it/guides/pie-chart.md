---
title: Grafico a torta
description: Grafico a torta doc
---

La visualizzazione **Grafico a torta** è un modo conciso e di grande impatto visivo per rappresentare la distribuzione delle parti all'interno di un tutto. È particolarmente efficace per visualizzare proporzioni e percentuali in formato circolare.


## Struttura dei dati del grafico a torta

Per rappresentare un grafico a torta, puoi utilizzare la seguente interfaccia `PieChartData`:

```typescript
{{PieChartData}}
```
### Attributi chiave

- **valori:** un dizionario in cui ogni chiave è una categoria o dimensione e il valore corrispondente è un valore numerico.


### Pro e contro

#### Pro
- **Rappresentazione percentuale:** i grafici a torta forniscono una chiara rappresentazione del contributo percentuale di ciascuna categoria all'insieme.

- **Semplicità visiva:** la forma circolare e la semplicità dei grafici a torta li rendono facili da comprendere a colpo d'occhio per gli utenti.

#### Contro
- **Limitato per molte categorie:** Quando si ha a che fare con numerose categorie, i grafici a torta possono diventare affollati e difficili da interpretare.


## Esempio di grafico a torta

![Pie Chart Example](/Illustry-monorepo/pie-chart.gif)
