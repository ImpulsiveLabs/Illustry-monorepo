---
title: Wykres linii
description: Wykres linii doc
---

Wizualizacja * * Line Chart * * jest wszechstronnym narzędziem do reprezentowania trendów i wzorców w danych liczbowych w czasie. Jest szeroko stosowany do wizualizacji relacji między dwoma zmiennymi stałymi i podkreślając trendy lub wahania.

## Struktura danych wykresu linii

Aby przedstawić Line Chart, możesz użyć następującego interfejsu `AxisChartData`:

```typescript
{{AxisChartData}}
```
### Atrybuty kluczowe

- * * headers: * * Tablica ciągów przedstawiająca kategorie lub wymiary wzdłuż jednej z osi.
- * * wartości: * * Słownik, w którym każdy klucz jest kategorią lub wymiarem, a odpowiadająca mu wartość jest tablicą wartości numerycznych wzdłuż drugiej osi.


### Plusy i minusy

#### Zalety
- * * Porównanie wielowymiarowe: * * Wykresy linii wyróżniają się porównywaniem wielu wymiarów jednocześnie, zapewniając kompleksowy obraz danych.

- * * Wyczyść reprezentację wartości: * * Wartości numeryczne są wyraźnie reprezentowane wzdłuż osi X i Y, co ułatwia użytkownikom interpretację i porównanie.

#### Wózki
- * * Complexity with Excessive Categories: * * W przypadku dużej liczby kategorii lub wymiarów wizualizacja może stać się zatłoczona i trudna do interpretacji.

- * * Ograniczone dla danych kategorii: * * Wykresy linii są najbardziej skuteczne dla danych liczbowych i mogą nie być optymalnym wyborem dla reprezentowania danych kategorycznych.

## Przykład wykresu linii

![Line Chart Example](/Illustry-monorepo/line-chart.gif)
