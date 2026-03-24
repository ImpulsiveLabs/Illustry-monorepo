---
title: Diagrama de Sankey
description: sankey
---

La visualización del **Diagrama de Sankey** es una herramienta poderosa para visualizar el flujo y las relaciones entre entidades en un conjunto de datos. Es particularmente útil para mostrar la distribución y transformación de valores en un sistema o proceso.

## Estructura de datos del diagrama de Sankey

Para representar un diagrama de Sankey, puede utilizar la siguiente interfaz `NodeLinkData`:

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
- **Representación de flujo:** Visualiza de manera efectiva el flujo de valores o cantidades entre entidades en un sistema o proceso.

- **Información sobre la distribución:** Ofrece información sobre cómo se distribuyen y transforman los valores en cada etapa.

#### Contras
- **Complejidad con numerosos nodos:** Puede producirse desorden visual con una gran cantidad de nodos, lo que afecta la legibilidad.

- **Caso de uso especializado:** Diseñado principalmente para visualizar el flujo y la distribución; Puede que no sea adecuado para todos los tipos de conjuntos de datos.

## Ejemplo de diagrama de Sankey

![Sankey Diagram Example](/Illustry-monorepo/sankey.gif)
