---
title: Nuvola di parole
description: Documento Word cloud
---

La visualizzazione **Word Cloud** viene utilizzata per rappresentare dati testuali in modo visivamente accattivante e informativo. Trasforma le parole in elementi grafici, con la dimensione di ciascuna parola che ne indica la frequenza o l'importanza nel dataset di dati.

## Struttura dei dati della nuvola di parole

Per rappresentare una Word Cloud, puoi utilizzare la seguente interfaccia `WordCloudData`:

```typescript
{{WordType}}

{{WordCloudData}}

```
### Attributi chiave

- **nome:** La parola stessa.
- **valore:** un numero che rappresenta una metrica per determinare quanto sia importante quella parola.


### Pro e contro

#### Pro
- **Semplicità:** Word Clouds distilla i dati testuali in un formato semplice e visivamente accessibile.

- **Analisi rapida:** gli utenti possono analizzare e identificare rapidamente le parole più significative senza approfondire il testo dettagliato.

#### Contro
- **Perdita di contesto:** sebbene le Word Cloud evidenzino singole parole, potrebbero non avere il contesto fornito dal testo completo o da visualizzazioni più complesse.

- **Soggettività:** l'interpretazione di una nuvola di parole può essere soggettiva e l'importanza di una parola può variare da individuo a individuo.

## Esempio di nuvola di parole

![Word Cloud Example](/Illustry-monorepo/word-cloud.gif)
