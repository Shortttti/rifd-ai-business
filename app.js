const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const urlIsSafe = value => { try { const u = new URL(value); return u.protocol === 'https:'; } catch { return false; } };
async function loadJson(path, fallback) { try { const response = await fetch(path, {cache:'no-store'}); if (!response.ok) throw new Error('fetch'); return await response.json(); } catch { return fallback; } }
function renderTools(products) {
  const grid = document.querySelector('#toolGrid');
  grid.innerHTML = products.map((p, i) => `<article class="tool-card" style="animation-delay:${i * .06}s"><div class="tool-icon">${['⚖','♨','▦','⌁'][i % 4]}</div><span class="tool-category">${escapeHtml(p.category)}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.description)}</p><div class="check-box"><b>قبل الاختيار</b><span>${escapeHtml(p.whatToCheck)}</span></div>${urlIsSafe(p.affiliateUrl) ? `<a class="tool-link" href="${escapeHtml(p.affiliateUrl)}" target="_blank" rel="sponsored nofollow noopener">شاهدي المنتج لدى المتجر ↗</a>` : '<span class="inactive-link">رابط المتجر غير مفعّل بعد</span>'}</article>`).join('');
  const active = products.some(p => urlIsSafe(p.affiliateUrl));
  document.querySelector('#affiliateNote').classList.toggle('active-note', active);
  document.querySelector('#affiliateNote p').textContent = active ? 'قد نكسب عمولة من المشتريات المؤهلة عبر بعض الروابط، دون تكلفة إضافية عليك. هذه التوصيات لا تعني أننا جرّبنا المنتج.' : 'روابط الشراء غير مفعّلة الآن. عند ربط برنامج العمولة سنوضح أي رابط قد يكسبنا عمولة، دون تكلفة إضافية عليك.';
}
function renderPosts(posts, products) {
  const grid = document.querySelector('#articleGrid');
  const valid = [...posts].filter(p => p && p.title && p.body).sort((a,b) => String(b.publishedAt).localeCompare(String(a.publishedAt))).slice(0,6);
  document.querySelector('#emptyPosts').hidden = valid.length > 0;
  grid.innerHTML = valid.map((p, i) => {
    const product = products.find(x => x.id === p.productId);
    const paras = String(p.body).split(/\n\s*\n/).map(part => `<p>${escapeHtml(part).replace(/\n/g,'<br>')}</p>`).join('');
    return `<article class="article-card" style="animation-delay:${i*.06}s"><span class="article-date">دليل معلوماتي · ${escapeHtml(p.publishedAt || '')}</span><h3>${escapeHtml(p.title)}</h3><p class="article-excerpt">${escapeHtml(p.excerpt || '')}</p><details><summary>اقرئي الدليل <b>＋</b></summary><div class="article-body">${paras}${product && urlIsSafe(product.affiliateUrl) ? `<a class="tool-link" href="${escapeHtml(product.affiliateUrl)}" target="_blank" rel="sponsored nofollow noopener">تفاصيل المنتج في المتجر ↗</a>` : ''}<small>مسودة معلوماتية مولّدة آليًا؛ تحققي من معلومات البائع قبل الشراء. لا تمثل تجربة شخصية.</small></div></details></article>`;
  }).join('');
}
(async () => {
  document.querySelector('#year').textContent = new Date().getFullYear();
  const [products, posts] = await Promise.all([loadJson('products.json', []), loadJson('posts.json', [])]);
  renderTools(products);
  renderPosts(posts, products);
})();
