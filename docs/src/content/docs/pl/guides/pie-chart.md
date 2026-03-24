---
title: Wykres ciasta
description: Wykres kołowy, dokument
---

Wizualizacja * * Pie Chart * * jest zwięzłym i wizualnie uderzającym sposobem reprezentowania dystrybucji części w całości. Jest szczególnie skuteczny w wyświetlaniu proporcji i procentów w formacie okrągłym.


## Struktura danych wykresu ciasta

Aby przedstawić Pie Chart, możesz użyć następującego interfejsu `PieChartData`:

```typescript
{{PieChartData}}
```
### Atrybuty kluczowe

- * * wartości: * * Słownik, w którym każdy klucz jest kategorią lub wymiarem, a odpowiadająca mu wartość jest wartością liczbową.


### Plusy i minusy

#### Zalety
- * * Procent reprezentacji: * * Pie Charts wyraźnie przedstawia procentowy udział każdej kategorii w całości.

- * * Prostota wizualna: * * Okrągły kształt i prostota Pie Charts ułatwiają użytkownikom zrozumienie na pierwszy rzut oka.

#### Wózki
- * * Limited dla wielu kategorii: * * W przypadku wielu kategorii, Pie Charts może stać się zatłoczone i trudne do interpretacji.


## Przykład wykresu ciasta

![Pie Chart Example](/Illustry-monorepo/pie-chart.gif)
