---
title: Calendario
description: Documento calendario
---

La visualizzazione **Calendario** è una rappresentazione unica progettata per fornire informazioni dettagliate sulle relazioni temporali all'interno di un set di dati. Offre un approccio distintivo alla visualizzazione di eventi, occorrenze o entità nel tempo.

## Struttura dei dati del calendario

Per rappresentare un calendario, puoi utilizzare la seguente interfaccia `CalendarData`:

```typescript
{{CalendarType}}

{{CalendarData}}
```
### Attributi chiave

- **data:** una data univoca di un anno specifico.
- **valore:** quanto impatto ha avuto quella data per l'evento.
- **categoria:** classifica le date in eventi specifici.


### Pro e contro

#### Pro
- **Visualizzazione delle relazioni:** la visualizzazione del calendario fornisce un modo intuitivo e facile da usare per esplorare le relazioni temporali, consentendo agli utenti di comprendere facilmente i modelli nel tempo.

- **Rappresentazione compatta:** un calendario ottimizza lo spazio presentando gli eventi in un formato compatto, consentendo agli utenti di visualizzare una quantità significativa di dati temporali senza immagini sovraccariche.

- **Più anni:** se gli eventi si verificano in un arco di tempo pluriennale verranno visualizzate più visualizzazioni del calendario.

#### Contro
- **Complessità con grafici densi:** a causa della sua natura compatta, un calendario può fornire uno spazio limitato per i dettagli di ciascun evento. Negli scenari che richiedono informazioni estese, potrebbero essere necessarie interazioni aggiuntive o visualizzazioni supplementari.

- **Non ideale per sovrapposizioni di eventi fitti:** nei casi in cui più eventi si sovrappongono strettamente nel tempo, la visualizzazione potrebbe incontrare difficoltà nel mantenere la chiarezza e prevenire la confusione visiva correlata alla sovrapposizione.

## Esempio di calendario

![Calendar Example](/Illustry-monorepo/calendar.gif)
