---
title: Calendario
description: Documento de calendario
---

La visualización **Calendario** es una representación única diseñada para proporcionar información sobre las relaciones temporales dentro de un conjunto de datos. Ofrece un enfoque distintivo para visualizar eventos, sucesos o entidades a lo largo del tiempo.

## Estructura de datos del calendario

Para representar un Calendario, puede utilizar la siguiente interfaz `CalendarData`:

```typescript
{{CalendarType}}

{{CalendarData}}
```
### Atributos clave

- **fecha:** Una fecha única de un año específico.
- **valor:** Qué impacto tuvo esa fecha para el evento.
- **categoría:** Clasifica las fechas en eventos específicos.


### Pros y contras

#### Ventajas
- **Visualización de relaciones:** La visualización del calendario proporciona una forma intuitiva y fácil de usar para explorar las relaciones temporales, lo que facilita a los usuarios comprender los patrones a lo largo del tiempo.

- **Representación compacta:** Un calendario optimiza el espacio al presentar eventos en un formato compacto, lo que permite a los usuarios ver una cantidad significativa de datos temporales sin imágenes abrumadoras.

- **Varios años:** Si los eventos ocurren en un período de varios años, se mostrarán más visualizaciones del calendario.

#### Contras
- **Complejidad con gráficos densos:** Debido a su naturaleza compacta, un calendario puede proporcionar espacio limitado para detallar cada evento. En escenarios que requieren información extensa, pueden ser necesarias interacciones adicionales o vistas complementarias.

- **No es ideal para superposiciones densas de eventos:** En los casos en que varios eventos se superponen estrechamente en el tiempo, la visualización puede enfrentar desafíos para mantener la claridad y evitar el desorden visual relacionado con la superposición.

## Ejemplo de calendario

![Calendar Example](/Illustry-monorepo/calendar.gif)
