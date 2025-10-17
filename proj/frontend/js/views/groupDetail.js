import { apiGroups, apiClimbers } from "../api.js";

export async function GroupDetailView(params) {
  const groupId = params[0];
  const container = document.createElement("div");

  const title = document.createElement("h1");
  title.textContent = "Группа";
  container.appendChild(title);

  const info = document.createElement("p");
  container.appendChild(info);

  const h2 = document.createElement("h2");
  h2.textContent = "Участники";
  container.appendChild(h2);

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>ФИО</th>
        <th>Адрес</th>
      </tr>
    </thead>
    <tbody><tr><td colspan="2">Загрузка…</td></tr></tbody>
  `;
  container.appendChild(table);
  const tbody = table.querySelector("tbody");

  // Блок добавления участника — существующего
  const addExistingWrap = document.createElement("div");
  addExistingWrap.style.marginTop = "1rem";
  addExistingWrap.innerHTML = `<h3>Добавить существующего альпиниста</h3>`;
  const addExistingForm = document.createElement("form");
  addExistingForm.innerHTML = `
    <label style="display:flex;gap:.5rem;align-items:center;">
      Альпинист:
      <select name="climber_id" required>
        <option value="" disabled selected>— выберите —</option>
      </select>
    </label>
    <button type="submit">Добавить в группу</button>
  `;
  addExistingWrap.appendChild(addExistingForm);
  container.appendChild(addExistingWrap);

  // Блок добавления участника — нового
  const addNewWrap = document.createElement("div");
  addNewWrap.style.marginTop = "1rem";
  addNewWrap.innerHTML = `<h3>Добавить нового альпиниста</h3>`;
  const addNewForm = document.createElement("form");
  addNewForm.innerHTML = `
    <input type="text" name="full_name" placeholder="ФИО" required />
    <input type="text" name="address" placeholder="Адрес" required />
    <button type="submit">Создать и добавить</button>
  `;
  addNewWrap.appendChild(addNewForm);
  container.appendChild(addNewWrap);

  // Загрузка данных группы + участников
  await load();

  // Заполнить список существующих альпинистов
  try {
    const allClimbers = await apiClimbers.list(); // без дат — вернёт всех
    const select = addExistingForm.querySelector("select[name='climber_id']");
    select.innerHTML =
      `<option value="" disabled selected>— выберите —</option>` +
      allClimbers
        .map(
          (c) =>
            `<option value="${c.id}">${escapeHtml(c.full_name)} — ${escapeHtml(
              c.address
            )}</option>`
        )
        .join("");
  } catch (e) {
    // необязательная часть UI, просто покажем сообщение
    const warn = document.createElement("p");
    warn.className = "muted";
    warn.textContent = "Не удалось загрузить список альпинистов.";
    addExistingWrap.appendChild(warn);
  }

  // Обработчик: добавить существующего в группу
  addExistingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const climber_id = Number(
      addExistingForm.querySelector("select[name='climber_id']").value
    );
    if (!climber_id) return alert("Выберите альпиниста");

    try {
      await apiGroups.addMember(groupId, climber_id);
      await load();
      alert("Добавлено");
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  });

  // Обработчик: создать нового + добавить в группу
  addNewForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(addNewForm).entries());
    if (!data.full_name.trim()) return alert("Укажите ФИО");
    if (!data.address.trim()) return alert("Укажите адрес");

    try {
      const created = await apiClimbers.create({
        full_name: data.full_name.trim(),
        address: data.address.trim(),
      });
      await apiGroups.addMember(groupId, created.id);
      addNewForm.reset();
      await load();
      alert("Альпинист создан и добавлен");
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  });

  return container;

  // ---------------- helpers ----------------

  async function load() {
    try {
      const g = await apiGroups.get(groupId);
      title.textContent = `Группа: ${g.name}`;
      info.innerHTML = `
        <strong>Вершина:</strong> ${escapeHtml(g.mountain_name ?? "-")}<br/>
        <strong>Начало:</strong> ${g.start_date}<br/>
        <strong>Окончание:</strong> ${g.end_date || "-"}
      `;

      const members = g.members || [];
      if (!members.length) {
        tbody.innerHTML = `<tr><td colspan="2">В группе пока нет участников</td></tr>`;
      } else {
        tbody.innerHTML = "";
        members.forEach((c) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${escapeHtml(c.full_name)}</td>
            <td>${escapeHtml(c.address)}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    } catch (err) {
      container.innerHTML = `<p class="error">Ошибка: ${err.message}</p>`;
    }
  }
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
