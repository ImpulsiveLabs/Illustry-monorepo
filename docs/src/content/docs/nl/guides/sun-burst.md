---
title: Zon barst
description: Sun Burst-doc
---

De visualisatie **Sun Burst Chart** is een dynamische en boeiende weergave van hiërarchische gegevens. Het maakt gebruik van een radiale lay-out om de hiërarchie van elementen en hun relaties binnen een dataset over te brengen.


## Sun Burst-gegevensstructuur

Om kaartgegevens weer te geven, kunt u de volgende `HierarchyData` interface gebruiken:

```typescript
{{HierarchyNode}}

{{HierarchyData}}
```
### Belangrijkste kenmerken

- **naam:** De knooppuntnaam.
- **waarde:** Een getal dat een metriek vertegenwoordigt om te bepalen hoe groot dat knooppunt is.
- **categorie:** Beschrijft de categorie of het type waartoe het knooppunt behoort.
- **children:** Deze eigenschap is optioneel en vertegenwoordigt een array van HierarchyNode-objecten. Het betekent dat het knooppunt onderliggende knooppunten kan hebben, waardoor een hiërarchische structuur ontstaat. Elk onderliggend knooppunt volgt dezelfde HierarchyNode-structuur, waardoor de weergave van een boomachtige hiërarchie mogelijk is.

### Voors en tegens

#### Pluspunten
- **Hiërarchisch begrip:** Sunbursts blinken uit in het weergeven van hiërarchische gegevensstructuren en bieden een visuele hiërarchie die helpt bij het begrijpen van relaties tussen verschillende niveaus.

- **Radiale indeling:** De radiale indeling biedt een visueel aantrekkelijke en georganiseerde weergave van hiërarchische structuren.

#### Nadelen
- **Potentiële rommel:** In gevallen met een groot aantal segmenten kan het diagram rommelig worden, wat de leesbaarheid beïnvloedt.

- **Beperkt tot hiërarchische gegevens:** Treemaps zijn het meest effectief bij het visualiseren van hiërarchische gegevens; voor niet-hiërarchische datasets kunnen alternatieve visualisaties geschikter zijn.

## Voorbeeld van een zonnestraal

![Sun Burst Example](/Illustry-monorepo/sun-burst.gif)
