---
title: Imbuto
description: Imbuto doc
---

La visualizzazione **Funnel** è un potente strumento per monitorare la progressione e i tassi di conversione di una serie di fasi di un processo. Fornisce una rappresentazione visiva di come le entità si muovono attraverso le diverse fasi di un flusso di lavoro definito.



## Struttura dei dati della canalizzazione

Per rappresentare una canalizzazione, puoi utilizzare la seguente interfaccia `FunnelData`:

```typescript
{{FunnelData}}
```
### Attributi chiave

- **valori:** un dizionario in cui ogni chiave è una categoria o dimensione e il valore corrispondente è un valore numerico.


### Pro e contro

#### Pro
- **Metriche sulle prestazioni:** i grafici a imbuto sono eccellenti per visualizzare le metriche sulle prestazioni, consentendo ai team di monitorare e migliorare gli indicatori chiave.

- **Analisi segmentata:** ciascuna fase della canalizzazione consente un'analisi segmentata, aiutando a identificare aree specifiche di miglioramento o successo.

- **Approfondimenti predittivi:** i grafici a imbuto possono fornire approfondimenti predittivi sulle prestazioni future in base ai tassi di conversione storici.

#### Contro

- **Sfida con processi complessi:** negli scenari in cui i processi coinvolgono numerosi rami o cicli complessi, i grafici a imbuto potrebbero avere difficoltà a rappresentare la complessità in modo efficace.


## Esempio di imbuto

![Funnel Example](/Illustry-monorepo/funnel.gif)
