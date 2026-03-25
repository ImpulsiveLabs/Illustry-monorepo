---
title: Paquete de borde jerárquico
description: Documento de agrupación de bordes jerárquicos
---

La visualización **Hierarchical Edge Bundling** es una técnica sofisticada para representar relaciones y conexiones jerárquicas dentro de un conjunto de datos. Aprovecha la agrupación de bordes para reducir el desorden visual y al mismo tiempo resalta la estructura de las relaciones de manera jerárquica.

## Estructura de datos de agrupación de bordes jerárquicos

Para representar un paquete de borde jerárquico, puede utilizar la siguiente interfaz `NodeLinkData`:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Atributos clave

- **nombre:** Un identificador único para el nodo.
- **categoría:** Clasifica el nodo en un grupo o clúster específico.
- **fuente:** Identifica el nodo de origen del enlace.
- **destino:** Identifica el nodo de destino del enlace.
- **valor:** Representa un valor numérico asociado con el vínculo que sugiere qué tan fuertemente conectados están los nodos.

### Pros y contras

#### Ventajas
- **Estética y legibilidad mejoradas:** Los bordes agrupados contribuyen a una visualización más limpia y estéticamente más agradable. Al reducir el desorden visual, los usuarios pueden interpretar más fácilmente las relaciones entre los nodos, mejorando la legibilidad general.

- **Enfoque mejorado en las relaciones clave:** La agrupación perimetral permite a los usuarios centrarse en las relaciones clave dentro de la estructura jerárquica, enfatizando las conexiones más importantes. Esto puede ayudar a identificar rutas críticas o nodos centrales en conjuntos de datos complejos.

#### Contras
- **Dificultad para identificar rutas paralelas:** Identificar rutas o conexiones paralelas en un área densamente agrupada puede plantear desafíos para los usuarios. Distinguir entre bordes muy juntos que representan diferentes relaciones puede ser complejo y afectar la precisión del análisis.

- **Desafíos con la percepción de direccionalidad:** Los usuarios pueden enfrentar dificultades para percibir la direccionalidad de los bordes agrupados, particularmente en escenarios donde existe un alto grado de superposición. Esto puede afectar la interpretación precisa del flujo de relaciones.

## Ejemplo de agrupación perimetral jerárquica

![Hierarchical Edge Bundling Example](/Illustry-monorepo/hierarchical-edge-bundling.gif)
