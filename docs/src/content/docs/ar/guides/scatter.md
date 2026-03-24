---
title: مؤامرة مبعثر
description: وثيقة مبعثر
---

The **Scatter Plot** visualization is a powerful tool for visualizing the relationships between two numerical variables. وهي تستخدم نقاطا على طائرة كارتيسية لتمثيل نقاط البيانات الفردية، مما يجعل من السهل تحديد الأنماط، والترابط، والخطوط الخارجية.


## هيكل البيانات

لتمثيل (سكاتر بلوت) يمكنك استخدام واجهة (زكسكينلين) التالية

```typescript
{{ScatterPoint}}

{{ScatterData}}
```

### السمات الرئيسية

- ** مجموعة من قيمتين رقميتين [x, y]، تمثلان إحداثيات نقطة بيانات على الفأسين X و Y.
- ** (أ) سلسلة تبين الفئة أو المجموعة التي تنتمي إليها نقطة البيانات.


### إيجابيات وسلبيات

#### الايجابيات
- ** تحديد العلاقة** Scatter Plots excel at revealing relationships, patterns, and trends between two numerical variables.

- ** يمكن بسهولة تحديد المعالم أو نقاط البيانات التي تنحرف بدرجة كبيرة عن القاعدة على موقع " سكاتر " .

#### سلبيات

- ** التجاوز المحتمل:** وفي الحالات ذات الكثافة العالية لنقاط البيانات، يمكن أن تحدث زيادة كبيرة، مما يؤثر على ظهور فرادى النقاط.

## Scatter Plot Examp

[Scatter Plot Example](/Illustry-monorepo/scatter.gif)
