---
title: Kalender
description: Agendadocument
---

De visualisatie **Kalender** is een unieke weergave die is ontworpen om inzicht te geven in temporele relaties binnen een dataset. Het biedt een onderscheidende benadering voor het visualiseren van gebeurtenissen, gebeurtenissen of entiteiten in de loop van de tijd.

## Kalendergegevensstructuur

Om een ​​kalender weer te geven, kunt u de volgende `CalendarData`-interface gebruiken:

```typescript
{{CalendarType}}

{{CalendarData}}
```
### Belangrijkste kenmerken

- **datum:** Een unieke datum van een specifiek jaar.
- **waarde:** Hoe impactvol die datum was voor het evenement.
- **categorie:** Categoriseert de datums in specifieke evenementen.


### Voors en tegens

#### Pluspunten
- **Relatievisualisatie:** De kalendervisualisatie biedt een intuïtieve en gebruiksvriendelijke manier om tijdelijke relaties te verkennen, waardoor het voor gebruikers gemakkelijk wordt om patronen in de loop van de tijd te begrijpen.

- **Compacte weergave:** Een kalender optimaliseert de ruimte door gebeurtenissen in een compact formaat te presenteren, waardoor gebruikers een aanzienlijke hoeveelheid tijdelijke gegevens kunnen bekijken zonder overweldigende beelden.

- **Meerdere jaren:** Als de evenementen plaatsvinden over een periode van meerdere jaren, worden er meer kalendervisualisaties weergegeven.

#### Nadelen
- **Complexiteit met compacte grafieken:** Vanwege het compacte karakter kan een kalender beperkte ruimte bieden voor de details van elke gebeurtenis. In scenario's die uitgebreide informatie vereisen, kunnen aanvullende interacties of aanvullende inzichten noodzakelijk zijn.

- **Niet ideaal voor dichte gebeurtenisoverlappingen:** In gevallen waarin meerdere gebeurtenissen elkaar in de tijd nauw overlappen, kan de visualisatie problemen ondervinden bij het behouden van de duidelijkheid en het voorkomen van overlapgerelateerde visuele rommel.

## Kalendervoorbeeld

![Calendar Example](/Illustry-monorepo/calendar.gif)
