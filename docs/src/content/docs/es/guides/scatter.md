---
title: Diagrama de dispersión
description: Documento disperso
---

La visualización **Gráfico de dispersión** es una poderosa herramienta para visualizar las relaciones entre dos variables numéricas. Utiliza puntos en un plano cartesiano para representar puntos de datos individuales, lo que facilita la identificación de patrones, correlaciones y valores atípicos.


## Estructura de datos del diagrama de dispersión

Para representar un diagrama de dispersión, puede utilizar la siguiente interfaz `ScatterData`:

```typescript
{{ScatterPoint}}

{{ScatterData}}
```

### Atributos clave

- **valor:** Una matriz de dos valores numéricos [x, y], que representan las coordenadas de un punto de datos en los ejes X e Y.
- **valores:** Una cadena que indica la categoría o grupo al que pertenece el punto de datos.


### Pros y contras

#### Ventajas
- **Identificación de relaciones:** Los diagramas de dispersión destacan por revelar relaciones, patrones y tendencias entre dos variables numéricas.

- **Detección de valores atípicos:** Los valores atípicos, o puntos de datos que se desvían significativamente de la norma, se identifican fácilmente en un diagrama de dispersión.

#### Contras

- **Posible sobretrazado:** En casos con una alta densidad de puntos de datos, se puede producir un sobretrazado, lo que afecta la visibilidad de los puntos individuales.

## Ejemplo de diagrama de dispersión

![Scatter Plot Example](/Illustry-monorepo/scatter.gif)
