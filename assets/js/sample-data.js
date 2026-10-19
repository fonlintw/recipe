/* =========================================================
   試看版範例酒譜（店家與調酒師皆為虛構）
   正式上線後，資料會改從 Google 試算表讀取
   ========================================================= */

// en：英文版顯示的酒譜內容（正式上線後由後台自動翻譯）
// 試看版示意照片：來自 Unsplash（免費授權，可商用）。正式上線後會換成調酒師投稿的照片
const DEMO_PHOTOS = ['1772565449255-8ea17f1ee5c8', '1622758665277-05e973af4395', '1671713682257-359a1baf806e', '1730390772308-0ae7f139d042', '1609951651556-5334e2706168', '1470337458703-46ad1756a187', '1582993232955-39424b2cef01', '1767510533125-af4108fc1169', '1500217052183-bc01eee1a74e'];
function unsplash(id) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&h=1125&q=75`;
}

window.SAMPLE_RECIPES = [
  {
    id: 'demo-1', date: '2026-10-12', badges: ['本月推薦'], name: '安地斯晨霧', glass: 'coupe',
    brand: 'porton', piscoType: 'mostoverde', grapes: ['quebranta', 'torontel'],
    flavors: ['sweetsour'], county: '臺北市', bar: 'Bar Uno', bartender: '林小安',
    ingredients: [['Pisco Portón Mosto Verde', '50ml'], ['新鮮萊姆汁', '25ml'], ['糖漿 1:1', '20ml'], ['蛋白', '1 顆'], ['安格仕苦精', '3 dash']],
    method: '所有材料先乾搖 10 秒\n加冰再搖盪 12 秒\n雙重過濾倒入冰鎮的雞尾酒杯\n在泡沫上滴苦精裝飾',
    views: 1284,
    en: {"name": "Andean Morning Mist", "bartender": "Lin Hsiao-an", "ingredients": [["Pisco Portón Mosto Verde", "50ml"], ["Fresh lime juice", "25ml"], ["Simple syrup 1:1", "20ml"], ["Egg white", "1"], ["Angostura bitters", "3 dashes"]], "method": "Dry shake all ingredients for 10 seconds\nAdd ice and shake again for 12 seconds\nDouble strain into a chilled cocktail glass\nDot the foam with bitters"},
  },
  {
    id: 'demo-2', date: '2026-10-09', name: '冷泉 Chilcano', glass: 'highball',
    brand: 'porton', piscoType: 'mostoverde', grapes: ['quebranta', 'italia'],
    flavors: ['sparkling', 'sweetsour'], county: '臺中市', bar: 'Mist', bartender: '陳阿哲',
    ingredients: [['Pisco Portón', '45ml'], ['萊姆汁', '15ml'], ['薑汁汽水', '補滿'], ['安格仕苦精', '2 dash']],
    method: '高球杯裝滿冰塊\n倒入 Pisco 與萊姆汁\n補滿薑汁汽水，輕輕攪拌一圈\n滴入苦精，以萊姆角裝飾',
    views: 932,
    en: {"name": "Cold Spring Chilcano", "bartender": "Chen A-che", "ingredients": [["Pisco Portón", "45ml"], ["Lime juice", "15ml"], ["Ginger ale", "Top up"], ["Angostura bitters", "2 dashes"]], "method": "Fill a highball glass with ice\nAdd the Pisco and lime juice\nTop with ginger ale and stir gently once\nAdd bitters and garnish with a lime wedge"},
  },
  {
    id: 'demo-3', date: '2026-10-05', name: '藍色海岸', glass: 'nick',
    brand: 'caravedo', piscoType: 'puro', grapes: ['quebranta'],
    flavors: ['strong'], county: '高雄市', bar: 'Harbor', bartender: '黃大海',
    ingredients: [['Pisco La Caravedo Quebranta', '50ml'], ['不甜香艾酒', '20ml'], ['白可可香甜酒', '5ml'], ['海鹽水', '2 滴']],
    method: '所有材料倒入攪拌杯加冰\n攪拌 25 秒至充分冰鎮\n濾入冰鎮的 Nick & Nora 杯\n以檸檬皮油裝飾',
    views: 768,
    en: {"name": "Blue Coast", "bartender": "Huang Ta-hai", "ingredients": [["Pisco La Caravedo Quebranta", "50ml"], ["Dry vermouth", "20ml"], ["White crème de cacao", "5ml"], ["Saline solution", "2 drops"]], "method": "Add all ingredients to a mixing glass with ice\nStir for 25 seconds until well chilled\nStrain into a chilled Nick & Nora glass\nExpress a lemon peel over the top"},
  },
  {
    id: 'demo-4', date: '2026-09-28', badges: ['經典', '店長精選'], name: '茉莉氣泡', glass: 'highball',
    brand: 'caravedo', piscoType: 'puro', grapes: ['italia'],
    flavors: ['sparkling'], county: '新竹市', bar: 'Bloom', bartender: '吳曉茉',
    ingredients: [['Pisco La Caravedo Italia', '40ml'], ['冷泡茉莉綠茶', '60ml'], ['接骨木花糖漿', '10ml'], ['蘇打水', '補滿']],
    method: '杯中加入冰塊\n依序倒入 Pisco、茶與糖漿\n補滿蘇打水，輕攪\n放上茉莉花或檸檬片',
    views: 1530,
    en: {"name": "Jasmine Fizz", "bartender": "Wu Hsiao-mo", "ingredients": [["Pisco La Caravedo Italia", "40ml"], ["Cold-brew jasmine green tea", "60ml"], ["Elderflower syrup", "10ml"], ["Soda water", "Top up"]], "method": "Fill the glass with ice\nAdd the Pisco, tea and syrup in that order\nTop with soda water and stir gently\nGarnish with jasmine flowers or a lemon slice"},
  },
  {
    id: 'demo-5', date: '2026-09-21', name: '花東柚香酸酒', glass: 'coupe',
    brand: 'porton', piscoType: 'mostoverde', grapes: ['quebranta', 'moscatel'],
    flavors: ['sweetsour'], county: '花蓮縣', bar: 'Pacific', bartender: '張洄瀾',
    ingredients: [['Pisco Portón', '45ml'], ['文旦汁', '30ml'], ['檸檬汁', '15ml'], ['蜂蜜糖漿', '15ml']],
    method: '所有材料加冰搖盪\n濾入冰鎮的淺碟杯\n以文旦皮捲裝飾',
    views: 421,
    en: {"name": "East Coast Pomelo Sour", "bartender": "Chang Hui-lan", "ingredients": [["Pisco Portón", "45ml"], ["Pomelo juice", "30ml"], ["Lemon juice", "15ml"], ["Honey syrup", "15ml"]], "method": "Shake all ingredients with ice\nStrain into a chilled coupe\nGarnish with a pomelo peel twist"},
  },
  {
    id: 'demo-6', date: '2026-09-14', name: '老派紳士', glass: 'rocks',
    brand: 'other', brandOther: 'Pisco Demo', piscoType: 'mostoverde', grapes: ['italia'],
    flavors: ['strong'], county: '臺南市', bar: 'Old Town', bartender: '許文生',
    ingredients: [['Mosto Verde Pisco', '60ml'], ['龍眼蜜糖漿', '7.5ml'], ['柑橘苦精', '2 dash']],
    method: '材料倒入攪拌杯加冰攪拌\n倒入放有大冰塊的古典杯\n噴附柳橙皮油後放入杯中',
    views: 655,
    en: {"name": "Old-School Gentleman", "bartender": "Hsu Wen-sheng", "ingredients": [["Mosto Verde Pisco", "60ml"], ["Longan honey syrup", "7.5ml"], ["Orange bitters", "2 dashes"]], "method": "Stir the ingredients with ice in a mixing glass\nPour into a rocks glass over a large ice cube\nExpress an orange peel and drop it in"},
  },
  {
    id: 'demo-7', date: '2026-09-02', name: '玉山雲霧', glass: 'nick',
    brand: 'porton', piscoType: 'mostoverde', grapes: ['torontel'],
    flavors: ['sweetsour', 'strong'], county: '南投縣', bar: 'Highland', bartender: '王山嵐',
    ingredients: [['Pisco Portón Mosto Verde', '45ml'], ['高山烏龍茶浸漬白香艾酒', '20ml'], ['檸檬汁', '10ml'], ['糖漿', '10ml']],
    method: '所有材料加冰搖盪\n雙重過濾入杯\n以烏龍茶葉輕撒裝飾',
    views: 873,
    en: {"name": "Jade Mountain Clouds", "bartender": "Wang Shan-lan", "ingredients": [["Pisco Portón Mosto Verde", "45ml"], ["Oolong-infused blanc vermouth", "20ml"], ["Lemon juice", "10ml"], ["Simple syrup", "10ml"]], "method": "Shake all ingredients with ice\nDouble strain into the glass\nGarnish with a light sprinkle of oolong leaves"},
  },
  {
    id: 'demo-8', date: '2026-08-25', name: '澎湖晚風', glass: 'highball',
    brand: 'caravedo', piscoType: 'puro', grapes: ['quebranta', 'torontel'],
    flavors: ['sparkling'], county: '澎湖縣', bar: 'Islander', bartender: '蔡海風',
    ingredients: [['Pisco La Caravedo', '45ml'], ['仙人掌果汁', '20ml'], ['萊姆汁', '10ml'], ['通寧水', '補滿']],
    method: '高球杯裝冰\n倒入 Pisco 與果汁\n補滿通寧水\n以萊姆片裝飾',
    views: 512,
    en: {"name": "Penghu Evening Breeze", "bartender": "Tsai Hai-feng", "ingredients": [["Pisco La Caravedo", "45ml"], ["Prickly pear juice", "20ml"], ["Lime juice", "10ml"], ["Tonic water", "Top up"]], "method": "Fill a highball glass with ice\nAdd the Pisco and juices\nTop with tonic water\nGarnish with a lime slice"},
  },
  {
    id: 'demo-9', date: '2026-08-17', name: '基隆港霧', glass: 'rocks',
    brand: 'porton', piscoType: 'mostoverde', grapes: ['quebranta'],
    flavors: ['strong'], county: '基隆市', bar: 'Dock 9', bartender: '李港生',
    ingredients: [['Pisco Portón', '50ml'], ['不甜雪莉酒', '15ml'], ['海鹽苦精', '2 dash']],
    method: '材料加冰攪拌\n濾入放有冰球的古典杯\n以橄欖裝飾',
    views: 389,
    en: {"name": "Keelung Harbor Fog", "bartender": "Lee Kang-sheng", "ingredients": [["Pisco Portón", "50ml"], ["Dry sherry", "15ml"], ["Sea salt bitters", "2 dashes"]], "method": "Stir the ingredients with ice\nStrain into a rocks glass over an ice ball\nGarnish with an olive"},
  },
].map((r, i) => ({ ...r, photo: unsplash(DEMO_PHOTOS[i]) }));
