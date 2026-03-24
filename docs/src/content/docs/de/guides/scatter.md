---
title: Streudiagramm
description: Scatter-Dokument
---

Die **Streudiagramm**-Visualisierung ist ein leistungsstarkes Werkzeug zur Visualisierung der Beziehungen zwischen zwei numerischen Variablen. Es verwendet Punkte auf einer kartesischen Ebene, um einzelne Datenpunkte darzustellen und erleichtert so die Identifizierung von Mustern, Korrelationen und Ausreißern.


## Datenstruktur des Streudiagramms

Um ein Streudiagramm darzustellen, können Sie die folgende `ScatterData`-Schnittstelle verwenden:

```typescript
{{ScatterPoint}}

{{ScatterData}}
```

### Schlüsselattribute

- **Wert:** Ein Array aus zwei numerischen Werten [x, y], die die Koordinaten eines Datenpunkts auf der X- und Y-Achse darstellen.
- **Werte:** Eine Zeichenfolge, die die Kategorie oder Gruppe angibt, zu der der Datenpunkt gehört.


### Für und Wider

#### Vorteile
- **Beziehungsidentifizierung:** Streudiagramme zeichnen sich dadurch aus, dass sie Beziehungen, Muster und Trends zwischen zwei numerischen Variablen aufdecken.

- **Ausreißererkennung:** Ausreißer oder Datenpunkte, die erheblich von der Norm abweichen, können in einem Streudiagramm leicht identifiziert werden.

#### Nachteile

- **Mögliche Überzeichnung:** In Fällen mit einer hohen Dichte an Datenpunkten kann es zu Überzeichnungen kommen, die die Sichtbarkeit einzelner Punkte beeinträchtigen.

## Beispiel für ein Streudiagramm

![Scatter Plot Example](/Illustry-monorepo/scatter.gif)
