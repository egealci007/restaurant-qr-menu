// ============================
//   Mor Lounge Menü - Final Turbo
//   JSON Only + Smart Preload
// ============================

// 🔧 Ayarlar
const JSON_URL = `https://raw.githubusercontent.com/egealci007/restaurant-qr-menu/main/data/menu.json?t=${Date.now()}`; // hep güncel

// HTML elementleri
const catContainer = document.getElementById("categories");
const menuContainer = document.getElementById("menu");
const themeBtn = document.getElementById("themeToggle");

// ✅ GLOBAL arama için
let GLOBAL_DATA = null;
let CURRENT_ACTIVE_CAT = null;
let CURRENT_ACTIVE_EL = null;
let searchInput = null;

// ✅ Arama kutusunu JS ile ekle (ikonlu)
function ensureSearchUI() {
  // Zaten varsa dokunma
  if (document.getElementById("searchInput")) {
    searchInput = document.getElementById("searchInput");
    return;
  }

  const header = document.querySelector("header");
  if (!header) return;

  const wrap = document.createElement("div");
  wrap.style.padding = "0 20px 10px";
  wrap.style.position = "relative";
  wrap.style.width = "100%";
  wrap.style.boxSizing = "border-box";
  wrap.style.overflow = "hidden";

  const icon = document.createElement("span");
  icon.style.position = "absolute";
  icon.style.left = "28px";
  icon.style.top = "10px";
  icon.style.opacity = "0.75";
  icon.style.pointerEvents = "none";

  const input = document.createElement("input");
  input.id = "searchInput";
  input.type = "text";
  input.placeholder = "Menüde ara...";
  input.style.width = "100%";
  input.style.maxWidth = "100%";
  input.style.boxSizing = "border-box";
  input.style.padding = "10px 14px 10px 38px"; // ikon için sol padding
  input.style.borderRadius = "12px";
  input.style.border = "1px solid rgba(255,255,255,0.15)";
  input.style.background = "rgba(0,0,0,0.25)";
  input.style.color = "inherit";
  input.style.outline = "none";
  input.style.fontSize = "14px";

  wrap.appendChild(icon);
  wrap.appendChild(input);

  // header'dan hemen sonra ekle
  header.insertAdjacentElement("afterend", wrap);

  searchInput = input;
}

// ✅ Tüm menüde arama render (SADECE ÜRÜN ADINDA)
function renderSearchResults(query) {
  const q = (query || "").trim().toLowerCase();
  menuContainer.innerHTML = "";

  // boşsa: normal görünüm (aktif kategoriye dön)
  if (!q) {
    if (GLOBAL_DATA && CURRENT_ACTIVE_CAT && CURRENT_ACTIVE_EL) {
      showCategory(CURRENT_ACTIVE_CAT, CURRENT_ACTIVE_EL, GLOBAL_DATA);
    }
    return;
  }

  if (!GLOBAL_DATA) return;

  const fragment = document.createDocumentFragment();
  let found = 0;

  Object.entries(GLOBAL_DATA).forEach(([category, info]) => {
    (info.items || []).forEach((item) => {
      const name = (item.name || "").toLowerCase();
      const match = name.includes(q); // ✅ sadece isim

      if (match) {
        found++;
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
      }
    });
  });

  if (found === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.style.padding = "18px 20px";
    empty.style.opacity = "0.85";
    empty.textContent = "Ürün bulunamadı";
    menuContainer.appendChild(empty);
    return;
  }

  menuContainer.appendChild(fragment);
}

// ============================
//  🚀 SADECE JSON KULLANAN YENİ INIT
// ============================

async function init() {
  try {
    const res = await fetch(JSON_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error("menu.json okunamadı");

    const json = await res.json();
    const data = normalizeJson(json);

    // ✅ Arama UI
    ensureSearchUI();

    // ✅ Arama event
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        renderSearchResults(this.value);
      });
    }

    buildUI(data);

  } catch (err) {
    console.error("menu.json yüklenemedi:", err.message);
    alert("Menü yüklenemedi. Lütfen data/menu.json dosyasını kontrol edin.");
  }
}

// Başlat
init();

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
  // ✅ GLOBAL arama için sakla
  GLOBAL_DATA = data;

  catContainer.innerHTML = "";
  const cats = Object.entries(data);
  cats.forEach(([cat, info], index) => {
    const div = document.createElement("div");
    div.className = "category-card" + (index === 0 ? " active" : "");
    div.dataset.bg = info.img || "";
    div.innerHTML = `<span>${cat}</span>`;
    div.onclick = () => {
      // ✅ kategori seçince aramayı temizle (tüm menü aramasıyla karışmasın)
      if (searchInput && searchInput.value) searchInput.value = "";
      showCategory(cat, div, data);
    };
    catContainer.appendChild(div);
  });

  if (cats.length)
    showCategory(cats[0][0], catContainer.querySelector(".category-card"), data);

  lazyLoadCategoryImages();
  smartPreloadImages(data); // ⚡ akıllı preload sistemi
}

function showCategory(category, element, data) {
  // ✅ aktif kategori bilgisi (arama boşalınca geri dönmek için)
  CURRENT_ACTIVE_CAT = category;
  CURRENT_ACTIVE_EL = element;

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
  const total = allImages.length;
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
document.body.classList.add("dark");
themeBtn.textContent = "☀️";
