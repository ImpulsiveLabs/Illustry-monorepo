---
title: Sankey-diagram
description: Sankey
---

De visualisatie **Sankey Diagram** is een krachtig hulpmiddel voor het visualiseren van de stroom en relaties tussen entiteiten in een dataset. Het is vooral handig om de distributie en transformatie van waarden binnen een systeem of proces te laten zien.

## Gegevensstructuur van het Sankey-diagram

Om een ​​Sankey-diagram weer te geven, kunt u de volgende `NodeLinkData`-interface gebruiken:

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
- **Stroomweergave:** Visualiseert effectief de stroom van waarden of hoeveelheden tussen entiteiten in een systeem of proces.

- **Inzicht in distributie:** Biedt inzicht in hoe waarden in elke fase worden gedistribueerd en getransformeerd.

#### Nadelen
- **Complexiteit met talrijke knooppunten:** Visuele rommel kan optreden bij een groot aantal knooppunten, wat de leesbaarheid beïnvloedt.

- **Gespecialiseerd gebruiksscenario:** Hoofdzakelijk ontworpen voor het visualiseren van stroom en distributie; is mogelijk niet geschikt voor alle soorten datasets.

## Voorbeeld van een Sankey-diagram

![Sankey Diagram Example](/Illustry-monorepo/sankey.gif)
