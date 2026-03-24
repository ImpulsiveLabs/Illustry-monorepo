---
title: Sankey Diyagramı
description: Sankey
---

**Sankey Diyagramı** görselleştirmesi, bir veri kümesindeki varlıklar arasındaki akışı ve ilişkileri görselleştirmek için güçlü bir araçtır. Değerlerin bir sistem veya süreç genelinde dağılımını ve dönüşümünü sergilemek için özellikle kullanışlıdır.

## Sankey Diyagramı Veri Yapısı

Bir Sankey Diyagramını temsil etmek için aşağıdaki `NodeLinkData` arayüzünü kullanabilirsiniz:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Anahtar Nitelikler

- **ad:** Düğümün benzersiz tanımlayıcısı.
- **kategori:** Düğümü belirli bir grup veya küme halinde kategorilere ayırır.
- **kaynak:** Bağlantının kaynak düğümünü tanımlar.
- **hedef:** Bağlantının hedef düğümünü tanımlar.
- **değer:** Bağlantıyla ilişkili, düğümlerin ne kadar güçlü bir şekilde bağlı olduğunu gösteren sayısal bir değeri temsil eder.

### Artıları ve Eksileri

#### Artıları
- **Akış Temsili:** Bir sistem veya süreçteki varlıklar arasındaki değer veya miktar akışını etkili bir şekilde görselleştirir.

- **Dağılıma İlişkin Bilgiler:** Değerlerin her aşamada nasıl dağıtıldığına ve dönüştürüldüğüne ilişkin bilgiler sunar.

#### Eksileri
- **Çok Sayıda Düğümün Karmaşıklığı:** Çok sayıda düğüm nedeniyle görsel karmaşa meydana gelebilir ve okunabilirliği etkileyebilir.

- **Özel Kullanım Durumu:** Öncelikle akışı ve dağıtımı görselleştirmek için tasarlanmıştır; her tür veri kümesi için uygun olmayabilir.

## Sankey Diyagramı Örneği

![Sankey Diagram Example](/Illustry-monorepo/sankey.gif)
