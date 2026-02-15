// ============================
//   Mor Lounge Menü - Final Turbo
//   JSON Only + Smart Preload
// ============================

// 🔧 Ayarlar
const JSON_URL = `https://raw.githubusercontent.com/egealci007/restaurant-qr-menu/main/data/menu.json?t=${Date.now()}`;

// HTML elementleri
const catContainer = document.getElementById("categories");
const menuContainer = document.getElementById("menu");
const themeBtn = document.getElementById("themeToggle");

// ✅ Yeni view elementleri (index.html’de ekledik)
const homeView = document.getElementById("homeView");
const menuView = document.getElementById("menuView");
const siteLogo = document.getElementById("siteLogo");

// ✅ Geri butonu (sadece bunu ekliyoruz)
const backBtn = document.getElementById("backBtn");

// ✅ Menü verisini sakla (geri dönüşte tekrar fetch etmesin)
let APP_DATA = null;

// ============================
//  🚀 SADECE JSON KULLANAN INIT
// ============================

async function init() {
  try {
    const res = await fetch(JSON_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error("menu.json okunamadı");

    const json = await res.json();
    const data = normalizeJson(json);

    APP_DATA = data;

    // ✅ İlk ekran: sadece kategoriler
    showHome();

    buildUI(data);

  } catch (err) {
    console.error("menu.json yüklenemedi:", err.message);
    alert("Menü yüklenemedi. Lütfen data/menu.json dosyasını kontrol edin.");
  }
}

// Başlat
init();

// ============================
//  View yardımcıları
// ============================

function showHome() {
  if (homeView) homeView.style.display = "block";
  if (menuView) menuView.style.display = "none";

  // ✅ Geri butonu ana ekranda gizli
  if (backBtn) backBtn.style.display = "none";

  // ürün listesini temizlemek istersen aç:
  // menuContainer.innerHTML = "";
}

function showMenu() {
  if (homeView) homeView.style.display = "none";
  if (menuView) menuView.style.display = "block";

  // ✅ Menü ekranında geri butonu görünsün
  if (backBtn) backBtn.style.display = "inline-flex";
}

// Logo’ya tıklayınca ana ekrana dön
if (siteLogo) {
  siteLogo.style.cursor = "pointer";
  siteLogo.addEventListener("click", () => {
    showHome();
  });
}

// ✅ Geri butonuna basınca ana ekrana dön
if (backBtn) {
  backBtn.addEventListener("click", () => {
    showHome();
  });
}

// ============================
//  JSON verisini düzenle
// ============================

function normalizeJson(arr) {
  const data = {};
  arr.forEach((row) => {
    const category = row["Kategori"] || "";
    const name = row["Ürün Adı"] || "";
    const price = row["Fiyat"] || "";
    const desc = row["Açıklama"] || "";
    const img = row["Görsel URL"] || "";
    const catImg = row["CategoryImg"] || "";

    if (!data[category]) data[category] = { items: [], img: catImg };
    data[category].items.push({ name, price, desc, img });
  });
  return data;
}

// ============================
//  UI oluşturma
// ============================

function buildUI(data) {
  catContainer.innerHTML = "";
  const cats = Object.entries(data);

  cats.forEach(([cat, info], index) => {
    const div = document.createElement("div");
    div.className = "category-card" + (index === 0 ? " active" : "");
    div.dataset.bg = info.img || "";
    div.innerHTML = `<span>${cat}</span>`;
    div.onclick = () => {
      showCategory(cat, div, data);
    };
    catContainer.appendChild(div);
  });

  // ❌ Eski davranış: sayfa açılır açılmaz ürünleri gösteriyordu
  // ✅ Artık ilk açılışta ürün göstermiyoruz, sadece kategoriler
  // if (cats.length) showCategory(...)

  lazyLoadCategoryImages();
  smartPreloadImages(data);
}

function showCategory(category, element, data) {
  // ✅ Kategoriye basınca ürün ekranını aç
  showMenu();

  document
    .querySelectorAll(".category-card")
    .forEach((el) => el.classList.remove("active"));
  element.classList.add("active");

  menuContainer.innerHTML = "";
  const fragment = document.createDocumentFragment();

  (data[category]?.items || []).forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${item.img}?v=1" alt="${item.name}" loading="lazy" decoding="async">
      <div class="card-content">
        <h3>${item.name}</h3>
        <p class="desc">${item.desc || ""}</p>
        <div class="price">₺${item.price}</div>
      </div>
    `;
    fragment.appendChild(card);
  });

  requestAnimationFrame(() => menuContainer.appendChild(fragment));
}

// ============================
//  ⚡ Akıllı Preload
// ============================

function smartPreloadImages(data) {
  const allImages = [];
  Object.values(data).forEach((cat) => {
    cat.items.forEach((item) => {
      allImages.push(item.img + "?v=1");
    });
  });

  let loaded = 0;
  const batchSize = 8;
  let index = 0;

  function loadNextBatch() {
    const batch = allImages.slice(index, index + batchSize);
    batch.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (loaded === 20) document.body.classList.add("images-ready");
      };
      img.src = src;
    });
    index += batchSize;
    if (index < allImages.length) setTimeout(loadNextBatch, 150);
  }

  loadNextBatch();
}

// ============================
//  Lazy load (kategori görselleri)
// ============================

function lazyLoadCategoryImages() {
  const obs = new IntersectionObserver(
    (entries, o) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const bg = el.dataset.bg;
          if (bg) {
            el.style.backgroundImage = `url(${bg}?v=1)`;
            el.removeAttribute("data-bg");
          }
          o.unobserve(el);
        }
      });
    },
    { rootMargin: "150px", threshold: 0.1 }
  );
  document.querySelectorAll(".category-card").forEach((el) => obs.observe(el));
}

// ============================
//  Tema (dark/light)
// ============================

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeBtn.textContent = document.body.classList.contains("dark")
    ? "☀️"
    : "🌙";
});

// ✅ Sayfa ilk açılışta: light başlasın
themeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
