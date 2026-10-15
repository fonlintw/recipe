/* =========================================================
   共用設定：選項清單、中英文字典、語言切換
   ========================================================= */

// 後台網址：階段 2 建好 Google Apps Script 後填入。留空 = 試看版（使用範例資料）
window.API_URL = '';

const COUNTIES = [
  { zh: '臺北市', en: 'Taipei City', region: 'north' },
  { zh: '新北市', en: 'New Taipei City', region: 'north' },
  { zh: '基隆市', en: 'Keelung City', region: 'north' },
  { zh: '桃園市', en: 'Taoyuan City', region: 'north' },
  { zh: '新竹市', en: 'Hsinchu City', region: 'north' },
  { zh: '新竹縣', en: 'Hsinchu County', region: 'north' },
  { zh: '宜蘭縣', en: 'Yilan County', region: 'north' },
  { zh: '苗栗縣', en: 'Miaoli County', region: 'central' },
  { zh: '臺中市', en: 'Taichung City', region: 'central' },
  { zh: '彰化縣', en: 'Changhua County', region: 'central' },
  { zh: '南投縣', en: 'Nantou County', region: 'central' },
  { zh: '雲林縣', en: 'Yunlin County', region: 'central' },
  { zh: '嘉義市', en: 'Chiayi City', region: 'south' },
  { zh: '嘉義縣', en: 'Chiayi County', region: 'south' },
  { zh: '臺南市', en: 'Tainan City', region: 'south' },
  { zh: '高雄市', en: 'Kaohsiung City', region: 'south' },
  { zh: '屏東縣', en: 'Pingtung County', region: 'south' },
  { zh: '花蓮縣', en: 'Hualien County', region: 'east' },
  { zh: '臺東縣', en: 'Taitung County', region: 'east' },
  { zh: '澎湖縣', en: 'Penghu County', region: 'east' },
  { zh: '金門縣', en: 'Kinmen County', region: 'east' },
  { zh: '連江縣', en: 'Lienchiang County (Matsu)', region: 'east' },
];

const OPTIONS = {
  region: [
    { id: 'north', zh: '北部', en: 'North' },
    { id: 'central', zh: '中部', en: 'Central' },
    { id: 'south', zh: '南部', en: 'South' },
    { id: 'east', zh: '東部／離島', en: 'East & Islands' },
  ],
  type: [
    { id: 'puro', zh: 'Puro', en: 'Puro' },
    { id: 'acholado', zh: 'Acholado', en: 'Acholado' },
    { id: 'mostoverde', zh: 'Mosto Verde', en: 'Mosto Verde' },
  ],
  flavor: [
    { id: 'sweetsour', zh: '酸甜', en: 'Sweet & Sour' },
    { id: 'strong', zh: '酒感重', en: 'Spirit-forward' },
    { id: 'sparkling', zh: '氣泡', en: 'Sparkling' },
  ],
  brand: [
    { id: 'porton', zh: 'Pisco Portón', en: 'Pisco Portón' },
    { id: 'caravedo', zh: 'Pisco La Caravedo', en: 'Pisco La Caravedo' },
    { id: 'other', zh: '其他', en: 'Other' },
  ],
  grape: [
    { id: 'quebranta', zh: 'Quebranta', en: 'Quebranta' },
    { id: 'negracriolla', zh: 'Negra Criolla', en: 'Negra Criolla' },
    { id: 'mollar', zh: 'Mollar', en: 'Mollar' },
    { id: 'uvina', zh: 'Uvina', en: 'Uvina' },
    { id: 'italia', zh: 'Italia', en: 'Italia' },
    { id: 'torontel', zh: 'Torontel', en: 'Torontel' },
    { id: 'moscatel', zh: 'Moscatel', en: 'Moscatel' },
    { id: 'albilla', zh: 'Albilla', en: 'Albilla' },
    { id: 'unknown', zh: '不確定', en: 'Not sure' },
  ],
};

const I18N = {
  zh: {
    siteName: 'Pisco 酒譜',
    navRecipes: '酒譜',
    navLearn: 'Pisco 學堂',
    submit: '投稿酒譜',
    demoBar: '試看版：目前顯示的是範例酒譜，投稿不會真的送出。',
    heroTitle: '台灣調酒師的 Pisco 酒譜',
    heroSub: '收集全台灣調酒師用 Pisco 調製的創意酒譜。找靈感、學配方，也歡迎分享你的作品。',
    searchPh: '搜尋調酒名稱、調酒師、店家…',
    fRegion: '地區',
    fBrand: 'Pisco 品牌',
    byShort: (name) => `<span class="by-name">By <strong>${name}</strong></span>`,
    featuredLatest: '最新酒譜',
    allRecipes: '所有酒譜',
    typeLocked: (brand, type) => `${brand} 固定為 ${type}`,
    fFlavor: '風味',
    filtering: '篩選條件',
    share: '分享',
    shareTitle: '分享這杯酒譜',
    shareText: (name, bartender) => `${name}（調酒師 ${bartender}）｜台灣調酒師的 Pisco 酒譜`,
    shareMore: '其他 App',
    copyLink: '複製連結',
    copied: '已複製連結',
    done: '完成',
    noFilter: '全部酒譜・點這裡篩選',
    clear: '清除篩選',
    results: (n) => `共 ${n} 杯`,
    emptyTitle: '找不到符合條件的酒譜',
    views: '瀏覽',
    uploaded: '上傳於',
    brand: '品牌',
    type: 'Pisco 種類',
    grape: '葡萄品種',
    location: '店家位置',
    flavor: '風味',
    ingredients: '材料',
    method: '製作方式',
    by: (bartender, bar) => `<span class="by-name">By <strong>${bartender}</strong></span> · ${bar}`,
    footer: '酒譜由各調酒師投稿分享。請理性飲酒，未成年請勿飲酒。',
    warning: '未滿十八歲禁止飲酒',
    // 投稿表單
    sTitle: '投稿你的 Pisco 酒譜',
    sSub: '送出後會先由我們審核，通過後就會刊登在網站上。',
    secPhoto: '調酒照片',
    photoHint: '點這裡選擇照片，或拍一張',
    photoNote: '建議直式或正方形，系統會自動壓縮',
    photoChange: '點照片可以重新選擇',
    secBasic: '調酒資訊',
    cocktailName: '調酒名稱',
    cocktailNamePh: '例如：安地斯晨霧',
    nameHint: '請勿使用攻擊性及歧視性字眼。',
    brandLabel: 'Pisco 品牌',
    brandOtherPh: '請填寫品牌名稱',
    typeLabel: 'Pisco 種類',
    grapeLabel: '葡萄品種（可複選）',
    flavorLabel: '風味（可複選）',
    secRecipe: '酒譜',
    ingLabel: '材料與份量',
    ingItemPh: '材料，例如 Pisco Portón',
    ingAmtPh: 'ml',
    addIng: '＋ 新增一項材料',
    methodLabel: '製作方式',
    methodPh: '一行寫一個步驟，例如：\n所有材料加冰搖盪 12 秒\n雙重過濾倒入冰鎮的雞尾酒杯\n以檸檬皮油裝飾',
    secBar: '店家與調酒師',
    countyLabel: '店家縣市',
    barLabel: '店家名稱',
    bartenderLabel: '調酒師名稱',
    choose: '請選擇',
    consent: '我同意將此酒譜與照片授權刊登於本網站，並確認照片為本人拍攝或已取得授權。',
    cancel: '取消',
    send: '送出審核',
    sending: '送出中…',
    errRequired: '這一欄必填',
    errPick: '請至少選一項',
    errIng: '請至少填一項材料',
    errConsent: '請勾選同意授權',
    errPhoto: '請上傳一張調酒照片',
    errForm: '還有欄位沒填好，請檢查紅色標示的地方',
    errSend: '送出失敗，請稍後再試一次',
    doneTitle: '投稿成功，謝謝你！',
    doneText: '我們審核通過後，你的酒譜就會出現在網站上。',
    doneDemo: '（試看版：這次投稿沒有真的送出）',
    doneBtn: '回到酒譜',
  },
  en: {
    siteName: 'Pisco Recipes',
    navRecipes: 'Recipes',
    navLearn: 'Pisco 101',
    submit: 'Submit',
    demoBar: 'Preview: showing sample recipes. Submissions are not actually sent.',
    heroTitle: 'Pisco Cocktails by Taiwan’s Bartenders',
    heroSub: 'A collection of original Pisco cocktails from bartenders across Taiwan. Find inspiration, learn specs, and share your own.',
    searchPh: 'Search cocktail, bartender, bar…',
    fRegion: 'Region',
    fBrand: 'Pisco brand',
    byShort: (name) => `<span class="by-name">By <strong>${name}</strong></span>`,
    featuredLatest: 'Latest recipes',
    allRecipes: 'All recipes',
    typeLocked: (brand, type) => `${brand} is always ${type}`,
    fFlavor: 'Flavor',
    filtering: 'Filters',
    share: 'Share',
    shareTitle: 'Share this recipe',
    shareText: (name, bartender) => `${name} by ${bartender} | Pisco cocktails from Taiwan`,
    shareMore: 'More apps',
    copyLink: 'Copy link',
    copied: 'Link copied',
    done: 'Done',
    noFilter: 'All recipes · Tap to filter',
    clear: 'Clear filters',
    results: (n) => `${n} cocktail${n === 1 ? '' : 's'}`,
    emptyTitle: 'No recipes match your filters',
    views: 'views',
    uploaded: 'Uploaded',
    brand: 'Brand',
    type: 'Pisco type',
    grape: 'Grape',
    location: 'Location',
    flavor: 'Flavor',
    ingredients: 'Ingredients',
    method: 'Method',
    by: (bartender, bar) => `<span class="by-name">By <strong>${bartender}</strong></span> · ${bar}`,
    footer: 'Recipes are shared by bartenders. Please drink responsibly. Must be of legal drinking age.',
    warning: 'No drinking under 18',
    sTitle: 'Submit your Pisco recipe',
    sSub: 'Submissions are reviewed before being published on the site.',
    secPhoto: 'Photo',
    photoHint: 'Tap to choose or take a photo',
    photoNote: 'Portrait or square works best. Photos are compressed automatically.',
    photoChange: 'Tap the photo to choose another',
    secBasic: 'Cocktail',
    cocktailName: 'Cocktail name',
    cocktailNamePh: 'e.g. Andean Morning Mist',
    nameHint: 'Please do not use offensive or discriminatory words.',
    brandLabel: 'Pisco brand',
    brandOtherPh: 'Brand name',
    typeLabel: 'Pisco type',
    grapeLabel: 'Grape variety (multiple OK)',
    flavorLabel: 'Flavor (multiple OK)',
    secRecipe: 'Recipe',
    ingLabel: 'Ingredients & amounts',
    ingItemPh: 'Ingredient, e.g. Pisco Portón',
    ingAmtPh: 'ml',
    addIng: '+ Add ingredient',
    methodLabel: 'Method',
    methodPh: 'One step per line, e.g.\nShake all ingredients with ice for 12 sec\nDouble strain into a chilled coupe\nExpress lemon peel',
    secBar: 'Bar & bartender',
    countyLabel: 'City / County',
    barLabel: 'Bar name',
    bartenderLabel: 'Bartender name',
    choose: 'Select',
    consent: 'I agree to let this site publish this recipe and photo, and confirm the photo is mine or I have permission to use it.',
    cancel: 'Cancel',
    send: 'Submit for review',
    sending: 'Sending…',
    errRequired: 'Required',
    errPick: 'Pick at least one',
    errIng: 'Add at least one ingredient',
    errConsent: 'Please agree to continue',
    errPhoto: 'Please add a photo',
    errForm: 'Some fields need attention (marked in red).',
    errSend: 'Could not send. Please try again.',
    doneTitle: 'Thank you for sharing!',
    doneText: 'Your recipe will appear on the site once it’s approved.',
    doneDemo: '(Preview mode: nothing was actually sent.)',
    doneBtn: 'Back to recipes',
  },
};

/* ---------- 語言 ---------- */
function getLang() {
  try {
    const saved = localStorage.getItem('pisco_lang');
    if (saved === 'zh' || saved === 'en') return saved;
  } catch (e) {}
  return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}
window.LANG = getLang();

function t(key, ...args) {
  const v = (I18N[window.LANG] && I18N[window.LANG][key]) ?? I18N.zh[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
}
function optLabel(group, id) {
  const o = OPTIONS[group].find((x) => x.id === id);
  return o ? o[window.LANG] : id;
}
function countyInfo(zhName) {
  return COUNTIES.find((c) => c.zh === zhName);
}
function countyLabel(zhName) {
  const c = countyInfo(zhName);
  return c ? c[window.LANG] : zhName;
}

function applyStaticI18n() {
  document.documentElement.lang = window.LANG === 'en' ? 'en' : 'zh-Hant';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  const toggle = document.getElementById('langToggle');
  if (toggle) toggle.textContent = window.LANG === 'zh' ? 'EN' : '中文';
}

function setupLangToggle(onChange) {
  const toggle = document.getElementById('langToggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    window.LANG = window.LANG === 'zh' ? 'en' : 'zh';
    try { localStorage.setItem('pisco_lang', window.LANG); } catch (e) {}
    applyStaticI18n();
    if (onChange) onChange();
  });
}

// 上傳日期：中文 2026/10/12，英文 Oct 12, 2026
function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  if (window.LANG === 'en') {
    const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
    return `${mon} ${d}, ${y}`;
  }
  return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const ICONS = {
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
};

/* =========================================================
   捲動效果：淡入、視差、黏住的導覽列、進度條、回到頂端
   ========================================================= */
(function initMotion() {
  const root = document.documentElement;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. 淡入：看到哪裡、哪裡就淡入
  window.observeReveal = function () {};
  if ('IntersectionObserver' in window) {
    root.classList.add('js-motion');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    window.observeReveal = function (scope) {
      (scope || document).querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
    };
  }

  // 靜態內容自動加上淡入，同一排的依序出現
  const AUTO = [
    '.section-head', '.filters',
    '.article .draft-note', '.article h2', '.article h3', '.article section > p', '.article section > ul',
    '.article .info-card', '.article .table-wrap', '.article .spec-recipe',
  ].join(',');
  function tagStatic() {
    document.querySelectorAll(AUTO).forEach((el) => {
      el.classList.add('reveal');
      if (el.matches('.info-card')) el.style.setProperty('--d', ([...el.parentNode.children].indexOf(el) % 3) * 110 + 'ms');
      if (el.matches('.spec-recipe')) el.classList.add('reveal-photo');
    });
    window.observeReveal();
  }

  // 2. 導覽列、進度條、回到頂端、視差
  function setup() {
    tagStatic();
    const header = document.querySelector('.site-header');
    const top = header && header.querySelector('.header-top');
    const nav = header && header.querySelector('.main-nav');

    // 導覽列黏住時，左邊出現小 Logo、右邊出現投稿按鈕
    if (nav && top) {
      const logo = top.querySelector('.brand');
      const mini = document.createElement('a');
      mini.className = 'nav-mini nav-mini-logo';
      mini.href = logo ? logo.getAttribute('href') : 'index.html';
      mini.setAttribute('aria-label', 'Home');
      mini.innerHTML = '<img src="assets/img/porton-logo.png" alt="">';
      nav.prepend(mini);
      const big = top.querySelector('#openSubmit, a.btn-primary');
      if (big) {
        const wrap = document.createElement('div');
        wrap.className = 'nav-mini nav-mini-submit';
        const b = document.createElement(big.tagName === 'A' ? 'a' : 'button');
        b.className = 'btn btn-primary';
        if (b.tagName === 'A') b.href = big.getAttribute('href'); else b.type = 'button';
        b.innerHTML = big.innerHTML;
        if (b.tagName === 'BUTTON') b.addEventListener('click', () => big.click());
        wrap.appendChild(buildMiniSearch());
        wrap.appendChild(b);
        nav.appendChild(wrap);
      }
    }

    // 黏住的導覽列裡的搜尋：按放大鏡會在原地展開搜尋欄，不會跳回最上方
    function buildMiniSearch() {
      const box = document.createElement('div');
      box.className = 'mini-search';
      box.innerHTML = `
        <button type="button" class="mini-search-btn" aria-label="Search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        </button>
        <input type="search" class="mini-search-input" enterkeyhint="search" autocomplete="off" data-i18n-ph="searchPh" placeholder="${t('searchPh')}" tabindex="-1">`;
      const btn = box.querySelector('.mini-search-btn');
      const input = box.querySelector('.mini-search-input');
      const main = document.getElementById('search');  // 首頁的主搜尋列（學堂頁沒有）
      function open() {
        header.classList.add('searching');
        if (main) input.value = main.value;
        input.tabIndex = 0;
        setTimeout(() => input.focus(), 50);
      }
      function close() {
        header.classList.remove('searching');
        input.tabIndex = -1;
        input.blur();
      }
      btn.addEventListener('click', () => (header.classList.contains('searching') ? close() : open()));
      input.addEventListener('input', () => {
        if (!main) return;
        main.value = input.value;
        main.dispatchEvent(new Event('input'));
        // 篩選完讓結果停在畫面上（結果變少時頁面會變短，避免畫面亂跳）
        setTimeout(() => {
          const target = document.getElementById('allRecipes');
          if (!target) return;
          const top = target.getBoundingClientRect().top;
          if (top < 0 || top > window.innerHeight * 0.5) {
            window.scrollTo({ top: top + window.scrollY - 70 });
          }
        }, 200);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { close(); return; }
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (main) {
          const target = document.getElementById('allRecipes');
          if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
          input.blur();
        } else if (input.value.trim()) {
          location.href = 'index.html#q=' + encodeURIComponent(input.value.trim());
        }
      });
      // 點搜尋欄以外的地方、而且沒有輸入文字時，自動收起
      document.addEventListener('click', (e) => {
        if (header.classList.contains('searching') && !box.contains(e.target) && !input.value) close();
      });
      window.__closeMiniSearch = close;
      return box;
    }
    function measure() { if (top) root.style.setProperty('--top-h', top.offsetHeight + 'px'); }
    measure();
    window.addEventListener('resize', measure);

    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    const toTop = document.createElement('button');
    toTop.type = 'button';
    toTop.className = 'to-top';
    toTop.setAttribute('aria-label', 'Back to top');
    toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
    document.body.appendChild(toTop);

    const parallax = document.querySelectorAll('.block-navy');
    let ticking = false;
    function onScroll() {
      ticking = false;
      const y = window.scrollY;
      const topH = top ? top.offsetHeight : 0;
      if (header) {
        header.classList.toggle('compact', y > topH);
        if (y <= topH && header.classList.contains('searching') && window.__closeMiniSearch) window.__closeMiniSearch();
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      toTop.classList.toggle('show', y > window.innerHeight * 1.2);
      if (!reduce) {
        parallax.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom > 0 && r.top < window.innerHeight) el.style.setProperty('--py', (-r.top * 0.3).toFixed(1) + 'px');
        });
      }
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();

// 頁尾年份自動更新
document.querySelectorAll('.footer-year').forEach((el) => { el.textContent = new Date().getFullYear(); });
