// Cheese World Map — Leaflet + MarkerCluster
// Loads ../data/cheeses.json (the single source of truth shared with the passport).

const RENNET_LABELS = {
  microbial: "Microbial rennet",
  vegetable: "Vegetable rennet",
  animal: "Animal rennet",
  "acid-set": "Acid-set (no rennet)",
  unknown: "Unknown rennet",
};

let allCheeses = [];
let markerById = new Map(); // cheese id -> {cheese, marker}
let clusterGroup = null;
let vegOnly = false;

const map = L.map("map", {
  worldCopyJump: true,
}).setView([20, 10], 2);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 19,
}).addTo(map);

clusterGroup = L.markerClusterGroup({
  maxClusterRadius: 50,
  iconCreateFunction: function (cluster) {
    const count = cluster.getChildCount();
    return L.divIcon({
      html: `<div>${count}</div>`,
      className: "marker-cluster-cheese",
      iconSize: L.point(40, 40),
    });
  },
});
map.addLayer(clusterGroup);

function cheeseIcon(cheese) {
  const badge = cheese.is_vegetarian ? '<span class="veg-badge">🌱</span>' : "";
  return L.divIcon({
    html: `<div class="cheese-marker">🧀${badge}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  });
}

function popupHtml(cheese) {
  const vegClass = cheese.is_vegetarian ? "veg" : "non-veg";
  const vegLabel = cheese.is_vegetarian ? "🌱 Vegetarian" : "Not confirmed vegetarian";
  const rennetLabel = RENNET_LABELS[cheese.rennet_type] || cheese.rennet_type;
  return `
    <div class="cheese-popup">
      <h3>🧀 ${cheese.name}</h3>
      <div class="popup-country">${cheese.country} &middot; ${cheese.continent}</div>
      <span class="popup-veg-status ${vegClass}">${vegLabel} &middot; ${rennetLabel}</span>
      <p>${cheese.description}</p>
      <p class="popup-tasting">"${cheese.tasting_note}"</p>
    </div>
  `;
}

function buildMarkers(cheeses) {
  cheeses.forEach((cheese) => {
    const marker = L.marker([cheese.lat, cheese.lon], {
      icon: cheeseIcon(cheese),
      title: cheese.name,
    });
    marker.bindPopup(popupHtml(cheese));
    markerById.set(cheese.id, { cheese, marker });
  });
}

function renderMarkers() {
  clusterGroup.clearLayers();
  const visible = allCheeses.filter((c) => !vegOnly || c.is_vegetarian);
  const markers = visible.map((c) => markerById.get(c.id).marker);
  clusterGroup.addLayers(markers);
}

// ---------- Vegetarian-only toggle ----------

const vegToggleBtn = document.getElementById("veg-toggle");
vegToggleBtn.addEventListener("click", () => {
  vegOnly = !vegOnly;
  vegToggleBtn.classList.toggle("active", vegOnly);
  vegToggleBtn.textContent = vegOnly ? "🌱 Vegetarian only ✓" : "🌱 Show vegetarian only";
  renderMarkers();
});

// ---------- Search / autocomplete ----------

const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");

function renderSearchResults(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    searchResults.innerHTML = "";
    searchResults.classList.remove("visible");
    return;
  }
  const matches = allCheeses
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    )
    .slice(0, 12);

  if (matches.length === 0) {
    searchResults.innerHTML = '<div class="search-result-item">No cheeses found</div>';
    searchResults.classList.add("visible");
    return;
  }

  searchResults.innerHTML = matches
    .map(
      (c) => `
      <div class="search-result-item" data-id="${c.id}">
        <div class="sr-name">${c.name} ${c.is_vegetarian ? '<span class="sr-veg">🌱</span>' : ""}</div>
        <div class="sr-country">${c.country}</div>
      </div>`
    )
    .join("");
  searchResults.classList.add("visible");
}

searchInput.addEventListener("input", (e) => renderSearchResults(e.target.value));

searchInput.addEventListener("focus", (e) => {
  if (e.target.value.trim()) renderSearchResults(e.target.value);
});

searchResults.addEventListener("click", (e) => {
  const item = e.target.closest(".search-result-item");
  if (!item || !item.dataset.id) return;
  const entry = markerById.get(item.dataset.id);
  if (!entry) return;

  // If vegetarian-only is active and this cheese isn't vegetarian, drop the filter
  // so the selected marker is actually visible.
  if (vegOnly && !entry.cheese.is_vegetarian) {
    vegOnly = false;
    vegToggleBtn.classList.remove("active");
    vegToggleBtn.textContent = "🌱 Show vegetarian only";
    renderMarkers();
  }

  map.setView([entry.cheese.lat, entry.cheese.lon], 6, { animate: true });
  clusterGroup.zoomToShowLayer(entry.marker, () => {
    entry.marker.openPopup();
  });

  searchResults.classList.remove("visible");
  searchInput.value = entry.cheese.name;
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-panel")) {
    searchResults.classList.remove("visible");
  }
});

// ---------- Load data ----------

fetch("../data/cheeses.json")
  .then((res) => res.json())
  .then((cheeses) => {
    allCheeses = cheeses;
    buildMarkers(cheeses);
    renderMarkers();
  })
  .catch((err) => {
    console.error("Failed to load cheeses.json", err);
    document.getElementById("map").innerHTML =
      '<p style="padding:20px;font-family:sans-serif;">Could not load cheese data. If you opened this file directly, please run it through a local server (e.g. VS Code Live Server) so the browser can fetch data/cheeses.json.</p>';
  });
