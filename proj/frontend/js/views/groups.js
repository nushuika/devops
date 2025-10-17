import { apiGroups, apiMountains } from "../api.js";

/**
 * View: список групп (восхождений)
 * + фильтр по периоду
 * + создание группы (с крестиком закрытия)
 * + редактирование/удаление группы
 * + кнопка "Детали" в столбце "Действия"
 */
export async function GroupsView() {
  const container = document.createElement("div");

  // Заголовок
  const title = document.createElement("h1");
  title.textContent = "Группы восхождений";
  container.appendChild(title);

  // Фильтр по датам
  const filterForm = document.createElement("form");
  filterForm.setAttribute("aria-label", "Фильтр по датам");
  filterForm.innerHTML = `
    <h3>Фильтр</h3>
    <div style="display:flex; gap:.5rem; flex-wrap:wrap; align-items:center;">
      <label>С даты: <input type="date" name="from"></label>
      <label>По дату: <input type="date" name="to"></label>
      <button type="submit">Показать</button>
      <button type="button" id="resetFilter" class="secondary">Сбросить</button>
      <button type="button" id="openCreate" style="margin-left:.5rem;">Добавить группу</button>
    </div>
  `;
  container.appendChild(filterForm);

  // Контейнеры для форм
  const formsHost = document.createElement("div");
  formsHost.id = "forms-host";
  container.appendChild(formsHost);

  // Таблица результатов
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Название группы</th>
        <th>Вершина</th>
        <th>Дата начала</th>
        <th>Дата окончания</th>
        <th>Действия</th>
      </tr>
    </thead>
    <tbody><tr><td colspan="5">Загрузка…</td></tr></tbody>
  `;
  container.appendChild(table);
  const tbody = table.querySelector("tbody");

  // Обработчики фильтра
  filterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await loadGroups();
  });
  filterForm.querySelector("#resetFilter").addEventListener("click", async () => {
    filterForm.from.value = "";
    filterForm.to.value = "";
    await loadGroups();
  });
  filterForm.querySelector("#openCreate").addEventListener("click", async () => {
    openCreateForm();
  });

  // Первая загрузка
  await loadGroups();

  return container;

  // --------- Загрузка списка ----------
  async function loadGroups() {
    closeForms(); // закрыть открытые формы при перезагрузке списка
    tbody.innerHTML = `<tr><td colspan="5">Загрузка…</td></tr>`;
    try {
      const from = filterForm.from.value || undefined;
      const to = filterForm.to.value || undefined;
      const groups = await apiGroups.list(from, to);

      if (!groups || groups.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">Нет данных</td></tr>`;
        return;
      }

      tbody.innerHTML = "";
      groups.forEach((g) => {
        const tr = document.createElement("tr");

        const nameTd = document.createElement("td");
        nameTd.textContent = g.name; // имя НЕ ссылка — по ТЗ детали через кнопку
        tr.appendChild(nameTd);

        const mtd = document.createElement("td");
        mtd.textContent = g.mountain_name ?? g.mountain?.name ?? "-";
        tr.appendChild(mtd);

        const std = document.createElement("td");
        std.textContent = g.start_date;
        tr.appendChild(std);

        const etd = document.createElement("td");
        etd.textContent = g.end_date || "-";
        tr.appendChild(etd);

        const actions = document.createElement("td");
        actions.style.whiteSpace = "nowrap";

        // Детали
        const btnDetails = document.createElement("button");
        btnDetails.type = "button";
        btnDetails.textContent = "Детали";
        btnDetails.addEventListener("click", () => {
          // открываем страницу деталей через роутер
          window.location.hash = `#/groups/${g.id}`;
        });
        actions.appendChild(btnDetails);

        // Редактировать
        const btnEdit = document.createElement("button");
        btnEdit.type = "button";
        btnEdit.textContent = "Редактировать";
        btnEdit.style.marginLeft = ".5rem";
        btnEdit.addEventListener("click", () => openEditForm(g));
        actions.appendChild(btnEdit);

        // Удалить
        const btnDel = document.createElement("button");
        btnDel.type = "button";
        btnDel.textContent = "Удалить";
        btnDel.style.marginLeft = ".5rem";
        btnDel.addEventListener("click", async () => {
          if (!confirm(`Удалить группу "${g.name}"?`)) return;
          try {
            await apiGroups.delete(g.id);
            await loadGroups();
          } catch (err) {
            alert("Ошибка: " + err.message);
          }
        });
        actions.appendChild(btnDel);

        tr.appendChild(actions);
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5">Ошибка: ${err.message}</td></tr>`;
    }
  }

  // ---------- Форма создания ----------
  async function openCreateForm() {
    closeForms();
    const wrap = document.createElement("div");
    wrap.id = "create-group-wrap";
    wrap.style.marginTop = "1rem";
    wrap.style.position = "relative";
    wrap.style.padding = "0.75rem";
    wrap.style.border = "1px solid #dee2e6";
    wrap.style.borderRadius = "6px";
    wrap.style.background = "#fff";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "✕";
    closeBtn.setAttribute("aria-label", "Закрыть форму");
    Object.assign(closeBtn.style, {
      position: "absolute",
      top: "6px",
      right: "6px",
      border: "none",
      background: "transparent",
      fontSize: "16px",
      cursor: "pointer",
      color: "#6c757d",
    });
    closeBtn.addEventListener("click", () => wrap.remove());

    const title = document.createElement("h3");
    title.textContent = "Новая группа";

    // Список вершин
    let mountains = [];
    try {
      mountains = await apiMountains.list();
    } catch (e) {
      // допускаем пустой список
    }

    const form = document.createElement("form");
    form.innerHTML = `
      <input type="text" name="name" placeholder="Название группы" required />
      <label>Вершина:
        <select name="mountain_id" required>
          <option value="" disabled selected>— выберите вершину —</option>
          ${mountains
            .map(
              (m) =>
                `<option value="${m.id}">${escapeHtml(m.name)} (${escapeHtml(
                  m.country
                )}${m.region ? ", " + escapeHtml(m.region) : ""})</option>`
            )
            .join("")}
        </select>
      </label>
      <label>Дата начала: <input type="date" name="start_date" required /></label>
      <label>Дата окончания: <input type="date" name="end_date" /></label>
      <button type="submit">Создать группу</button>
    `;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const payload = {
        name: data.name.trim(),
        mountain_id: parseInt(data.mountain_id, 10),
        start_date: data.start_date,
        end_date: data.end_date || null,
      };
      if (!payload.name) return alert("Укажите название группы");
      if (!payload.mountain_id) return alert("Выберите вершину");
      if (!payload.start_date) return alert("Укажите дату начала");

      try {
        await apiGroups.create(payload);
        wrap.remove();
        await loadGroups();
        alert("Группа создана");
      } catch (err) {
        alert("Ошибка: " + err.message);
      }
    });

    wrap.append(closeBtn, title, form);
    formsHost.appendChild(wrap);
    wrap.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // ---------- Форма редактирования ----------
  async function openEditForm(group) {
    closeForms();
    const wrap = document.createElement("div");
    wrap.id = "edit-group-wrap";
    wrap.style.marginTop = "1rem";
    wrap.style.position = "relative";
    wrap.style.padding = "0.75rem";
    wrap.style.border = "1px solid #dee2e6";
    wrap.style.borderRadius = "6px";
    wrap.style.background = "#fff";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "✕";
    closeBtn.setAttribute("aria-label", "Закрыть форму");
    Object.assign(closeBtn.style, {
      position: "absolute",
      top: "6px",
      right: "6px",
      border: "none",
      background: "transparent",
      fontSize: "16px",
      cursor: "pointer",
      color: "#6c757d",
    });
    closeBtn.addEventListener("click", () => wrap.remove());

    const title = document.createElement("h3");
    title.textContent = `Редактировать группу: ${group.name}`;

    // Список вершин
    let mountains = [];
    try {
      mountains = await apiMountains.list();
    } catch (e) {}

    const form = document.createElement("form");
    form.innerHTML = `
      <input type="text" name="name" placeholder="Название группы" required />
      <label>Вершина:
        <select name="mountain_id" required>
          <option value="" disabled>— выберите вершину —</option>
          ${mountains
            .map(
              (m) =>
                `<option value="${m.id}">${escapeHtml(m.name)} (${escapeHtml(
                  m.country
                )}${m.region ? ", " + escapeHtml(m.region) : ""})</option>`
            )
            .join("")}
        </select>
      </label>
      <label>Дата начала: <input type="date" name="start_date" required /></label>
      <label>Дата окончания: <input type="date" name="end_date" /></label>
      <button type="submit">Сохранить</button>
    `;

    // Префилл текущих значений
    form.name.value = group.name || "";
    form.mountain_id.value = group.mountain_id || "";
    form.start_date.value = group.start_date || "";
    form.end_date.value = group.end_date || "";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const payload = {
        name: data.name.trim(),
        mountain_id: parseInt(data.mountain_id, 10),
        start_date: data.start_date,
        end_date: data.end_date || null,
      };
      if (!payload.name) return alert("Укажите название группы");
      if (!payload.mountain_id) return alert("Выберите вершину");
      if (!payload.start_date) return alert("Укажите дату начала");

      try {
        await apiGroups.update(group.id, payload);
        wrap.remove();
        await loadGroups();
        alert("Сохранено");
      } catch (err) {
        alert("Ошибка: " + err.message);
      }
    });

    wrap.append(closeBtn, title, form);
    formsHost.appendChild(wrap);
    wrap.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function closeForms() {
    formsHost.innerHTML = "";
  }
}

// Простейшая экранизация пользовательского ввода
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
