import { apiMountains } from "../api.js";

/**
 * View: список гор
 * - создание вершины (с крестиком закрытия)
 * - редактирование (только если не было восхождений)
 * - удаление (только если не было восхождений)
 */
export async function MountainsView() {
  const container = document.createElement("div");

  const title = document.createElement("h1");
  title.textContent = "Список гор";
  container.appendChild(title);

  // Узел для форм (create/edit)
  const formsHost = document.createElement("div");
  formsHost.id = "forms-host";
  container.appendChild(formsHost);

  // Кнопка добавить вершину
  const addBtn = document.createElement("button");
  addBtn.textContent = "Добавить вершину";
  addBtn.addEventListener("click", () => openCreateForm());
  container.appendChild(addBtn);

  // Таблица гор
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Название</th>
      <th>Высота (м)</th>
      <th>Страна</th>
      <th>Регион</th>
      <th>Восхождений</th>
      <th>Действия</th>
    </tr>`;
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  container.appendChild(table);

  await loadMountains();

  return container;

  // ---------------- helpers ----------------

  async function loadMountains() {
    closeForms();
    tbody.innerHTML = `<tr><td colspan="6">Загрузка…</td></tr>`;
    try {
      const mountains = await apiMountains.list();
      if (!mountains.length) {
        tbody.innerHTML = `<tr><td colspan="6">Нет данных</td></tr>`;
        return;
      }
      tbody.innerHTML = "";
      mountains.forEach((m) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(m.name)}</td>
          <td>${Number(m.height_m)}</td>
          <td>${escapeHtml(m.country)}</td>
          <td>${escapeHtml(m.region || "")}</td>
          <td>${Number(m.ascentCount || 0)}</td>
          <td style="white-space:nowrap;"></td>
        `;
        const actions = tr.querySelector("td:last-child");

        // Просмотр (детали вершины)
        const btnView = document.createElement("button");
        btnView.type = "button";
        btnView.textContent = "Просмотр";
        btnView.addEventListener("click", () => {
          window.location.hash = `#/mountains/${m.id}`;
        });
        actions.appendChild(btnView);

        // Редактировать (только если не было восхождений)
        if (!m.ascentCount) {
          const btnEdit = document.createElement("button");
          btnEdit.type = "button";
          btnEdit.textContent = "Редактировать";
          btnEdit.style.marginLeft = ".5rem";
          btnEdit.addEventListener("click", () => openEditForm(m));
          actions.appendChild(btnEdit);

          const btnDel = document.createElement("button");
          btnDel.type = "button";
          btnDel.textContent = "Удалить";
          btnDel.style.marginLeft = ".5rem";
          btnDel.addEventListener("click", async () => {
            if (!confirm(`Удалить вершину "${m.name}"?`)) return;
            try {
              await apiMountains.delete(m.id);
              await loadMountains();
            } catch (err) {
              alert("Ошибка: " + err.message);
            }
          });
          actions.appendChild(btnDel);
        }

        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6">Ошибка: ${err.message}</td></tr>`;
    }
  }

  function openCreateForm() {
    closeForms();

    const wrap = document.createElement("div");
    wrap.id = "create-mountain-wrap";
    Object.assign(wrap.style, panelStyle());

    const closeBtn = makeCloseButton(() => wrap.remove());

    const h = document.createElement("h3");
    h.textContent = "Новая вершина";

    const form = document.createElement("form");
    form.innerHTML = `
      <input type="text" name="name" placeholder="Название" required />
      <input type="number" name="height_m" placeholder="Высота (м)" required />
      <input type="text" name="country" placeholder="Страна" required />
      <input type="text" name="region" placeholder="Регион" />
      <button type="submit">Сохранить</button>
    `;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const payload = {
        name: data.name.trim(),
        height_m: parseInt(data.height_m, 10),
        country: data.country.trim(),
        region: data.region.trim(),
      };
      if (!payload.name) return alert("Укажите название");
      if (!Number.isInteger(payload.height_m) || payload.height_m <= 0)
        return alert("Высота должна быть положительным целым");
      if (!payload.country) return alert("Укажите страну");

      try {
        await apiMountains.create(payload);
        wrap.remove();
        await loadMountains();
        alert("Вершина создана");
      } catch (err) {
        alert("Ошибка: " + err.message);
      }
    });

    wrap.append(closeBtn, h, form);
    formsHost.appendChild(wrap);
    wrap.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function openEditForm(mountain) {
    closeForms();

    const wrap = document.createElement("div");
    wrap.id = "edit-mountain-wrap";
    Object.assign(wrap.style, panelStyle());

    const closeBtn = makeCloseButton(() => wrap.remove());

    const h = document.createElement("h3");
    h.textContent = `Редактировать: ${mountain.name}`;

    const form = document.createElement("form");
    form.innerHTML = `
      <input type="text" name="name" placeholder="Название" required />
      <input type="number" name="height_m" placeholder="Высота (м)" required />
      <input type="text" name="country" placeholder="Страна" required />
      <input type="text" name="region" placeholder="Регион" />
      <button type="submit">Сохранить изменения</button>
    `;

    // Префилл
    form.name.value = mountain.name || "";
    form.height_m.value = mountain.height_m || "";
    form.country.value = mountain.country || "";
    form.region.value = mountain.region || "";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const payload = {
        name: data.name.trim(),
        height_m: parseInt(data.height_m, 10),
        country: data.country.trim(),
        region: data.region.trim(),
      };
      if (!payload.name) return alert("Укажите название");
      if (!Number.isInteger(payload.height_m) || payload.height_m <= 0)
        return alert("Высота должна быть положительным целым");
      if (!payload.country) return alert("Укажите страну");

      try {
        await apiMountains.update(mountain.id, payload);
        wrap.remove();
        await loadMountains();
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

// Локальные утилиты
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
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
