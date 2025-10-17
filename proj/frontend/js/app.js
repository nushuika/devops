import { initRouter } from "./router.js";
import { state } from "./state.js";

// Корневой контейнер для смены страниц
const root = document.getElementById("app-root");

/**
 * Простая функция отрисовки текущего view
 * @param {Function} viewFn — функция, которая возвращает DOM-элемент или строку
 */
export async function render(viewFn, params = {}) {
  try {
    root.innerHTML = ""; // очистить контейнер
    const view = await viewFn(params);
    if (typeof view === "string") {
      root.innerHTML = view;
    } else if (view instanceof HTMLElement) {
      root.appendChild(view);
    }
  } catch (err) {
    console.error("Ошибка при рендере:", err);
    root.innerHTML = `<div class="error">Произошла ошибка при загрузке страницы</div>`;
  }
}

// Инициализация приложения
document.addEventListener("DOMContentLoaded", () => {
  console.log("SPA альпклуба запущено");

  // загрузить базовое состояние (например, кэш гор и альпинистов)
  state.init();

  // включаем роутер
  initRouter();
});
