---
title: Liniendiagramm
description: Liniendiagrammdokument
---

Die Visualisierung **Liniendiagramm** ist ein vielseitiges Werkzeug zur Darstellung von Trends und Mustern in numerischen Daten im Zeitverlauf. Es wird häufig zur Visualisierung der Beziehung zwischen zwei kontinuierlichen Variablen und zur Hervorhebung von Trends oder Schwankungen verwendet.

## Datenstruktur des Liniendiagramms

Zur Darstellung eines Liniendiagramms können Sie die folgende `AxisChartData`-Schnittstelle verwenden:

```typescript
{{AxisChartData}}
```
### Schlüsselattribute

- **Header:** Ein Array von Zeichenfolgen, die die Kategorien oder Dimensionen entlang einer der Achsen darstellen.
- **Werte:** Ein Wörterbuch, in dem jeder Schlüssel eine Kategorie oder Dimension ist und der entsprechende Wert ein Array numerischer Werte entlang der anderen Achse ist.


### Für und Wider

#### Vorteile
- **Mehrdimensionaler Vergleich:** Liniendiagramme zeichnen sich durch den gleichzeitigen Vergleich mehrerer Dimensionen aus und bieten einen umfassenden Überblick über die Daten.

- **Klare Wertdarstellung:** Numerische Werte werden entlang der X- und Y-Achse klar dargestellt, sodass Benutzer sie leicht interpretieren und vergleichen können.

#### Nachteile
- **Komplexität durch übermäßige Kategorien:** Bei der Arbeit mit einer großen Anzahl von Kategorien oder Dimensionen kann die Visualisierung überfüllt und schwierig zu interpretieren sein.

- **Eingeschränkt für kategoriale Daten:** Liniendiagramme sind am effektivsten für numerische Daten und möglicherweise nicht die optimale Wahl für die Darstellung kategorialer Daten.

## Beispiel für ein Liniendiagramm

![Line Chart Example](/Illustry-monorepo/line-chart.gif)
