---
title: Gráfico circular
description: Documento de gráfico circular
---

La visualización **Gráfico circular** es una forma concisa y visualmente impactante de representar la distribución de partes dentro de un todo. Es particularmente eficaz para mostrar proporciones y porcentajes en formato circular.


## Estructura de datos del gráfico circular

Para representar un gráfico circular, puede utilizar la siguiente interfaz `PieChartData`:

```typescript
{{PieChartData}}
```
### Atributos clave

- **valores:** Un diccionario donde cada clave es una categoría o dimensión, y el valor correspondiente es un valor numérico.


### Pros y contras

#### Ventajas
- **Representación porcentual:** Los gráficos circulares proporcionan una representación clara de la contribución porcentual de cada categoría al total.

- **Simplicidad visual:** La forma circular y la simplicidad de los gráficos circulares hacen que los usuarios los entiendan fácilmente de un vistazo.

#### Contras
- **Limitado para muchas categorías:** Cuando se trata de numerosas categorías, los gráficos circulares pueden volverse saturados y difíciles de interpretar.


## Ejemplo de gráfico circular

![Pie Chart Example](/Illustry-monorepo/pie-chart.gif)
