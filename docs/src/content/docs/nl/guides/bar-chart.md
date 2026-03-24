---
title: Staafdiagram
description: Staafdiagram doc
---

De visualisatie **Staafdiagram** is een veelzijdig en effectief hulpmiddel om categorische gegevens op een visueel aantrekkelijke manier weer te geven. Het maakt gebruik van horizontale of verticale balken om de waarden van verschillende categorieën weer te geven, waardoor gebruikers de gegevensverdelingen gemakkelijk kunnen vergelijken en begrijpen.

## Gegevensstructuur van staafdiagrammen

Om een ​​staafdiagram weer te geven, kunt u de volgende `AxisChartData` interface gebruiken:

```typescript
{{AxisChartData}}
```
### Belangrijkste kenmerken

- **headers:** Een reeks tekenreeksen die de categorieën of dimensies langs een van de assen vertegenwoordigen.
- **waarden:** Een woordenboek waarbij elke sleutel een categorie of dimensie is, en de corresponderende waarde een array van numerieke waarden langs de andere as is.


### Voors en tegens

#### Pluspunten
- **Multidimensionale vergelijking:** Staafdiagrammen blinken uit in het gelijktijdig vergelijken van meerdere dimensies en bieden een uitgebreid overzicht van de gegevens.

- **Duidelijke weergave van waarden:** Numerieke waarden worden duidelijk weergegeven langs zowel de X- als de Y-as, waardoor gebruikers ze gemakkelijk kunnen interpreteren en vergelijken.

#### Nadelen
- **Complexiteit met buitensporige categorieën:** Als u te maken heeft met een groot aantal categorieën of dimensies, kan de visualisatie te druk worden en lastig te interpreteren.

- **Beperkt voor categorische gegevens:** Staafdiagrammen zijn het meest effectief voor numerieke gegevens en zijn mogelijk niet de optimale keuze voor het weergeven van categorische gegevens.

## Voorbeeld van een staafdiagram

![Bar Chart Example](/Illustry-monorepo/bar-chart.gif)
