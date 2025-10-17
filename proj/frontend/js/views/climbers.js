import { apiClimbers } from "../api.js";

/**
 * View: Альпинисты
 * - фильтр по интервалу дат (4)
 * - создание нового (с крестиком закрытия)
 * - редактирование и удаление альпинистов
 */
export async function ClimbersView() {
  const container = document.createElement("div");

  // Заголовок
  const title = document.createElement("h1");
  title.textContent = "Альпинисты";
  container.appendChild(title);

  // Фильтр по интервалу дат
  const filterForm = document.createElement("form");
  filterForm.innerHTML = `
    <h3>Фильтр по датам восхождений</h3>
    <div style="display:flex; gap:.5rem; flex-wrap:wrap; align-items:center;">
      <label>С: <input type="date" name="from"></label>
      <label>По: <input type="date" name="to"></label>
      <button type="submit">Показать</button>
      <button type="button" id="resetFilter" class="secondary">Сбросить</button>
      <button type="button" id="openCreate" style="margin-left:.5rem;">Добавить альпиниста</button>
    </div>
  `;
  container.appendChild(filterForm);

  // Узел для форм
  const formsHost = document.createElement("div");
  formsHost.id = "forms-host";
  container.appendChild(formsHost);

  // Таблица списка
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>ФИО</th>
        <th>Адрес</th>
        <th>Действия</th>
      </tr>
    </thead>
    <tbody><tr><td colspan="3">Загрузка…</td></tr></tbody>
  `;
  container.appendChild(table);
  const tbody = table.querySelector("tbody");

  // Обработчики фильтра
  filterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await loadClimbers();
  });
  filterForm.querySelector("#resetFilter").addEventListener("click", async () => {
    filterForm.from.value = "";
    filterForm.to.value = "";
    await loadClimbers();
  });
  filterForm.querySelector("#openCreate").addEventListener("click", () => {
    openCreateForm();
  });

  // Первая загрузка
  await loadClimbers();

  return container;

  // ---------------- функции ------------------

  async function loadClimbers() {
    closeForms();
    tbody.innerHTML = `<tr><td colspan="3">Загрузка…</td></tr>`;
    try {
      const from = filterForm.from.value || undefined;
      const to = filterForm.to.value || undefined;
      const climbers = await apiClimbers.list(from, to);

      if (!climbers || climbers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3">Нет данных</td></tr>`;
        return;
      }

      tbody.innerHTML = "";
      climbers.forEach((c) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(c.full_name)}</td>
          <td>${escapeHtml(c.address)}</td>
          <td style="white-space:nowrap;"></td>
        `;
        const actions = tr.querySelector("td:last-child");

        // Редактировать
        const btnEdit = document.createElement("button");
        btnEdit.type = "button";
        btnEdit.textContent = "Редактировать";
        btnEdit.addEventListener("click", () => openEditForm(c));
        actions.appendChild(btnEdit);

        // Удалить
        const btnDel = document.createElement("button");
        btnDel.type = "button";
        btnDel.textContent = "Удалить";
        btnDel.style.marginLeft = ".5rem";
        btnDel.addEventListener("click", async () => {
          if (!confirm(`Удалить альпиниста "${c.full_name}"?`)) return;
          try {
            await apiClimbers.delete(c.id);
            await loadClimbers();
          } catch (err) {
            alert("Ошибка: " + err.message);
          }
        });
        actions.appendChild(btnDel);

        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="3">Ошибка: ${err.message}</td></tr>`;
    }
  }

  // --------- Создание (с крестиком) ----------
  function openCreateForm() {
    closeForms();

    const wrap = document.createElement("div");
    wrap.id = "create-climber-wrap";
    Object.assign(wrap.style, panelStyle());

    const closeBtn = makeCloseButton(() => wrap.remove());

    const h = document.createElement("h3");
    h.textContent = "Новый альпинист";

    const form = document.createElement("form");
    form.innerHTML = `
      <input type="text" name="full_name" placeholder="ФИО" required />
      <input type="text" name="address" placeholder="Адрес" required />
      <button type="submit">Добавить</button>
    `;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.full_name.trim()) return alert("Укажите ФИО");
      if (!data.address.trim()) return alert("Укажите адрес");

      try {
        await apiClimbers.create({
          full_name: data.full_name.trim(),
          address: data.address.trim(),
        });
        wrap.remove();
        await loadClimbers();
        alert("Альпинист добавлен");
      } catch (err) {
        alert("Ошибка: " + err.message);
      }
    });

    wrap.append(closeBtn, h, form);
    formsHost.appendChild(wrap);
    wrap.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // --------- Редактирование (с крестиком) ----------
  function openEditForm(climber) {
    closeForms();

    const wrap = document.createElement("div");
    wrap.id = "edit-climber-wrap";
    Object.assign(wrap.style, panelStyle());

    const closeBtn = makeCloseButton(() => wrap.remove());

    const h = document.createElement("h3");
    h.textContent = `Редактировать: ${climber.full_name}`;

    const form = document.createElement("form");
    form.innerHTML = `
      <input type="text" name="full_name" placeholder="ФИО" required />
      <input type="text" name="address" placeholder="Адрес" required />
      <button type="submit">Сохранить</button>
    `;

    // Префилл
    form.full_name.value = climber.full_name || "";
    form.address.value = climber.address || "";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.full_name.trim()) return alert("Укажите ФИО");
      if (!data.address.trim()) return alert("Укажите адрес");

      try {
        await apiClimbers.update(climber.id, {
          full_name: data.full_name.trim(),
          address: data.address.trim(),
        });
        wrap.remove();
        await loadClimbers();
        alert("Сохранено");
      } catch (err) {
        alert("Ошибка: " + err.message);
      }
    });

    wrap.append(closeBtn, h, form);
    formsHost.appendChild(wrap);
    wrap.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function closeForms() {
    formsHost.innerHTML = "";
  }
}

// Экранизация HTML
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Стили панели формы
function panelStyle() {
  return {
    marginTop: "1rem",
    position: "relative",
    padding: "0.75rem",
    border: "1px solid #dee2e6",
    borderRadius: "6px",
    background: "#fff",
  };
}

// Кнопка закрытия (крестик)
function makeCloseButton(onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "✕";
  btn.setAttribute("aria-label", "Закрыть форму");
  Object.assign(btn.style, {
    position: "absolute",
    top: "6px",
    right: "6px",
    border: "none",
    background: "transparent",
    fontSize: "16px",
    cursor: "pointer",
    color: "#6c757d",
  });
  btn.addEventListener("click", onClick);
  return btn;
}
