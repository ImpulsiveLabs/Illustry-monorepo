---
title: Grafico a linee
description: Grafico a linee doc
---

La visualizzazione **Grafico a linee** è uno strumento versatile per rappresentare tendenze e modelli nei dati numerici nel tempo. È ampiamente utilizzato per visualizzare la relazione tra due variabili continue ed evidenziare tendenze o fluttuazioni.

## Struttura dei dati del grafico a linee

Per rappresentare un grafico a linee, puoi utilizzare la seguente interfaccia `AxisChartData`:

```typescript
{{AxisChartData}}
```
### Attributi chiave

- **intestazioni:** un array di stringhe che rappresentano le categorie o le dimensioni lungo uno degli assi.
- **valori:** un dizionario in cui ogni chiave è una categoria o dimensione e il valore corrispondente è una matrice di valori numerici lungo l'altro asse.


### Pro e contro

#### Pro
- **Confronto multidimensionale:** i grafici a linee eccellono nel confrontare più dimensioni contemporaneamente, fornendo una visione completa dei dati.

- **Chiara rappresentazione dei valori:** i valori numerici sono chiaramente rappresentati lungo gli assi X e Y, facilitando l'interpretazione e il confronto da parte degli utenti.

#### Contro
- **Complessità con un numero eccessivo di categorie:** quando si ha a che fare con un numero elevato di categorie o dimensioni, la visualizzazione potrebbe diventare affollata e difficile da interpretare.

- **Limitato per dati categoriali:** i grafici a linee sono più efficaci per i dati numerici e potrebbero non essere la scelta ottimale per rappresentare dati categoriali.

## Esempio di grafico a linee

![Line Chart Example](/Illustry-monorepo/line-chart.gif)
