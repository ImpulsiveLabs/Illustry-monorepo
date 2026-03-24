---
title: Bundling Tepi Hierarki
description: Dokumen Bundling Tepi Hierarki
---

Visualisasi **Hierarchical Edge Bundling** adalah teknik canggih untuk menggambarkan hubungan dan koneksi hierarki dalam kumpulan data. Ini memanfaatkan bundling tepi untuk mengurangi kekacauan visual sambil menyoroti struktur hubungan secara hierarkis.

## Struktur Data Bundling Tepi Hierarki

Untuk merepresentasikan Hierarchical Edge Bundling, Anda dapat menggunakan antarmuka `NodeLinkData` berikut:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Atribut Utama

- **nama:** Pengidentifikasi unik untuk node.
- **kategori:** Mengkategorikan node ke dalam grup atau klaster tertentu.
- **source:** Mengidentifikasi node sumber tautan.
- **target:** Mengidentifikasi simpul target tautan.
- **nilai:** Mewakili nilai numerik yang dikaitkan dengan tautan yang menunjukkan seberapa kuat keterhubungan simpul-simpul tersebut.

### Pro dan Kontra

#### Kelebihan
- **Peningkatan Estetika dan Keterbacaan:** Tepian yang dibundel berkontribusi pada visualisasi yang lebih bersih dan estetis. Dengan mengurangi kekacauan visual, pengguna dapat lebih mudah menafsirkan hubungan antar node, sehingga meningkatkan keterbacaan secara keseluruhan.

- **Peningkatan Fokus pada Hubungan Utama:** Edge bundling memungkinkan pengguna untuk fokus pada hubungan utama dalam struktur hierarki, dengan menekankan hubungan yang paling signifikan. Hal ini dapat membantu mengidentifikasi jalur kritis atau node pusat dalam kumpulan data yang kompleks.

#### Kontra
- **Kesulitan dalam Mengidentifikasi Jalur Paralel:** Mengidentifikasi jalur atau koneksi paralel di area yang padat dapat menimbulkan tantangan bagi pengguna. Membedakan antara sisi-sisi yang berdekatan dan mewakili hubungan yang berbeda bisa jadi rumit, sehingga memengaruhi ketepatan analisis.

- **Tantangan dengan Persepsi Arah:** Pengguna mungkin menghadapi kesulitan dalam memahami arah dari tepi yang digabungkan, khususnya dalam skenario ketika terdapat tingkat tumpang tindih yang tinggi. Hal ini dapat berdampak pada penafsiran akurat alur hubungan.

## Contoh Bundling Tepi Hirarki

![Hierarchical Edge Bundling Example](/Illustry-monorepo/hierarchical-edge-bundling.gif)
