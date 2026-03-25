---
title: Grafik Tata Letak Paksa
description: Dokumen Grafik Tata Letak Paksa
---

Visualisasi **Grafik Tata Letak Paksa** adalah representasi data yang saling berhubungan yang dinamis dan menarik. Ini menggunakan algoritme tata letak yang diarahkan secara paksa untuk menyampaikan secara visual hubungan antar entitas dalam kumpulan data.

## Struktur Data Grafik Tata Letak Paksa

Untuk mewakili Grafik Tata Letak Paksa, Anda dapat menggunakan antarmuka `NodeLinkData` berikut:

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
- **Visualisasi Relasi:** Mewakili dengan jelas hubungan antar entitas melalui node dan tautan yang terhubung.

- **Tata Letak Dinamis:** Memanfaatkan tata letak yang diarahkan secara paksa untuk representasi organik dan menarik secara visual.

#### Kontra
- **Kompleksitas dengan Grafik Padat:** Dalam grafik yang sangat terhubung satu sama lain, kekacauan visual dapat memengaruhi keterbacaan.

- **Terbatas pada Data Jaringan:** Paling efektif untuk memvisualisasikan data berbasis jaringan atau hubungan; mungkin tidak cocok untuk semua jenis kumpulan data.

## Contoh Grafik Tata Letak Paksa

![Forced Layout Graph Example](/Illustry-monorepo/forced-layout-graph.gif)
