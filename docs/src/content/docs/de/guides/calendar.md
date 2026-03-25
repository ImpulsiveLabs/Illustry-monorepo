---
title: Kalender
description: Kalender doc
---

Die **Calendar**-Visualisierung ist eine einzigartige Darstellung, die einen Einblick in zeitliche Zusammenhänge innerhalb eines Datensatzes ermöglicht. Es bietet einen markanten Ansatz zur Visualisierung von Ereignissen, Ereignissen oder Körpern im Laufe der Zeit.

## Kalender Datenstruktur

Um einen Kalender zu vertreten, können Sie die folgende `CalendarData`-Schnittstelle verwenden:

```typescript
{{CalendarType}}

{{CalendarData}}
```
### Schlüsselattribute

- **Datum:** Ein einzigartiges Datum eines bestimmten Jahres.
- **Wert:** Wie wirkungsvoll dieses Datum war für die Veranstaltung.
- ** Kategorie: ** Kategorisiert die Daten in eine bestimmte Veranstaltung.


### Vor- und Nachteile

#### Vorteile
- **Beziehungsvisualisierung:** Die Kalender-Visualisierung bietet eine intuitive und benutzerfreundliche Möglichkeit, zeitliche Beziehungen zu erforschen, so dass es Benutzern leicht ist, Muster im Laufe der Zeit zu verstehen.

- **Kompaktdarstellung:** Ein Kalender optimiert den Raum durch die Präsentation von Ereignissen in einem kompakten Format, so dass Benutzer eine signifikante Menge von zeitlichen Daten ohne überwältigende Visualisierungen anzeigen.

- **Mehrjährige:** Wenn die Ereignisse auf einer mehrjährigen Zeit stattfinden, werden weitere Kalender-Visualisierungen angezeigt.

#### Negativ
- **Komplexität mit dichten Grafiken:** Aufgrund seiner kompakten Natur kann ein Kalender für jede Veranstaltung einen begrenzten Platz bieten. In Szenarien, die umfangreiche Informationen benötigen, können zusätzliche Interaktionen oder ergänzende Ansichten erforderlich sein.

- **Nicht ideal für dichte Event Overlaps:** In Fällen, in denen sich mehrere Ereignisse eng in der Zeit überschneiden, könnte die Visualisierung Herausforderungen bei der Aufrechterhaltung der Klarheit und der Vermeidung von überlappungsbedingten visuellen Cluttern stellen.

## Kalenderbeispiel

! [Calendar Example](/Illustry-monorepo/calendar.gif)
