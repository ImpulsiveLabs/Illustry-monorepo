---
title: Woordwolk
description: Word cloud-document
---

De **Word Cloud**-visualisatie wordt gebruikt om tekstuele gegevens op een visueel aantrekkelijke en informatieve manier weer te geven. Het verandert woorden in grafische elementen, waarbij de grootte van elk woord de frequentie of het belang ervan in de gegeven dataset aangeeft.

## Gegevensstructuur van Word Cloud

Om een ​​Word Cloud weer te geven, kunt u de volgende `WordCloudData`-interface gebruiken:

```typescript
{{WordType}}

{{WordCloudData}}

```
### Belangrijkste kenmerken

- **naam:** Het woord zelf.
- **waarde:** Een getal dat een statistiek vertegenwoordigt om te bepalen hoe belangrijk dat woord is.


### Voors en tegens

#### Pluspunten
- **Eenvoud:** Word Clouds distilleert tekstuele gegevens in een eenvoudig en visueel toegankelijk formaat.

- **Snelle analyse:** Gebruikers kunnen de belangrijkste woorden snel analyseren en identificeren zonder zich in gedetailleerde tekst te verdiepen.

#### Nadelen
- **Verlies van context:** Hoewel Word Clouds individuele woorden benadrukken, kan het zijn dat ze de context missen die wordt geboden door volledige tekst of complexere visualisaties.

- **Subjectiviteit:** De interpretatie van een woordwolk kan subjectief zijn en het belang van een woord kan van persoon tot persoon verschillen.

## Voorbeeld van een woordwolk

![Word Cloud Example](/Illustry-monorepo/word-cloud.gif)
