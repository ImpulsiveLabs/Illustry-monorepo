---
title: Geforceerde lay-outgrafiek
description: Geforceerde lay-outgrafiek doc
---

De visualisatie **Forced Layout Graph** is een dynamische en boeiende weergave van onderling verbonden gegevens. Het maakt gebruik van een force-directed layout-algoritme om de relaties tussen entiteiten binnen een dataset visueel over te brengen.

## Geforceerde lay-out Grafiekgegevensstructuur

Om een ​​Forced Layout Graph weer te geven, kunt u de volgende `NodeLinkData` interface gebruiken:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}

```
### Belangrijkste kenmerken

- **naam:** Een unieke identificatie voor het knooppunt.
- **categorie:** Categoriseert het knooppunt in een specifieke groep of cluster.
- **bron:** Identificeert het bronknooppunt van de link.
- **doel:** Identificeert het doelknooppunt van de link.
- **waarde:** vertegenwoordigt een numerieke waarde die aan de link is gekoppeld en die aangeeft hoe sterk de knooppunten zijn verbonden.

### Voors en tegens

#### Pluspunten
- **Relatievisualisatie:** Geeft duidelijk de relaties tussen entiteiten weer via verbonden knooppunten en links.

- **Dynamische lay-out:** Maakt gebruik van een geforceerde lay-out voor een organische en visueel aantrekkelijke weergave.

#### Nadelen
- **Complexiteit met compacte grafieken:** In nauw met elkaar verbonden grafieken kan visuele rommel de leesbaarheid beïnvloeden.

- **Beperkt tot netwerkgegevens:** Meest effectief voor het visualiseren van netwerk- of relatiegebaseerde gegevens; is mogelijk niet geschikt voor alle soorten datasets.

## Voorbeeld van geforceerde lay-outgrafiek

![Forced Layout Graph Example](/Illustry-monorepo/forced-layout-graph.gif)
