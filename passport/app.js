// Cheese Passport — continuous-scroll digital + printable passport.
// Loads ../data/cheeses.json (the same source of truth as the map) and
// persists stamped/checked state in localStorage.

const STORAGE_KEY = "cheese-passport-stamps";

const CONTINENT_ORDER = [
  "Europe",
  "Asia",
  "Africa",
  "North America",
  "South America",
  "Oceania",
];

function loadStamps() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Could not read stamps from localStorage", e);
    return {};
  }
}

function saveStamps(stamps) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stamps));
  } catch (e) {
    console.warn("Could not save stamps to localStorage", e);
  }
}

let stamps = loadStamps();

function updateProgress(total) {
  const stampedCount = Object.values(stamps).filter(Boolean).length;
  const pct = total ? Math.round((stampedCount / total) * 100) : 0;
  document.getElementById("progress-bar-fill").style.width = `${pct}%`;
  document.getElementById(
    "progress-label"
  ).textContent = `${stampedCount} / ${total} cheeses tried`;
}

function entryHtml(cheese) {
  const isStamped = Boolean(stamps[cheese.id]);
  const vegBadge = cheese.is_vegetarian
    ? '<span class="entry-veg">🌱 Vegetarian</span>'
    : "";
  return `
    <div class="cheese-entry ${isStamped ? "stamped" : ""}" data-id="${cheese.id}">
      <div class="stamp-box">
        <input type="checkbox" id="stamp-${cheese.id}" ${isStamped ? "checked" : ""} aria-label="Mark ${cheese.name} as tried" />
        <div class="stamp-graphic">✓</div>
      </div>
      <div class="entry-body">
        <h3>🧀 ${cheese.name}${vegBadge}</h3>
        <p class="entry-country">${cheese.country}</p>
        <p class="entry-tasting">"${cheese.tasting_note}"</p>
      </div>
    </div>
  `;
}

function continentSectionHtml(continent, cheeses) {
  return `
    <div class="continent-header">
      <span>${continent}</span>
      <span class="continent-count">${cheeses.length} cheeses</span>
    </div>
    ${cheeses.map(entryHtml).join("")}
  `;
}

function render(allCheeses) {
  const byContinent = new Map();
  CONTINENT_ORDER.forEach((c) => byContinent.set(c, []));
  allCheeses.forEach((cheese) => {
    if (!byContinent.has(cheese.continent)) byContinent.set(cheese.continent, []);
    byContinent.get(cheese.continent).push(cheese);
  });

  const container = document.getElementById("passport-entries");
  container.innerHTML = Array.from(byContinent.entries())
    .filter(([, list]) => list.length > 0)
    .map(([continent, list]) => continentSectionHtml(continent, list))
    .join("");

  updateProgress(allCheeses.length);

  container.addEventListener("change", (e) => {
    const checkbox = e.target.closest('input[type="checkbox"]');
    if (!checkbox) return;
    const entryEl = checkbox.closest(".cheese-entry");
    const id = entryEl.dataset.id;
    stamps[id] = checkbox.checked;
    entryEl.classList.toggle("stamped", checkbox.checked);
    saveStamps(stamps);
    updateProgress(allCheeses.length);
  });
}

fetch("../data/cheeses.json")
  .then((res) => res.json())
  .then((cheeses) => render(cheeses))
  .catch((err) => {
    console.error("Failed to load cheeses.json", err);
    document.getElementById("passport-entries").innerHTML =
      '<p style="padding:20px;">Could not load cheese data. If you opened this file directly, please run it through a local server (e.g. VS Code Live Server) so the browser can fetch data/cheeses.json.</p>';
  });
