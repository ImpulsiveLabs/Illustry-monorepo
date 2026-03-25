---
title: Tijdlijn
description: Tijdlijndocument
---

De **Tijdlijn** is een veelzijdige visualisatie die gebeurtenissen of activiteiten chronologisch in de tijd weergeeft. Het biedt een uitgebreid overzicht van historische en toekomstige gebeurtenissen en biedt inzicht in patronen, duur en relaties.


## Tijdlijngegevensstructuur

Om tijdlijngegevens weer te geven, kunt u de volgende `TimelineData`-interface gebruiken:

```typescript
{{TimelineEventTag}}

{{TimelineEvent}}

{{TimelineData}}
```
### Belangrijkste kenmerken

#### TijdlijnEventTag
- **naam:** De naam van de tag die aan een tijdlijngebeurtenis is gekoppeld.

#### TijdlijnGebeurtenis
- **samenvatting:** Een korte samenvatting of titel van het evenement.
- **datum:** De datum waarop de gebeurtenis plaatsvond.
- **type:** Het type of de categorie van de gebeurtenis.
- **auteur:** De auteur of maker van het evenement.
- **tags:** Een reeks tags die aan de gebeurtenis zijn gekoppeld.
- **beschrijving:** Een gedetailleerde beschrijving van het evenement.

#### Tijdlijngegevens
- **[datum]:** De datumsleutel die een specifiek datumbereik vertegenwoordigt.
  - **samenvatting:**
    - **titel:** Een samenvattende titel voor het datumbereik.
  - **gebeurtenissen:** Een array van `TimelineEvent` objecten die aan die datum zijn gekoppeld.

### Voors en tegens

#### Pluspunten
- **Chronologisch begrip:** Tijdlijnen bieden een chronologische weergave van gebeurtenissen en bieden een duidelijk inzicht in de volgorde waarin ze plaatsvonden.

- **Evenementcategorisatie:** De mogelijkheid om evenementen te categoriseren met behulp van tags maakt georganiseerde en efficiënte groepering mogelijk, wat helpt bij de analyse van specifieke soorten evenementen.

- **Flexibele visualisatie:** Tijdlijnen zijn flexibel en kunnen zich aanpassen aan verschillende soorten gegevens, waardoor ze geschikt zijn voor het weergeven van een breed scala aan evenementen en activiteiten.

#### Nadelen
- **Potentiële drukte:** In tijdlijnen met een hoge dichtheid aan gebeurtenissen bestaat het risico op visuele rommel en mogelijke problemen bij het onderscheiden van individuele gebeurtenissen.

- **Beperkt voor bepaalde gegevenstypen:** Hoewel tijdlijnen veelzijdig zijn, zijn ze mogelijk niet het meest effectief voor het weergeven van bepaalde complexe relaties of gegevensstructuren.

- **Subjectiviteit in het belang van gebeurtenissen:** Het belang van gebeurtenissen kan subjectief zijn en hun representatie op een tijdlijn geeft mogelijk niet de genuanceerde betekenis weer die door individuen wordt waargenomen.

## Voorbeeld van een tijdlijn

![Timeline Example](/Illustry-monorepo/timeline.gif)
