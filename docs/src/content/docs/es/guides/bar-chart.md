---
title: Gráfico de barras
description: Documento de gráfico de barras
---

La visualización **Gráfico de barras** es una herramienta versátil y eficaz para representar datos categóricos de una manera visualmente atractiva. Utiliza barras horizontales o verticales para mostrar los valores de diferentes categorías, lo que facilita a los usuarios comparar y comprender las distribuciones de datos.

## Estructura de datos del gráfico de barras

Para representar un gráfico de barras, puede utilizar la siguiente interfaz `AxisChartData`:

```typescript
{{AxisChartData}}
```
### Atributos clave

- **encabezados:** Una matriz de cadenas que representan las categorías o dimensiones a lo largo de uno de los ejes.
- **valores:** Un diccionario donde cada clave es una categoría o dimensión y el valor correspondiente es una matriz de valores numéricos a lo largo del otro eje.


### Pros y contras

#### Ventajas
- **Comparación multidimensional:** Los gráficos de barras destacan al comparar múltiples dimensiones simultáneamente, lo que proporciona una vista completa de los datos.

- **Representación clara de valores:** Los valores numéricos se representan claramente a lo largo de los ejes X e Y, lo que facilita a los usuarios interpretar y comparar.

#### Contras
- **Complejidad con categorías excesivas:** Cuando se trata de una gran cantidad de categorías o dimensiones, la visualización puede volverse abarrotada y difícil de interpretar.

- **Limitado para datos categóricos:** Los gráficos de barras son más eficaces para datos numéricos y pueden no ser la opción óptima para representar datos categóricos.

## Ejemplo de gráfico de barras

![Bar Chart Example](/Illustry-monorepo/bar-chart.gif)
