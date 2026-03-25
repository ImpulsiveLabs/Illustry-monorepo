---
title: Ağaç Haritası
description: Ağaç Haritası belgesi
---

**Ağaç Haritası** görselleştirmesi, karmaşık yapılara net bir genel bakış sağlayan verileri temsil etmenin dinamik ve hiyerarşik bir yoludur. Ağaç Haritası, iç içe geçmiş dikdörtgenleri kullanarak hiyerarşik veri ilişkilerini verimli bir şekilde görselleştirir ve bu da onu bir veri kümesi içindeki hem bütünün hem de parçaların taşınmasında paha biçilmez bir araç haline getirir.

## Ağaç Haritası Veri Yapısı

Bir Ağaç Haritası Verisini temsil etmek için aşağıdaki `HierarchyData` arayüzünü kullanabilirsiniz:

```typescript
{{HierarchyNode}}

{{HierarchyData}}
```
### Anahtar Nitelikler

- **ad:** Düğüm adı.
- **değer:** Bu düğümün ne kadar büyük olduğunu belirleyen bir ölçümü temsil eden sayı.
- **kategori:** Düğümün ait olduğu kategoriyi veya türü açıklar.
- **children:** Bu özellik isteğe bağlıdır ve HierarchyNode nesnelerinin bir dizisini temsil eder. Düğümün alt düğümlere sahip olabileceğini ve hiyerarşik bir yapı oluşturabileceğini belirtir. Her alt düğüm aynı HierarchyNode yapısını takip ederek ağaç benzeri bir hiyerarşinin temsiline olanak tanır.

### Artıları ve Eksileri

#### Artıları
- **Hiyerarşik Anlama:** Ağaç haritaları, hiyerarşik veri yapılarını görüntülemede üstündür ve farklı düzeyler arasındaki ilişkilerin anlaşılmasına yardımcı olan görsel bir hiyerarşi sağlar.

- **Orantılı Gösterim:** Dikdörtgenlerin orantılı boyutlandırılması, farklı veri kategorilerinin göreceli değerlerinin veya boyutlarının sezgisel olarak temsil edilmesine olanak tanır.

- **Alan Verimliliği:** Ağaç haritaları alanı verimli bir şekilde kullanarak kullanıcıların büyük veri kümelerini ekranı karmaşıklaştırmadan görselleştirmesine olanak tanır.

- **Örüntülerin Hızlı Tanımlanması:** Kullanıcılar, dikdörtgenlerin görsel düzenlemesi aracılığıyla veri kümesindeki desenleri, aykırı değerleri ve konsantrasyonları hızlı bir şekilde tanımlayabilir.

#### Eksileri
- **Çakışan Etiketlerin Karmaşıklığı:** Özellikle yoğun olarak doldurulmuş Ağaç Haritalarında etiketlerin çakıştığı durumlarda okunabilirlik zor olabilir.

- **Hassasiyet Zorluğu:** Ağaç Haritaları geniş bir genel bakış sunsa da, hiyerarşik doğa nedeniyle bireysel veri noktaları arasında kesin karşılaştırmalar yapmak zor olabilir.

- **Hiyerarşik Verilerle Sınırlıdır:** Ağaç haritaları hiyerarşik verileri görselleştirirken en etkilidir; hiyerarşik olmayan veri kümeleri için alternatif görselleştirmeler daha uygun olabilir.

## Ağaç Haritası Örneği

![Tree Map Example](/Illustry-monorepo/tree-map.gif)
