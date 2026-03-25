---
title: Embudo
description: Documento de embudo
---

La visualización del **Embudo** es una poderosa herramienta para rastrear la progresión y las tasas de conversión de una serie de etapas de un proceso. Proporciona una representación visual de cómo las entidades se mueven a través de diferentes etapas de un flujo de trabajo definido.



## Estructura de datos del embudo

Para representar un embudo, puede utilizar la siguiente interfaz `FunnelData`:

```typescript
{{FunnelData}}
```
### Atributos clave

- **valores:** Un diccionario donde cada clave es una categoría o dimensión, y el valor correspondiente es un valor numérico.


### Pros y contras

#### Ventajas
- **Métricas de rendimiento:** Los gráficos de embudo son excelentes para visualizar métricas de rendimiento, lo que permite a los equipos realizar un seguimiento y mejorar los indicadores clave.

- **Análisis segmentado:** Cada etapa del embudo permite un análisis segmentado, lo que ayuda a identificar áreas específicas de mejora o éxito.

- **Información predictiva:** Los gráficos de embudo pueden proporcionar información predictiva sobre el rendimiento futuro en función de las tasas de conversión históricas.

#### Contras

- **Desafío con procesos complejos:** En escenarios donde los procesos involucran numerosas ramas o bucles intrincados, los gráficos de embudo pueden tener dificultades para representar la complejidad de manera efectiva.


## Ejemplo de embudo

![Funnel Example](/Illustry-monorepo/funnel.gif)
