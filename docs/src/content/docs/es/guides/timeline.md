---
title: Línea de tiempo
description: Documento de línea de tiempo
---

La **Línea de tiempo** es una visualización versátil que muestra eventos o actividades cronológicamente a lo largo del tiempo. Ofrece una visión integral de sucesos históricos o futuros, proporcionando información sobre patrones, duraciones y relaciones.


## Estructura de datos de la línea de tiempo

Para representar datos de línea de tiempo, puede utilizar la siguiente interfaz `TimelineData`:

```typescript
{{TimelineEventTag}}

{{TimelineEvent}}

{{TimelineData}}
```
### Atributos clave

#### Línea de tiempoEtiqueta de evento
- **nombre:** El nombre de la etiqueta asociada con un evento de la línea de tiempo.

#### Línea de tiempoEvento
- **resumen:** Un breve resumen o título del evento.
- **fecha:** La fecha en que ocurrió el evento.
- **tipo:** El tipo o categoría del evento.
- **autor:** El autor o creador del evento.
- **etiquetas:** Una serie de etiquetas asociadas con el evento.
- **descripción:** Una descripción detallada del evento.

#### Línea de tiempoDatos
- **[fecha]:** La clave de fecha que representa un rango de fechas específico.
  - **resumen:**
    - **título:** Un título resumido para el intervalo de fechas.
  - **eventos:** Una matriz de `TimelineEvent` objetos asociados con esa fecha.

### Pros y contras

#### Ventajas
- **Comprensión cronológica:** Las líneas de tiempo ofrecen una representación cronológica de los eventos, proporcionando una comprensión clara de la secuencia en la que ocurrieron.

- **Categorización de eventos:** La capacidad de categorizar eventos mediante etiquetas permite una agrupación organizada y eficiente, lo que ayuda en el análisis de tipos específicos de eventos.

- **Visualización flexible:** Las líneas de tiempo son flexibles y pueden adaptarse a varios tipos de datos, lo que las hace adecuadas para representar una amplia gama de eventos y actividades.

#### Contras
- **Posible aglomeración:** En líneas de tiempo con una alta densidad de eventos, existe el riesgo de desorden visual y posible dificultad para distinguir eventos individuales.

- **Limitado para ciertos tipos de datos:** Si bien las líneas de tiempo son versátiles, es posible que no sean las más efectivas para representar ciertas relaciones o estructuras de datos complejas.

- **Subjetividad en la importancia de los eventos:** La importancia de los eventos puede ser subjetiva y su representación en una línea de tiempo puede no capturar el significado matizado percibido por los individuos.

## Ejemplo de línea de tiempo

![Timeline Example](/Illustry-monorepo/timeline.gif)
