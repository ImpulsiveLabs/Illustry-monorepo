---
title: Wykres rozproszony
description: Rozproszyć dok
---

Wizualizacja * * Scatter Plot * * jest potężnym narzędziem wizualizacji relacji pomiędzy dwoma zmiennymi numerycznymi. Wykorzystuje punkty na płaszczyźnie kartezjańskiej, aby reprezentować poszczególne punkty danych, ułatwiając identyfikację wzorców, korelacji i odchyleń.


## Struktura wykresu scatter

Aby przedstawić Scatter Plot, możesz użyć następującego interfejsu `ScatterData`:

```typescript
{{ScatterPoint}}

{{ScatterData}}
```

### Atrybuty kluczowe

- * * wartość: * * macierz dwóch wartości numerycznych [x, y], przedstawiająca współrzędne punktu danych na osiach X i Y.
- * * wartości: * * Łańcuch wskazujący kategorię lub grupę, do której należy punkt danych.


### Plusy i minusy

#### Zalety
- * * Identyfikacja związku: * * Scatter Plots wyróżnia się odkrywaniem relacji, wzorców i trendów pomiędzy dwoma zmiennymi numerycznymi.

- * * Detekcja Outlier: * * Outliers, lub punkty danych, które znacznie odbiegają od normy, są łatwo identyfikowane na Scatter Plot.

#### Wózki

- * * Potencjalne przeciążenie: * * W przypadkach o dużej gęstości punktów danych może dojść do przerostu, co wpływa na widoczność poszczególnych punktów.

## Przykładowy rozproszenie

![Scatter Plot Example](/Illustry-monorepo/scatter.gif)
