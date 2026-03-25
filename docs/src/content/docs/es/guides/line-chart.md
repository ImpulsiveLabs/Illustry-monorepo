---
title: Gráfico de líneas
description: Documento de gráfico de líneas
---

La visualización **Gráfico de líneas** es una herramienta versátil para representar tendencias y patrones en datos numéricos a lo largo del tiempo. Se utiliza ampliamente para visualizar la relación entre dos variables continuas y resaltar tendencias o fluctuaciones.

## Estructura de datos del gráfico de líneas

Para representar un gráfico de líneas, puede utilizar la siguiente interfaz `AxisChartData`:

```typescript
{{AxisChartData}}
```
### Atributos clave

- **encabezados:** Una matriz de cadenas que representan las categorías o dimensiones a lo largo de uno de los ejes.
- **valores:** Un diccionario donde cada clave es una categoría o dimensión y el valor correspondiente es una matriz de valores numéricos a lo largo del otro eje.


### Pros y contras

#### Ventajas
- **Comparación multidimensional:** Los gráficos de líneas destacan al comparar múltiples dimensiones simultáneamente, lo que proporciona una vista integral de los datos.

- **Representación clara de valores:** Los valores numéricos se representan claramente a lo largo de los ejes X e Y, lo que facilita a los usuarios interpretar y comparar.

#### Contras
- **Complejidad con categorías excesivas:** Cuando se trata de una gran cantidad de categorías o dimensiones, la visualización puede volverse abarrotada y difícil de interpretar.

- **Limitado para datos categóricos:** Los gráficos de líneas son más eficaces para datos numéricos y pueden no ser la opción óptima para representar datos categóricos.

## Ejemplo de gráfico de líneas

![Line Chart Example](/Illustry-monorepo/line-chart.gif)
