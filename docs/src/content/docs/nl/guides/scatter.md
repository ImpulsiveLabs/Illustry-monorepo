---
title: Verspreidingsdiagram
description: Verspreid document
---

De visualisatie **Scatter Plot** is een krachtig hulpmiddel voor het visualiseren van de relaties tussen twee numerieke variabelen. Het gebruikt punten op een cartesiaans vlak om individuele gegevenspunten weer te geven, waardoor het gemakkelijk wordt om patronen, correlaties en uitschieters te identificeren.


## Gegevensstructuur met spreidingsdiagram

Om een ​​spreidingsdiagram weer te geven, kunt u de volgende `ScatterData` interface gebruiken:

```typescript
{{ScatterPoint}}

{{ScatterData}}
```

### Belangrijkste kenmerken

- **waarde:** Een array van twee numerieke waarden [x, y], die de coördinaten van een gegevenspunt op de X- en Y-as vertegenwoordigen.
- **waarden:** Een tekenreeks die de categorie of groep aangeeft waartoe het gegevenspunt behoort.


### Voors en tegens

#### Pluspunten
- **Relatie-identificatie:** Scatter Plots blinken uit in het onthullen van relaties, patronen en trends tussen twee numerieke variabelen.

- **Detectie van uitschieters:** Uitschieters, of datapunten die aanzienlijk afwijken van de norm, kunnen eenvoudig worden geïdentificeerd op een spreidingsdiagram.

#### Nadelen

- **Potentiële overplotting:** In gevallen met een hoge dichtheid aan gegevenspunten kan overplotting optreden, waardoor de zichtbaarheid van individuele punten wordt beïnvloed.

## Voorbeeld van een spreidingsdiagram

![Scatter Plot Example](/Illustry-monorepo/scatter.gif)
