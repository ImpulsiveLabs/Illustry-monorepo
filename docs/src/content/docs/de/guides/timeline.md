---
title: Zeitachse
description: Timeline-Dokument
---

Die **Timeline** ist eine vielseitige Visualisierung, die Ereignisse oder Aktivitäten chronologisch im Zeitverlauf anzeigt. Es bietet einen umfassenden Überblick über historische oder zukünftige Ereignisse und liefert Einblicke in Muster, Dauer und Zusammenhänge.


## Timeline-Datenstruktur

Um Zeitleistendaten darzustellen, können Sie die folgende `TimelineData`-Schnittstelle verwenden:

```typescript
{{TimelineEventTag}}

{{TimelineEvent}}

{{TimelineData}}
```
### Schlüsselattribute

#### TimelineEventTag
- **Name:** Der Name des Tags, das einem Timeline-Ereignis zugeordnet ist.

#### TimelineEvent
- **Zusammenfassung:** Eine kurze Zusammenfassung oder ein Titel der Veranstaltung.
- **Datum:** Das Datum, an dem das Ereignis aufgetreten ist.
- **Typ:** Der Typ oder die Kategorie des Ereignisses.
- **Autor:** Der Autor oder Ersteller der Veranstaltung.
- **Tags:** Ein Array von Tags, die mit dem Ereignis verknüpft sind.
- **Beschreibung:** Eine detaillierte Beschreibung des Ereignisses.

#### TimelineData
- **[Datum]:** Der Datumsschlüssel, der einen bestimmten Datumsbereich darstellt.
  - **Zusammenfassung:**
    - **Titel:** Ein zusammenfassender Titel für den Datumsbereich.
  - **Ereignisse:** Ein Array von `TimelineEvent`-Objekten, die diesem Datum zugeordnet sind.

### Für und Wider

#### Vorteile
- **Chronologisches Verständnis:** Zeitleisten bieten eine chronologische Darstellung von Ereignissen und ermöglichen ein klares Verständnis der Reihenfolge, in der sie stattgefunden haben.

- **Ereigniskategorisierung:** Die Möglichkeit, Ereignisse mithilfe von Tags zu kategorisieren, ermöglicht eine organisierte und effiziente Gruppierung und hilft bei der Analyse bestimmter Ereignistypen.

- **Flexible Visualisierung:** Zeitleisten sind flexibel und können an verschiedene Datentypen angepasst werden, sodass sie für die Darstellung einer Vielzahl von Ereignissen und Aktivitäten geeignet sind.

#### Nachteile
- **Potenzielles Gedränge:** In Zeitleisten mit einer hohen Ereignisdichte besteht die Gefahr visueller Unordnung und potenzieller Schwierigkeiten bei der Unterscheidung einzelner Ereignisse.

- **Eingeschränkt für bestimmte Datentypen:** Zeitleisten sind zwar vielseitig, für die Darstellung bestimmter komplexer Beziehungen oder Datenstrukturen sind sie jedoch möglicherweise nicht besonders effektiv.

- **Subjektivität bei der Bedeutung von Ereignissen:** Die Bedeutung von Ereignissen kann subjektiv sein und ihre Darstellung auf einer Zeitachse erfasst möglicherweise nicht die differenzierte Bedeutung, die von Einzelpersonen wahrgenommen wird.

## Beispiel für eine Zeitleiste

![Timeline Example](/Illustry-monorepo/timeline.gif)
