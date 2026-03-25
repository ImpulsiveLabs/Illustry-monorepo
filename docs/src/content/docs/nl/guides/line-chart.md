---
title: Lijndiagram
description: Lijndiagram doc
---

De visualisatie **Lijndiagram** is een veelzijdig hulpmiddel voor het weergeven van trends en patronen in numerieke gegevens in de loop van de tijd. Het wordt veel gebruikt voor het visualiseren van de relatie tussen twee continue variabelen en het benadrukken van trends of fluctuaties.

## Gegevensstructuur lijndiagram

Om een ​​lijndiagram weer te geven, kunt u de volgende `AxisChartData` interface gebruiken:

```typescript
{{AxisChartData}}
```
### Belangrijkste kenmerken

- **headers:** Een reeks tekenreeksen die de categorieën of dimensies langs een van de assen vertegenwoordigen.
- **waarden:** Een woordenboek waarbij elke sleutel een categorie of dimensie is, en de corresponderende waarde een array van numerieke waarden langs de andere as is.


### Voors en tegens

#### Pluspunten
- **Multidimensionale vergelijking:** Lijndiagrammen blinken uit in het gelijktijdig vergelijken van meerdere dimensies en bieden een uitgebreid overzicht van de gegevens.

- **Duidelijke weergave van waarden:** Numerieke waarden worden duidelijk weergegeven langs zowel de X- als de Y-as, waardoor gebruikers ze gemakkelijk kunnen interpreteren en vergelijken.

#### Nadelen
- **Complexiteit met buitensporige categorieën:** Als u te maken heeft met een groot aantal categorieën of dimensies, kan de visualisatie te druk worden en lastig te interpreteren.

- **Beperkt voor categorische gegevens:** Lijndiagrammen zijn het meest effectief voor numerieke gegevens en zijn mogelijk niet de optimale keuze voor het weergeven van categorische gegevens.

## Voorbeeld van een lijndiagram

![Line Chart Example](/Illustry-monorepo/line-chart.gif)
