import { readFile, writeFile } from 'node:fs/promises';

const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error('Missing GEMINI_API_KEY GitHub Actions secret.');
const products = JSON.parse(await readFile('products.json', 'utf8'));
const posts = JSON.parse(await readFile('posts.json', 'utf8'));
const eligible = products.filter(p => p.affiliateUrl && /^https:\/\//i.test(p.affiliateUrl));
if (!eligible.length) {
  console.log('No product has an affiliate URL yet. Add an approved affiliate URL to products.json.');
  process.exit(0);
}
const used = new Set(posts.slice(0, 14).map(p => p.productId));
const product = eligible.find(p => !used.has(p.id)) ?? eligible[0];
const previousTitles = posts.slice(0, 30).map(p => p.title).filter(Boolean);
const prompt = `اكتب دليلًا عربيًا سعوديًا موجزًا ومفيدًا لموقع أدوات خبز. استخدم فقط معلومات المنتج المعطاة، ولا تخترع سعرًا أو مواصفات أو نتائج أو تجربة شخصية. لا تقل إن الكاتب جرّب المنتج. اذكر أن القارئة عليها التحقق من معلومات البائع. لا تستخدم كلامًا مبالغًا فيه ولا تَعِد بنتائج. أخرج JSON صالحًا فقط بالمفاتيح title وexcerpt وbody. اجعل body فقرات نصية مفصولة بسطر فارغ، 180 إلى 260 كلمة، تشرح لمن قد تناسب الأداة وما الذي ينبغي التحقق منه قبل الشراء، ثم بديلًا مجانيًا أو طريقة تقليدية عند الإمكان. لا تكرر عنوانًا سابقًا.\n\nالمنتج: ${JSON.stringify(product)}\nعناوين سابقة يجب تجنبها: ${JSON.stringify(previousTitles)}`;
const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
  method: 'POST',
  headers: {'content-type':'application/json', 'x-goog-api-key':key},
  body: JSON.stringify({model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite', input: prompt})
});
if (!response.ok) throw new Error(`Gemini API returned HTTP ${response.status}: ${(await response.text()).slice(0,500)}`);
const result = await response.json();
let output = result.output_text;
if (!output && Array.isArray(result.steps)) {
  output = result.steps.filter(step => step.type === 'model_output')
    .flatMap(step => step.content ?? []).filter(part => part.type === 'text')
    .map(part => part.text ?? '').join('\n');
}
if (typeof output !== 'string' || !output.trim()) throw new Error('Gemini returned no text output.');
output = output.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
const draft = JSON.parse(output);
for (const field of ['title','excerpt','body']) if (typeof draft[field] !== 'string' || !draft[field].trim()) throw new Error(`Gemini output is missing ${field}.`);
const record = {id: new Date().toISOString().slice(0,10) + '-' + product.id, productId:product.id, publishedAt:new Date().toISOString().slice(0,10), title:draft.title.slice(0,120), excerpt:draft.excerpt.slice(0,300), body:draft.body.slice(0,6000)};
if (posts.some(p => p.id === record.id)) { console.log('A post for this product already exists today.'); process.exit(0); }
posts.unshift(record);
await writeFile('posts.json', JSON.stringify(posts.slice(0,100), null, 2) + '\n');
console.log(`Created informational draft: ${record.title}`);
