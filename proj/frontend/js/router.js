import { render } from "./app.js";

// Импорты view-страниц
import { MountainsView } from "./views/mountains.js";
import { MountainDetailView } from "./views/mountainDetail.js";
import { GroupsView } from "./views/groups.js";
import { ClimbersView } from "./views/climbers.js";
import { StatsView } from "./views/stats.js";
import { GroupDetailView } from "./views/groupDetail.js";
/**
 * Словарь маршрутов
 * ключ — путь (с возможными параметрами),
 * значение — функция отрисовки
 */
const routes = [
  { path: /^#\/mountains$/, view: MountainsView },
  { path: /^#\/mountains\/(\d+)$/, view: MountainDetailView },
  { path: /^#\/groups$/, view: GroupsView },
  { path: /^#\/climbers$/, view: ClimbersView },
  { path: /^#\/stats$/, view: StatsView },
  { path: /^#\/groups\/(\d+)$/, view: GroupDetailView },
];

/**
 * Функция обработчика маршрутизации
 */
function router() {
  const hash = window.location.hash || "#/mountains";

  for (const r of routes) {
    const match = hash.match(r.path);
    if (match) {
      const params = match.slice(1); // извлекаем параметры из regex
      render(r.view, params);
      return;
    }
  }

  // Если ничего не подошло — 404
  render(() => `<h2>404 — страница не найдена</h2><p>${hash}</p>`);
}

/**
 * Инициализация роутера
 */
export function initRouter() {
  window.addEventListener("hashchange", router);
  router(); // первый вызов
}
