---
title: Kreisdiagramm
description: Kreisdiagramm-Dokument
---

Die **Kreisdiagramm**-Visualisierung ist eine prägnante und visuell wirkungsvolle Möglichkeit, die Verteilung von Teilen innerhalb eines Ganzen darzustellen. Es eignet sich besonders gut für die Darstellung von Proportionen und Prozentsätzen im Kreisformat.


## Datenstruktur eines Kreisdiagramms

Um ein Kreisdiagramm darzustellen, können Sie die folgende `PieChartData`-Schnittstelle verwenden:

```typescript
{{PieChartData}}
```
### Schlüsselattribute

- **Werte:** Ein Wörterbuch, in dem jeder Schlüssel eine Kategorie oder Dimension ist und der entsprechende Wert ein numerischer Wert ist.


### Für und Wider

#### Vorteile
- **Prozentuale Darstellung:** Kreisdiagramme bieten eine klare Darstellung des prozentualen Beitrags jeder Kategorie zum Ganzen.

- **Visuelle Einfachheit:** Die kreisförmige Form und Einfachheit von Kreisdiagrammen machen sie für Benutzer auf einen Blick leicht verständlich.

#### Nachteile
- **Begrenzt für viele Kategorien:** Bei der Arbeit mit zahlreichen Kategorien können Kreisdiagramme unübersichtlich und schwierig zu interpretieren werden.


## Beispiel für ein Kreisdiagramm

![Pie Chart Example](/Illustry-monorepo/pie-chart.gif)
