---
title: Wykres pasków
description: Wykres barów doc
---

Wizualizacja * * Bar Chart * * jest wszechstronnym i szkolnym rodzajem do reprezentacji danychkategorycznych w społeczeństwie wizualnym. Wykłady pozome lub pionowe pręty, aby uzyskać wartość różnych kategorii, dopuszczając do udziału udziały przemysłowe i rozdzielczość dystrybukcji danych.

## Struktura danych wykresu

W przypadku przedstawienia wykresu barowego, możliwe jest uwzględnienie następnego interfeju "AxisChartData":

```typescript
{{AxisChartData}}
```
### Atrybuty kluczowe

- * * headers: * * Tablica ciągów przedstawiająca kategorie lub wymiary wzdłuż jednej z osi.
- * * wartości: * * Słownik, w którym każdy klucz jest kategorią lub wymiarem, a odpowiadająca mu wartość jest tablicą wartości numerycznych wzdłuż drugiej osi.


### Plusy i minusy

#### Zalety
- * * Porównanie wielowymiarowe: * * Wykresy barowe wyróżniają się porównywaniem wielu wymiarów jednocześnie, zapewniając kompleksowy obraz danych.

- * * Wyczyść reprezentację wartości: * * Wartości numeryczne są wyraźnie reprezentowane wzdłuż osi X i Y, co ułatwia użytkownikom interpretację i porównanie.

#### Wózki
- * * Complexity with Excessive Categories: * * W przypadku większej liczby kategorii lub wyrazów wizualizacja może mieć miejsce zakwalifikowana i trudna do interpretacji.

- * * Ograniczone dla danych kategorii: * * Wykresy Bar są najbardziej skuteczne dla danych numerycznych i mogą nie być optymalnym wyborem dla reprezentowania danych kategorycznych.

## Przykład wykresu paska

![Bar Chart Example](/Illustry-monorepo/bar-chart.gif)
