---
title: Boomkaart
description: Boomkaart doc
---

De visualisatie **Boomkaart** is een dynamische en hiërarchische manier om gegevens weer te geven en biedt een duidelijk overzicht van complexe structuren. Door gebruik te maken van geneste rechthoeken visualiseert de Treemap op efficiënte wijze hiërarchische gegevensrelaties, waardoor het een hulpmiddel van onschatbare waarde is voor het overbrengen van zowel het geheel als de delen binnen een dataset.

## Gegevensstructuur van boomkaart

Om boomkaartgegevens weer te geven, kunt u de volgende `HierarchyData`-interface gebruiken:

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
- **Hiërarchisch begrip:** Boomkaarten blinken uit in het weergeven van hiërarchische gegevensstructuren en bieden een visuele hiërarchie die helpt bij het begrijpen van relaties tussen verschillende niveaus.

- **Proportionele weergave:** De proportionele grootte van rechthoeken maakt een intuïtieve weergave van de relatieve waarden of grootten van verschillende gegevenscategorieën mogelijk.

- **Ruimte-efficiëntie:** Treemaps maken efficiënt gebruik van de ruimte, waardoor gebruikers grote datasets kunnen visualiseren zonder het scherm onoverzichtelijk te maken.

- **Snelle identificatie van patronen:** Gebruikers kunnen snel patronen, uitschieters en concentraties binnen de dataset identificeren via de visuele rangschikking van rechthoeken.

#### Nadelen
- **Complexiteit met overlappende labels:** In gevallen waarin labels elkaar overlappen, vooral in dichtbevolkte boomkaarten, kan de leesbaarheid een uitdaging zijn.

- **Moeilijkheid bij precisie:** Hoewel boomkaarten een breed overzicht bieden, kan het realiseren van nauwkeurige vergelijkingen tussen individuele gegevenspunten een uitdaging zijn vanwege de hiërarchische aard.

- **Beperkt tot hiërarchische gegevens:** Treemaps zijn het meest effectief bij het visualiseren van hiërarchische gegevens; voor niet-hiërarchische datasets kunnen alternatieve visualisaties geschikter zijn.

## Voorbeeld van een boomkaart

![Tree Map Example](/Illustry-monorepo/tree-map.gif)
