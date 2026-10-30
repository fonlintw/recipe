/* =========================================================
   Pisco 酒譜：Google 後台（貼到 Google 試算表的 Apps Script）
   - 收投稿：資料寫進試算表、照片存進雲端硬碟、寄信通知
   - 審核：把「狀態」改成「通過」就會上架，並自動翻譯成英文
   - 網站讀取已通過的酒譜、累計瀏覽數
   ========================================================= */

const SHEET_NAME = '酒譜';
const FOLDER_NAME = 'Pisco 酒譜投稿照片';
const STATUS = { pending: '待審核', approved: '通過', rejected: '退回' };

// 欄位順序（第一列標題）。key 是程式用的名字，label 是試算表上看到的標題
const COLUMNS = [
  ['status', '狀態'],
  ['photoPreview', '照片'],
  ['name', '酒名'],
  ['bartender', '調酒師'],
  ['bar', '店家'],
  ['county', '縣市'],
  ['brand', '品牌'],
  ['brandOther', '其他品牌名稱'],
  ['piscoType', 'Pisco 種類'],
  ['grapes', '葡萄品種'],
  ['flavors', '風味'],
  ['ingredients', '材料（一行一項：材料 | 份量）'],
  ['method', '做法'],
  ['name_en', '英文酒名'],
  ['bartender_en', '英文調酒師名'],
  ['ingredients_en', '英文材料'],
  ['method_en', '英文做法'],
  ['date', '上架日期'],
  ['views', '瀏覽數'],
  ['submittedAt', '投稿時間'],
  ['lang', '投稿語言'],
  ['photo', '照片網址'],
  ['id', '編號'],
  ['bar_en', '英文店家名'],
  ['badges', '標籤（例：經典、本月推薦、店長精選，多個用逗號分開）'],
];
const COL = {};
COLUMNS.forEach(([key], i) => { COL[key] = i + 1; });

const ALLOWED = {
  brand: ['porton', 'caravedo', 'other'],
  piscoType: ['puro', 'mostoverde', 'acholado'],
  grapes: ['quebranta', 'negracriolla', 'mollar', 'uvina', 'italia', 'torontel', 'moscatel', 'albilla', 'acholado', 'unknown'],
  flavors: ['sweetsour', 'strong', 'sparkling'],
};

/* ---------- 第一次設定：建立標題列、照片資料夾、審核觸發器 ---------- */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME, 0);
  sh.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS.map((c) => c[1])])
    .setFontWeight('bold').setBackground('#f3f3f3');
  sh.setFrozenRows(1);
  sh.setFrozenColumns(3);
  sh.setColumnWidth(COL.photoPreview, 110);
  sh.setColumnWidth(COL.ingredients, 260);
  sh.setColumnWidth(COL.method, 320);
  sh.setColumnWidth(COL.ingredients_en, 260);
  sh.setColumnWidth(COL.method_en, 320);
  // 狀態欄做成下拉選單
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList([STATUS.pending, STATUS.approved, STATUS.rejected], true).build();
  sh.getRange(2, COL.status, sh.getMaxRows() - 1, 1).setDataValidation(rule);
  // 不同狀態不同底色
  const range = sh.getRange(2, COL.status, sh.getMaxRows() - 1, 1);
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(STATUS.pending).setBackground('#fff4cc').setRanges([range]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(STATUS.approved).setBackground('#d9f2d9').setRanges([range]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(STATUS.rejected).setBackground('#f4d6d6').setRanges([range]).build(),
  ]);
  // 刪掉預設的空白工作表
  const blank = ss.getSheetByName('工作表1') || ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);

  getFolder();
  // 審核觸發器：改狀態時自動處理（只裝一次）
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'onStatusEdit')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onStatusEdit').forSpreadsheet(ss).onEdit().create();
  // 先試一次翻譯與寄信權限，讓授權一次問完
  LanguageApp.translate('測試', 'zh-TW', 'en');
  MailApp.getRemainingDailyQuota();
  SpreadsheetApp.getUi().alert('設定完成！接下來請「部署」成網頁應用程式。');
}

function getFolder() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) {}
  }
  const folder = DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

/* ---------- 試算表上方的選單 ---------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Pisco 酒譜')
    .addItem('補翻譯：已通過但還沒有英文的酒譜', 'translateMissing')
    .addToUi();
}

/* ---------- 網站讀取酒譜（GET） ---------- */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'list';
  if (action === 'list') return json({ ok: true, recipes: listApproved() });
  return json({ ok: false, error: 'unknown action' });
}

function listApproved() {
  const sh = getSheet();
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const rows = sh.getRange(2, 1, n, COLUMNS.length).getValues();
  return rows.filter((row) => row[COL.status - 1] === STATUS.approved).map(toRecipe);
}

function toRecipe(row) {
  const get = (k) => row[COL[k] - 1];
  const r = {
    id: String(get('id')),
    date: fmtDay(get('date')),
    name: String(get('name')),
    bartender: String(get('bartender')),
    bar: String(get('bar')),
    county: String(get('county')),
    brand: String(get('brand')),
    brandOther: String(get('brandOther')),
    piscoType: String(get('piscoType')),
    grapes: splitList(get('grapes')),
    flavors: splitList(get('flavors')),
    ingredients: parseIngredients(get('ingredients')),
    method: String(get('method')),
    photo: String(get('photo')),
    views: Number(get('views')) || 0,
    badges: String(get('badges') || '').split(/[,，、\n]+/).map((x) => x.trim()).filter(Boolean),
  };
  const en = {};
  if (get('name_en')) en.name = String(get('name_en'));
  if (get('bartender_en')) en.bartender = String(get('bartender_en'));
  if (get('ingredients_en')) en.ingredients = parseIngredients(get('ingredients_en'));
  if (get('method_en')) en.method = String(get('method_en'));
  if (get('bar_en')) en.bar = String(get('bar_en'));
  if (Object.keys(en).length) r.en = en;
  return r;
}

/* ---------- 網站送資料（POST）：投稿、瀏覽數 ---------- */
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'bad request' }); }
  try {
    if (body.action === 'submit') return json(handleSubmit(body));
    if (body.action === 'view') return json(handleView(body.id));
    if (body.action === 'setEn') return json(handleSetEn(body));
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'server error' });
  }
  return json({ ok: false, error: 'unknown action' });
}

function handleSubmit(d) {
  if (d.website) return { ok: true }; // 機器人
  const text = (v, max) => String(v || '').trim().slice(0, max);
  const pick = (list, v) => (list.indexOf(v) >= 0 ? v : '');
  const pickMany = (list, arr) => (Array.isArray(arr) ? arr.filter((v) => list.indexOf(v) >= 0) : []);
  const rec = {
    name: text(d.name, 80),
    bartender: text(d.bartender, 60),
    bar: text(d.bar, 80),
    county: text(d.county, 10),
    brand: pick(ALLOWED.brand, d.brand),
    brandOther: text(d.brandOther, 60),
    piscoType: pick(ALLOWED.piscoType, d.piscoType),
    grapes: pickMany(ALLOWED.grapes, d.grapes),
    flavors: pickMany(ALLOWED.flavors, d.flavors),
    ingredients: (Array.isArray(d.ingredients) ? d.ingredients : []).slice(0, 20)
      .map((x) => [text(x[0], 80), text(x[1], 30)]).filter((x) => x[0]),
    method: text(d.method, 3000),
    lang: d.lang === 'en' ? 'en' : 'zh',
  };
  if (!rec.name || !rec.bartender || !rec.bar || !rec.county || !rec.brand || !rec.piscoType ||
      !rec.grapes.length || !rec.flavors.length || !rec.ingredients.length || !rec.method || !d.consent) {
    return { ok: false, error: 'missing fields' };
  }
  const m = String(d.photo || '').match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
  if (!m) return { ok: false, error: 'missing photo' };
  if (m[2].length > 8 * 1024 * 1024) return { ok: false, error: 'photo too large' };

  const id = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyMMdd') + '-' + Utilities.getUuid().slice(0, 6);
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), 'image/' + m[1], id + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1]));
  const file = getFolder().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const photo = 'https://lh3.googleusercontent.com/d/' + file.getId() + '=w1600';

  const row = new Array(COLUMNS.length).fill('');
  const set = (k, v) => { row[COL[k] - 1] = v; };
  set('status', STATUS.pending);
  set('photoPreview', '=IMAGE("' + photo + '")');
  set('name', rec.name);
  set('bartender', rec.bartender);
  set('bar', rec.bar);
  set('county', rec.county);
  set('brand', rec.brand);
  set('brandOther', rec.brandOther);
  set('piscoType', rec.piscoType);
  set('grapes', rec.grapes.join(', '));
  set('flavors', rec.flavors.join(', '));
  set('ingredients', rec.ingredients.map((x) => x[0] + ' | ' + x[1]).join('\n'));
  set('method', rec.method);
  set('views', 0);
  set('submittedAt', Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm'));
  set('lang', rec.lang);
  set('photo', photo);
  set('id', id);

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = getSheet();
    sh.appendRow(row);
    sh.setRowHeight(sh.getLastRow(), 90);
  } finally {
    lock.releaseLock();
  }

  try {
    const me = Session.getEffectiveUser().getEmail();
    MailApp.sendEmail({
      to: me,
      subject: '【Pisco 酒譜】新投稿待審核：' + rec.name,
      htmlBody:
        '<p>有一則新的酒譜投稿：</p>' +
        '<p><b>' + esc(rec.name) + '</b><br>' + esc(rec.bartender) + ' · ' + esc(rec.bar) + '（' + esc(rec.county) + '）</p>' +
        '<p><img src="' + photo + '" width="240"></p>' +
        '<p>請到試算表把「狀態」改成「通過」即可上架：<br>' +
        '<a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">打開審核試算表</a></p>',
    });
  } catch (err) {
    console.error('mail failed', err);
  }
  return { ok: true, id: id };
}

/* ---------- 管理用：直接寫入潤飾後的英文（需要管理金鑰） ---------- */
// 執行一次 makeAdminKey 產生金鑰；金鑰只存在這個專案的「指令碼屬性」，不會出現在程式碼裡
function makeAdminKey() {
  const key = Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('ADMIN_KEY', key);
  // 順便補上新增欄位的標題
  getSheet().getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS.map((c) => c[1])]).setFontWeight('bold').setBackground('#f3f3f3');
  SpreadsheetApp.getUi().alert('管理金鑰（請複製給 Claude）：\n\n' + key);
}

function handleSetEn(d) {
  const key = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!key || d.key !== key) return { ok: false, error: 'unauthorized' };
  const sh = getSheet();
  if (sh.getRange(1, COLUMNS.length).getValue() !== COLUMNS[COLUMNS.length - 1][1]) {
    sh.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS.map((c) => c[1])]).setFontWeight('bold').setBackground('#f3f3f3');
  }
  const results = [];
  (Array.isArray(d.items) ? d.items : []).forEach((it) => {
    const row = findRow(String(it.id || ''));
    if (!row) { results.push({ id: it.id, ok: false }); return; }
    const put = (k, v) => { if (typeof v === 'string') sh.getRange(row, COL[k]).setValue(v); };
    put('name_en', it.name);
    put('bartender_en', it.bartender);
    put('bar_en', it.bar);
    if (Array.isArray(it.ingredients)) put('ingredients_en', it.ingredients.map((x) => x[0] + ' | ' + (x[1] || '')).join('\n'));
    put('method_en', it.method);
    if (Array.isArray(it.badges)) put('badges', it.badges.join('、'));
    results.push({ id: it.id, ok: true });
  });
  return { ok: true, results: results };
}

function handleView(id) {
  if (!id) return { ok: false };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false };
  try {
    const row = findRow(String(id));
    if (!row) return { ok: false };
    const cell = getSheet().getRange(row, COL.views);
    cell.setValue((Number(cell.getValue()) || 0) + 1);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function findRow(id) {
  const sh = getSheet();
  const n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  const ids = sh.getRange(2, COL.id, n, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return i + 2;
  return 0;
}

/* ---------- 審核：狀態改成「通過」時，填上架日期並自動翻譯 ---------- */
function onStatusEdit(e) {
  const range = e.range;
  if (range.getSheet().getName() !== SHEET_NAME) return;
  const first = range.getRow();
  const last = first + range.getNumRows() - 1;
  if (range.getColumn() > COL.status || range.getLastColumn() < COL.status) return;
  for (let r = Math.max(first, 2); r <= last; r++) approveRow(r);
}

function approveRow(r) {
  const sh = getSheet();
  const row = sh.getRange(r, 1, 1, COLUMNS.length).getValues()[0];
  const get = (k) => row[COL[k] - 1];
  if (get('status') !== STATUS.approved) return;
  if (!get('date')) sh.getRange(r, COL.date).setValue(Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd'));
  translateRow(r, row);
}

function translateMissing() {
  const sh = getSheet();
  const n = sh.getLastRow() - 1;
  if (n < 1) return;
  const rows = sh.getRange(2, 1, n, COLUMNS.length).getValues();
  let count = 0;
  rows.forEach((row, i) => {
    if (row[COL.status - 1] === STATUS.approved && translateRow(i + 2, row)) count++;
  });
  SpreadsheetApp.getUi().alert('已翻譯 ' + count + ' 則酒譜。');
}

// 只翻還空著的英文欄位，所以手動改過的英文不會被蓋掉
function translateRow(r, row) {
  const sh = getSheet();
  const get = (k) => row[COL[k] - 1];
  const from = get('lang') === 'en' ? 'en' : 'zh-TW';
  const tr = (s) => (from === 'en' ? s : LanguageApp.translate(applyGlossary(s), from, 'en'));
  let changed = false;
  try {
    if (!get('name_en') && get('name')) {
      sh.getRange(r, COL.name_en).setValue(tr(String(get('name'))));
      changed = true;
    }
    if (!get('ingredients_en') && get('ingredients')) {
      const items = parseIngredients(get('ingredients'));
      const names = tr(items.map((x) => x[0]).join('\n')).split('\n');
      const amts = tr(items.map((x) => x[1] || '-').join('\n')).split('\n');
      const out = items.map((x, i) => [
        cap(names.length === items.length ? names[i].trim() : tr(x[0])),
        x[1] ? (amts.length === items.length ? amts[i].trim() : tr(x[1])) : '',
      ]);
      sh.getRange(r, COL.ingredients_en).setValue(out.map((x) => x[0] + ' | ' + x[1]).join('\n'));
      changed = true;
    }
    if (!get('method_en') && get('method')) {
      // 一步一步分開翻，才不會把好幾個步驟合成一行
      const steps = String(get('method')).split('\n').map((x) => x.trim()).filter(Boolean);
      sh.getRange(r, COL.method_en).setValue(steps.map((x) => cap(tr(x))).join('\n'));
      changed = true;
    }
  } catch (err) {
    console.error('translate failed', err);
  }
  return changed;
}

/* ---------- 調酒用語對照表：翻譯前先換成正確英文，避免機器亂翻 ----------
   想新增用語，照格式加一行即可（長的詞放前面） */
const GLOSSARY = [
  ['高球杯', ' highball glass '], ['可林杯', ' Collins glass '], ['古典杯', ' rocks glass '],
  ['淺碟杯', ' coupe '], ['碟形杯', ' coupe '], ['香檳杯', ' flute '], ['馬丁尼杯', ' martini glass '],
  ['雞尾酒杯', ' cocktail glass '], ['香檳碗形杯', ' champagne saucer '], ['碗形杯', ' saucer '], ['尼克諾拉杯', ' Nick & Nora glass '], ['銅杯', ' copper mug '],
  ['雪克杯', ' shaker '], ['攪拌杯', ' mixing glass '], ['吧匙', ' bar spoon '],
  ['乾搖', ' dry shake '], ['濾入', ' strain into '], ['酒籤', ' cocktail pick '], ['冰鎮', ' chilled '], ['雙重過濾', ' double strain '], ['搖盪', ' shake '],
  ['萊姆角', ' lime wedge '], ['檸檬角', ' lemon wedge '], ['萊姆片', ' lime wheel '], ['檸檬片', ' lemon wheel '],
  ['萊姆皮', ' lime peel '], ['檸檬皮', ' lemon peel '], ['柳橙皮', ' orange peel '], ['皮油', ' oils '],
  ['新鮮萊姆汁', ' fresh lime juice '], ['萊姆汁', ' lime juice '], ['檸檬汁', ' lemon juice '],
  ['薑汁汽水', ' ginger ale '], ['薑汁啤酒', ' ginger beer '], ['通寧水', ' tonic water '], ['蘇打水', ' soda water '],
  ['簡易糖漿', ' simple syrup '], ['純糖漿', ' simple syrup '], ['鳳梨糖漿', ' pineapple syrup '], ['楓糖糖漿', ' maple syrup '],
  ['楓糖漿', ' maple syrup '], ['蜂蜜糖漿', ' honey syrup '], ['接骨木花糖漿', ' elderflower syrup '], ['糖漿', ' syrup '], ['蛋白', ' egg white '],
  ['安格仕苦精', ' Angostura bitters '], ['柑橘苦精', ' orange bitters '], ['苦精', ' bitters '],
  ['不甜香艾酒', ' dry vermouth '], ['甜香艾酒', ' sweet vermouth '], ['香艾酒', ' vermouth '], ['冰球', ' ice ball '], ['大冰塊', ' large ice cube '], ['碎冰', ' crushed ice '],
  ['補滿', ' top up '], ['顆', ' '],
];
function applyGlossary(s) {
  let out = String(s);
  GLOSSARY.forEach(([zh, en]) => { out = out.split(zh).join(en); });
  return out.replace(/ {2,}/g, ' ').trim();
}

/* ---------- 小工具 ---------- */
function parseIngredients(v) {
  return String(v || '').split('\n').map((line) => {
    const i = line.lastIndexOf('|');
    return i < 0 ? [line.trim(), ''] : [line.slice(0, i).trim(), line.slice(i + 1).trim()];
  }).filter((x) => x[0]);
}
// 英文開頭字母大寫
function cap(s) {
  s = String(s || '').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function splitList(v) {
  return String(v || '').split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean);
}
function fmtDay(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Taipei', 'yyyy-MM-dd');
  return String(v || '').slice(0, 10);
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
