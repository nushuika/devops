/**
 * Простое хранилище состояния для SPA
 * Можно расширить, если потребуется более сложная логика (redux/pinia analoge)
 */

export const state = {
  mountains: [],
  climbers: [],
  groups: [],
  stats: {},

  initialized: false,

  /**
   * Инициализация состояния
   * (подгрузка начальных данных при старте приложения)
   */
  async init() {
    if (this.initialized) return;
    console.log("Инициализация state…");
    this.mountains = [];
    this.climbers = [];
    this.groups = [];
    this.stats = {};
    this.initialized = true;
  },

  /**
   * Очистка состояния (например, при logout)
   */
  reset() {
    this.mountains = [];
    this.climbers = [];
    this.groups = [];
    this.stats = {};
    this.initialized = false;
  },
};
