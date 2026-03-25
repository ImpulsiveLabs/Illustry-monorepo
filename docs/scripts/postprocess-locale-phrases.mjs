#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const docsRoot = path.join(repoRoot, 'docs', 'src', 'content', 'docs');
const locales = ['tr', 'vi', 'pl', 'pt'];

const localeLabels = {
  tr: {
    dataStructure: 'Veri Yapısı',
    keyAttributes: 'Temel Nitelikler',
    prosCons: 'Artılar ve Eksiler',
    pros: 'Artılar',
    cons: 'Eksiler',
    represent: (subject, type) => `${subject} göstermek için aşağıdaki \`${type}\` arayüzünü kullanabilirsiniz:`,
    representSystem: (subject, type) => `Sisteminizde bir ${subject} göstermek için aşağıdaki \`${type}\` arayüzünü kullanabilirsiniz:`
  },
  vi: {
    dataStructure: 'Cấu trúc dữ liệu',
    keyAttributes: 'Thuộc tính chính',
    prosCons: 'Ưu và nhược điểm',
    pros: 'Ưu điểm',
    cons: 'Nhược điểm',
    represent: (subject, type) => `Để biểu diễn ${subject}, bạn có thể sử dụng giao diện \`${type}\` sau:`,
    representSystem: (subject, type) => `Để biểu diễn ${subject} trong hệ thống của bạn, bạn có thể dùng giao diện \`${type}\` sau:`
  },
  pl: {
    dataStructure: 'Struktura danych',
    keyAttributes: 'Kluczowe atrybuty',
    prosCons: 'Zalety i wady',
    pros: 'Zalety',
    cons: 'Wady',
    represent: (subject, type) => `Aby przedstawić ${subject}, możesz użyć następującego interfejsu \`${type}\`:`,
    representSystem: (subject, type) => `Aby przedstawić ${subject} w systemie, możesz użyć następującego interfejsu \`${type}\`:`
  },
  pt: {
    dataStructure: 'Estrutura de dados',
    keyAttributes: 'Atributos principais',
    prosCons: 'Prós e contras',
    pros: 'Prós',
    cons: 'Contras',
    represent: (subject, type) => `Para representar ${subject}, você pode usar a seguinte interface \`${type}\`:`,
    representSystem: (subject, type) => `Para representar ${subject} no seu sistema, você pode usar a seguinte interface \`${type}\`:`
  }
};

function applyLocalizedReplacements(content, locale) {
  const t = localeLabels[locale];
  let out = content;

  out = out.replace(/^##\s+(.+?)\s+Data Structure$/gm, (_m, subject) => `## ${subject} ${t.dataStructure}`);
  out = out.replace(/^###\s+Key Attributes$/gm, `### ${t.keyAttributes}`);
  out = out.replace(/^###\s+Pros and Cons$/gm, `### ${t.prosCons}`);
  out = out.replace(/^####\s+Pros$/gm, `#### ${t.pros}`);
  out = out.replace(/^####\s+Cons$/gm, `#### ${t.cons}`);

  out = out.replace(
    /^To represent a (.+?), you can use the following `([^`]+)` interface:$/gm,
    (_m, subject, type) => t.represent(subject, type)
  );

  out = out.replace(
    /^To represent a (.+?) Data, you can use the following `([^`]+)` interface:$/gm,
    (_m, subject, type) => t.represent(`${subject} Data`, type)
  );

  out = out.replace(
    /^To represent a (.+?) in your system, you can use the following `([^`]+)` interface:$/gm,
    (_m, subject, type) => t.representSystem(subject, type)
  );

  return out;
}

async function run() {
  for (const locale of locales) {
    const localeDir = path.join(docsRoot, locale);
    const files = [];

    async function walk(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }

    await walk(localeDir);

    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      const updated = applyLocalizedReplacements(content, locale);
      if (updated !== content) {
        await fs.writeFile(file, updated, 'utf8');
      }
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
