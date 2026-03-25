---
title: Nube de palabras
description: Documento de nube de palabras
---

La visualización **Nube de palabras** se utiliza para representar datos textuales de una manera visualmente atractiva e informativa. Convierte palabras en elementos gráficos, y el tamaño de cada palabra indica su frecuencia o importancia en el conjunto de datos determinado.

## Estructura de datos de nube de palabras

Para representar una nube de palabras, puede utilizar la siguiente interfaz `WordCloudData`:

```typescript
{{WordType}}

{{WordCloudData}}

```
### Atributos clave

- **nombre:** La palabra en sí.
- **valor:** Un número que representa una métrica para determinar qué tan importante es esa palabra.


### Pros y contras

#### Ventajas
- **Simplicidad:** Las nubes de palabras sintetizan datos textuales en un formato simple y visualmente accesible.

- **Análisis rápido:** Los usuarios pueden analizar e identificar rápidamente las palabras más importantes sin profundizar en el texto detallado.

#### Contras
- **Pérdida de contexto:** Si bien las nubes de palabras resaltan palabras individuales, es posible que carezcan del contexto proporcionado por el texto completo o visualizaciones más complejas.

- **Subjetividad:** La interpretación de una nube de palabras puede ser subjetiva y la importancia de una palabra puede variar entre individuos.

## Ejemplo de nube de palabras

![Word Cloud Example](/Illustry-monorepo/word-cloud.gif)
