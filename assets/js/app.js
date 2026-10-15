/* =========================================================
   酒譜首頁：卡片牆、篩選、收藏、瀏覽數、投稿表單
   ========================================================= */
(function () {
  const state = {
    recipes: [],
    filters: { region: new Set(), brand: new Set(), flavor: new Set() },
    favOnly: false,
    query: '',
  };
  const isDemo = !window.API_URL;

  /* ---------- 收藏（只存在這台裝置） ---------- */
  const FAV_KEY = 'pisco_favs';
  let favs = new Set();
  try { favs = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch (e) {}
  function saveFavs() {
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...favs])); } catch (e) {}
  }
  function toggleFav(id) {
    if (favs.has(id)) favs.delete(id); else favs.add(id);
    saveFavs();
    toast(favs.has(id) ? t('toastFavOn') : t('toastFavOff'));
    return favs.has(id);
  }

  /* ---------- 讀取酒譜 ---------- */
  async function loadRecipes() {
    if (isDemo) {
      state.recipes = window.SAMPLE_RECIPES.slice();
    } else {
      try {
        const res = await fetch(window.API_URL + '?action=list');
        const data = await res.json();
        state.recipes = data.recipes || [];
      } catch (e) {
        state.recipes = [];
      }
    }
    state.recipes.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    state.recipes.forEach((r) => {
      const c = countyInfo(r.county);
      r.region = c ? c.region : '';
    });
  }

  /* ---------- 瀏覽數：同一個分頁期間，同一杯只算一次 ---------- */
  function countView(recipe) {
    const key = 'pisco_viewed_' + recipe.id;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch (e) {}
    recipe.views = (recipe.views || 0) + 1;
    if (!isDemo) {
      fetch(window.API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'view', id: recipe.id }),
      }).catch(() => {});
    }
  }
  function fmtViews(n) {
    n = n || 0;
    if (window.LANG === 'zh') return n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') + ' 萬' : n.toLocaleString();
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
  }

  /* ---------- 篩選按鈕 ---------- */
  function renderChips() {
    ['region', 'brand', 'flavor'].forEach((group) => {
      const box = document.getElementById('chips-' + group);
      box.innerHTML = OPTIONS[group].map((o) => `
        <button type="button" class="chip" data-group="${group}" data-id="${o.id}"
          aria-pressed="${state.filters[group].has(o.id)}">${escapeHtml(o[window.LANG])}</button>`).join('');
    });
  }
  document.querySelector('.filters').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip[data-group]');
    if (!chip) return;
    const set = state.filters[chip.dataset.group];
    const id = chip.dataset.id;
    if (set.has(id)) set.delete(id); else set.add(id);
    chip.setAttribute('aria-pressed', set.has(id));
    renderGrid();
  });

  const favToggle = document.getElementById('favToggle');
  favToggle.addEventListener('click', () => {
    state.favOnly = !state.favOnly;
    renderGrid();
  });
  document.getElementById('clearFilters').addEventListener('click', clearFilters);
  function clearFilters() {
    Object.values(state.filters).forEach((s) => s.clear());
    state.favOnly = false;
    state.query = '';
    document.getElementById('search').value = '';
    renderChips();
    renderGrid();
  }
  let searchTimer;
  // 在最上方搜尋列按 Enter，就捲到下方的搜尋結果
  document.getElementById('search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      state.query = e.target.value.trim().toLowerCase();
      renderGrid();
      e.target.blur();
      document.getElementById('allRecipes').scrollIntoView({ behavior: 'smooth' });
    }
  });
  document.getElementById('search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.query = e.target.value.trim().toLowerCase(); renderGrid(); }, 150);
  });

  function matches(r) {
    const f = state.filters;
    if (f.region.size && !f.region.has(r.region)) return false;
    if (f.brand.size && !f.brand.has(r.brand)) return false;
    if (f.flavor.size && !(r.flavors || []).some((x) => f.flavor.has(x))) return false;
    if (state.favOnly && !favs.has(r.id)) return false;
    if (state.query) {
      const hay = [r.name, r.bartender, r.bar, r.county, countyLabel(r.county), brandName(r)].join(' ').toLowerCase();
      if (!hay.includes(state.query)) return false;
    }
    return true;
  }
  function brandName(r) {
    return r.brand === 'other' && r.brandOther ? r.brandOther : optLabel('brand', r.brand);
  }

  /* ---------- 最新酒譜：最新的 4 杯 ---------- */
  function renderFeatured() {
    const box = document.getElementById('featured');
    if (!state.recipes.length) { box.hidden = true; return; }
    box.hidden = false;
    document.getElementById('featuredList').innerHTML = state.recipes.slice(0, 4).map((r, i) => `
      <button type="button" class="feature-item reveal reveal-photo" style="--d:${i * 110}ms" data-open="${escapeHtml(r.id)}">
        <span class="feature-thumb"><img src="${escapeHtml(r.photo)}" alt="" loading="lazy"></span>
        <span class="feature-text">
          <span class="kicker">${escapeHtml(optLabel('region', r.region))} · ${escapeHtml(brandName(r))}</span>
          <span class="feature-item-title">${escapeHtml(r.name)}</span>
          <span class="by">${t('byShort', escapeHtml(r.bartender))}</span>
          <span class="date">${fmtDate(r.date)}</span>
        </span>
      </button>`).join('');
    window.observeReveal(box);
  }
  document.getElementById('featured').addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]');
    if (b) openRecipe(b.dataset.open);
  });

  /* ---------- 卡片牆 ---------- */
  function renderGrid() {
    const list = state.recipes.filter(matches);
    const grid = document.getElementById('grid');
    grid.innerHTML = list.map(cardHtml).join('');
    window.observeReveal(grid);
    const hasFilter = state.favOnly || state.query || Object.values(state.filters).some((s) => s.size);
    document.getElementById('resultCount').textContent = t('results', list.length);
    document.getElementById('clearFilters').hidden = !hasFilter;
    favToggle.setAttribute('aria-pressed', state.favOnly);
    favToggle.querySelector('.fav-count').textContent = favs.size ? `(${favs.size})` : '';
    const empty = document.getElementById('empty');
    empty.hidden = list.length > 0;
    empty.querySelector('p').textContent = state.favOnly && favs.size === 0 ? t('emptyFav') : t('emptyTitle');
  }

  function cardHtml(r, i) {
    const fav = favs.has(r.id);
    return `
      <article class="card reveal" style="--d:${(i % 4) * 90}ms" data-id="${escapeHtml(r.id)}" tabindex="0" role="button" aria-label="${escapeHtml(r.name)}">
        <div class="card-media">
          <img src="${escapeHtml(r.photo)}" alt="" loading="lazy">
          <button type="button" class="fav-btn" data-fav="${escapeHtml(r.id)}" aria-pressed="${fav}" aria-label="${t('favAdd')}">${ICONS.heart}</button>
        </div>
        <div class="card-body">
          <p class="kicker">${escapeHtml(optLabel('region', r.region))} · ${escapeHtml(brandName(r))}</p>
          <h3>${escapeHtml(r.name)}</h3>
          <p class="card-meta">${t('byShort', escapeHtml(r.bartender))} · ${escapeHtml(r.bar)}</p>
          <p class="card-flavors">${(r.flavors || []).map((f) => escapeHtml(optLabel('flavor', f))).join(' / ')}</p>
          <div class="card-foot">
            <span>${ICONS.calendar}${fmtDate(r.date)}</span>
            <span>${ICONS.eye}${fmtViews(r.views)}</span>
          </div>
        </div>
      </article>`;
  }

  const grid = document.getElementById('grid');
  grid.addEventListener('click', (e) => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.stopPropagation();
      const on = toggleFav(favBtn.dataset.fav);
      favBtn.setAttribute('aria-pressed', on);
      favBtn.classList.remove('pop'); void favBtn.offsetWidth; favBtn.classList.add('pop');
      if (state.favOnly) renderGrid();
      else favToggle.querySelector('.fav-count').textContent = favs.size ? `(${favs.size})` : '';
      return;
    }
    const card = e.target.closest('.card');
    if (card) openRecipe(card.dataset.id);
  });
  grid.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')) {
      e.preventDefault();
      openRecipe(e.target.dataset.id);
    }
  });

  /* ---------- 酒譜跳出視窗 ---------- */
  const recipeModal = document.getElementById('recipeModal');
  let currentId = null;

  function openRecipe(id) {
    const r = state.recipes.find((x) => x.id === id);
    if (!r) return;
    currentId = id;
    countView(r);
    renderRecipe(r);
    openDialog(recipeModal);
    history.replaceState(null, '', '#r=' + encodeURIComponent(id));
  }

  function renderRecipe(r) {
    const fav = favs.has(r.id);
    const steps = String(r.method || '').split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const grapes = (r.grapes || []).map((g) => optLabel('grape', g)).join(window.LANG === 'en' ? ', ' : '、');
    recipeModal.querySelector('.recipe-media').innerHTML = `<img src="${escapeHtml(r.photo)}" alt="${escapeHtml(r.name)}">`;
    recipeModal.querySelector('.recipe-content').innerHTML = `
      <div class="card-tags">${(r.flavors || []).map((f) => `<span class="tag">${escapeHtml(optLabel('flavor', f))}</span>`).join('')}</div>
      <h2 id="recipeTitle">${escapeHtml(r.name)}</h2>
      <p class="recipe-by">${t('by', escapeHtml(r.bartender), escapeHtml(r.bar))}</p>
      <div class="recipe-stats">
        <span>${ICONS.pin}${escapeHtml(countyLabel(r.county))} · ${escapeHtml(optLabel('region', r.region))}</span>
        <span>${ICONS.calendar}${t('uploaded')} ${fmtDate(r.date)}</span>
        <span>${ICONS.eye}${fmtViews(r.views)} ${t('views')}</span>
        <button type="button" class="fav-inline" aria-pressed="${fav}">${ICONS.heart}<span>${fav ? t('favAdded') : t('favAdd')}</span></button>
      </div>
      <dl class="facts">
        <div class="fact"><dt>${t('brand')}</dt><dd>${escapeHtml(brandName(r))}</dd></div>
        <div class="fact"><dt>${t('type')}</dt><dd>${escapeHtml(optLabel('type', r.piscoType))}</dd></div>
        <div class="fact" style="grid-column:1/-1"><dt>${t('grape')}</dt><dd>${escapeHtml(grapes || '—')}</dd></div>
      </dl>
      <div class="recipe-section">
        <h4>${t('ingredients').toUpperCase()}</h4>
        <ul class="ingredients">${(r.ingredients || []).map(([item, amt]) => `<li><span>${escapeHtml(item)}</span><span>${escapeHtml(amt)}</span></li>`).join('')}</ul>
      </div>
      <div class="recipe-section">
        <h4>${t('method').toUpperCase()}</h4>
        <ol class="method">${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
      </div>
      <p class="modal-warning">${t('warning').split(/　| · /).map((x) => `<span>${escapeHtml(x)}</span>`).join('')}</p>`;
    recipeModal.querySelector('.fav-inline').addEventListener('click', (e) => {
      const on = toggleFav(r.id);
      const btn = e.currentTarget;
      btn.setAttribute('aria-pressed', on);
      btn.querySelector('span').textContent = on ? t('favAdded') : t('favAdd');
      renderGrid();
    });
  }

  recipeModal.addEventListener('close', () => {
    currentId = null;
    history.replaceState(null, '', location.pathname + location.search);
    renderGrid();
  });

  /* ---------- 視窗開關（共用） ---------- */
  function openDialog(dlg) {
    if (!dlg.open) dlg.showModal();
    document.body.classList.add('no-scroll');
    const panel = dlg.querySelector('.modal-panel');
    const scroller = dlg.querySelector('.recipe-content, .submit-body');
    if (scroller) scroller.scrollTop = 0;
    if (panel) panel.scrollTop = 0;
  }
  document.querySelectorAll('dialog').forEach((dlg) => {
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => {
      if (!document.querySelector('dialog[open]')) document.body.classList.remove('no-scroll');
    });
    dlg.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dlg.close()));
  });

  /* ---------- 提示訊息 ---------- */
  let toastTimer;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  /* =========================================================
     投稿表單
     ========================================================= */
  const submitModal = document.getElementById('submitModal');
  const form = document.getElementById('submitForm');
  let photoData = null; // 壓縮後的照片（base64）

  document.getElementById('openSubmit').addEventListener('click', () => {
    resetForm();
    openDialog(submitModal);
  });

  function buildFormOptions() {
    const sel = form.elements.brand;
    const keepBrand = sel.value;
    sel.innerHTML = `<option value="">${t('choose')}</option>` +
      OPTIONS.brand.map((o) => `<option value="${o.id}">${escapeHtml(o[window.LANG])}</option>`).join('');
    sel.value = keepBrand;

    const typeSel = form.elements.piscoType;
    const keepType = typeSel.value;
    typeSel.innerHTML = `<option value="">${t('choose')}</option>` +
      OPTIONS.type.map((o) => `<option value="${o.id}">${escapeHtml(o[window.LANG])}</option>`).join('');
    typeSel.value = keepType;

    const county = form.elements.county;
    const keepCounty = county.value;
    const groups = OPTIONS.region.map((reg) => `<optgroup label="${escapeHtml(reg[window.LANG])}">` +
      COUNTIES.filter((c) => c.region === reg.id).map((c) => `<option value="${c.zh}">${escapeHtml(c[window.LANG])}</option>`).join('') +
      '</optgroup>').join('');
    county.innerHTML = `<option value="">${t('choose')}</option>` + groups;
    county.value = keepCounty;

    ['grape', 'flavor'].forEach((group) => {
      const box = document.getElementById('checks-' + group);
      const checked = new Set([...box.querySelectorAll('input:checked')].map((i) => i.value));
      box.innerHTML = OPTIONS[group].map((o) => `
        <label class="check-pill"><input type="checkbox" name="${group}" value="${o.id}" ${checked.has(o.id) ? 'checked' : ''}><span>${escapeHtml(o[window.LANG])}</span></label>`).join('');
    });
    applyBrandLock(false);
    document.querySelectorAll('.ing-row').forEach((row) => {
      row.querySelector('.ing-item').placeholder = t('ingItemPh');
      row.querySelector('.ing-amt').placeholder = t('ingAmtPh');
    });
  }

  // 選 Portón 固定 Mosto Verde、選 La Caravedo 固定 Puro；選「其他」才可自由選種類
  const BRAND_TYPE_LOCK = { porton: 'mostoverde', caravedo: 'puro' };
  function applyBrandLock(fromUser) {
    const brand = form.elements.brand.value;
    const typeSel = form.elements.piscoType;
    const locked = BRAND_TYPE_LOCK[brand];
    const hint = document.getElementById('typeLockHint');
    document.getElementById('brandOtherField').hidden = brand !== 'other';
    if (locked) {
      typeSel.value = locked;
      typeSel.disabled = true;
      hint.textContent = t('typeLocked', optLabel('brand', brand), optLabel('type', locked));
      hint.hidden = false;
      typeSel.closest('.field').classList.remove('invalid');
    } else {
      if (typeSel.disabled && fromUser) typeSel.value = '';
      typeSel.disabled = false;
      hint.hidden = true;
    }
  }
  form.elements.brand.addEventListener('change', () => applyBrandLock(true));

  /* 材料列 */
  const ingRows = document.getElementById('ingRows');
  function addIngRow(item = '', amt = '') {
    const row = document.createElement('div');
    row.className = 'ing-row';
    row.innerHTML = `
      <input class="input ing-item" maxlength="80" placeholder="${escapeHtml(t('ingItemPh'))}" value="${escapeHtml(item)}">
      <input class="input ing-amt" maxlength="30" placeholder="${escapeHtml(t('ingAmtPh'))}" value="${escapeHtml(amt)}">
      <button type="button" class="remove" aria-label="remove">${ICONS.close.replace('<svg', '<svg width="16" height="16"')}</button>`;
    row.querySelector('.remove').addEventListener('click', () => {
      if (ingRows.children.length > 1) row.remove();
      else row.querySelectorAll('input').forEach((i) => (i.value = ''));
    });
    ingRows.appendChild(row);
  }
  document.getElementById('addIng').addEventListener('click', () => {
    addIngRow();
    ingRows.lastElementChild.querySelector('input').focus();
  });

  /* 照片：選好後先在手機/電腦上壓縮，再上傳 */
  const photoInput = document.getElementById('photoInput');
  const photoDrop = document.getElementById('photoDrop');
  photoInput.addEventListener('change', async () => {
    const file = photoInput.files[0];
    if (!file) return;
    try {
      photoData = await compressImage(file, 1600, 0.82);
      photoDrop.classList.add('has-img');
      photoDrop.querySelector('.photo-preview').innerHTML = `<img src="${photoData}" alt="">`;
      photoDrop.querySelector('.photo-empty').hidden = true;
      photoDrop.closest('.field').classList.remove('invalid');
    } catch (e) {
      photoData = null;
      toast(t('errPhoto'));
    }
  });

  function compressImage(file, maxSide, quality) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
      img.src = url;
    });
  }

  function resetForm() {
    form.reset();
    form.hidden = false;
    document.getElementById('submitDone').hidden = true;
    submitModal.querySelector('.submit-foot').hidden = false;
    photoData = null;
    photoDrop.classList.remove('has-img');
    photoDrop.querySelector('.photo-preview').innerHTML = '';
    photoDrop.querySelector('.photo-empty').hidden = false;
    document.getElementById('brandOtherField').hidden = true;
    ingRows.innerHTML = '';
    addIngRow(); addIngRow(); addIngRow();
    form.querySelectorAll('.field.invalid').forEach((f) => f.classList.remove('invalid'));
    buildFormOptions();
  }

  function setInvalid(el, bad) {
    const field = el.closest('.field');
    field.classList.toggle('invalid', bad);
    return !bad;
  }

  function collect() {
    const fd = form.elements;
    const ingredients = [...ingRows.querySelectorAll('.ing-row')]
      .map((row) => [row.querySelector('.ing-item').value.trim(), row.querySelector('.ing-amt').value.trim()])
      .filter(([item]) => item);
    return {
      name: fd.name.value.trim(),
      brand: fd.brand.value,
      brandOther: fd.brandOther.value.trim(),
      piscoType: fd.piscoType.value,
      grapes: [...form.querySelectorAll('input[name="grape"]:checked')].map((i) => i.value),
      flavors: [...form.querySelectorAll('input[name="flavor"]:checked')].map((i) => i.value),
      ingredients,
      method: fd.method.value.trim(),
      county: fd.county.value,
      bar: fd.bar.value.trim(),
      bartender: fd.bartender.value.trim(),
      consent: fd.consent.checked,
      website: fd.website.value, // 防機器人用的隱藏欄位
      photo: photoData,
    };
  }

  function validate(d) {
    const fd = form.elements;
    let ok = true;
    ok = setInvalid(photoInput, !d.photo) && ok;
    ok = setInvalid(fd.name, !d.name) && ok;
    ok = setInvalid(fd.brand, !d.brand) && ok;
    if (d.brand === 'other') ok = setInvalid(fd.brandOther, !d.brandOther) && ok;
    ok = setInvalid(fd.piscoType, !d.piscoType) && ok;
    ok = setInvalid(document.getElementById('checks-grape'), d.grapes.length === 0) && ok;
    ok = setInvalid(document.getElementById('checks-flavor'), d.flavors.length === 0) && ok;
    ok = setInvalid(ingRows, d.ingredients.length === 0) && ok;
    ok = setInvalid(fd.method, !d.method) && ok;
    ok = setInvalid(fd.county, !d.county) && ok;
    ok = setInvalid(fd.bar, !d.bar) && ok;
    ok = setInvalid(fd.bartender, !d.bartender) && ok;
    ok = setInvalid(fd.consent, !d.consent) && ok;
    return ok;
  }

  // 修正欄位後，紅框自動消失
  form.addEventListener('input', (e) => {
    const field = e.target.closest('.field');
    if (field) field.classList.remove('invalid');
  });
  form.addEventListener('change', (e) => {
    const field = e.target.closest('.field');
    if (field) field.classList.remove('invalid');
  });

  const sendBtn = document.getElementById('sendBtn');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = collect();
    if (!validate(data)) {
      toast(t('errForm'));
      const first = form.querySelector('.field.invalid');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (data.website) return; // 機器人填了隱藏欄位，直接忽略
    sendBtn.disabled = true;
    sendBtn.querySelector('span').textContent = t('sending');
    try {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 700));
      } else {
        const res = await fetch(window.API_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'submit', lang: window.LANG, ...data }),
        });
        const out = await res.json();
        if (!out.ok) throw new Error(out.error || 'fail');
      }
      form.hidden = true;
      submitModal.querySelector('.submit-foot').hidden = true;
      document.getElementById('doneDemo').hidden = !isDemo;
      document.getElementById('submitDone').hidden = false;
    } catch (err) {
      toast(t('errSend'));
    } finally {
      sendBtn.disabled = false;
      sendBtn.querySelector('span').textContent = t('send');
    }
  });

  /* ---------- 切換語言時重畫 ---------- */
  function rerenderAll() {
    renderChips();
    renderFeatured();
    renderGrid();
    buildFormOptions();
    if (currentId) {
      const r = state.recipes.find((x) => x.id === currentId);
      if (r) renderRecipe(r);
    }
  }

  /* ---------- 啟動 ---------- */
  async function init() {
    document.getElementById('demoBar').hidden = !isDemo;
    applyStaticI18n();
    setupLangToggle(rerenderAll);
    renderChips();
    resetForm();
    await loadRecipes();
    renderFeatured();
    renderGrid();
    // 支援分享連結：網址後面帶 #r=酒譜編號 會直接打開那杯
    const m = location.hash.match(/^#r=(.+)$/);
    if (m) openRecipe(decodeURIComponent(m[1]));
    // 從學堂頁點「投稿酒譜」過來時，直接打開表單
    if (location.hash === '#submit') {
      history.replaceState(null, '', location.pathname + location.search);
      openDialog(submitModal);
    }
  }
  init();
})();
