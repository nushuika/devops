const BASE_URL = "http://127.0.0.1:3000"; // адрес backend-сервера

/**
 * Универсальная функция запроса
 */
async function request(path, options = {}) {
  try {
    const res = await fetch(BASE_URL + path, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ошибка ${res.status}: ${text}`);
    }

    if (res.status === 204) return null; // no content
    // Пытаемся распарсить JSON, если есть
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? await res.json() : null;
  } catch (err) {
    console.error("API error:", err);
    throw err;
  }
}

/** Хелпер для querystring */
function qs(params = {}) {
  const pairs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    );
  return pairs.length ? `?${pairs.join("&")}` : "";
}

// --------------------------- API методы ---------------------------

// Горы
export const apiMountains = {
  list: () => request("/mountains"),
  get: (id) => request(`/mountains/${id}`),
  groups: (id) => request(`/mountains/${id}/groups?sort=start_date`),
  create: (data) =>
    request("/mountains", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/mountains/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => request(`/mountains/${id}`, { method: "DELETE" }),
};

// Группы
export const apiGroups = {
  list: (from, to) => request("/groups" + qs({ from, to })),
  get: (id) => request(`/groups/${id}`),
  create: (data) =>
    request("/groups", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/groups/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => request(`/groups/${id}`, { method: "DELETE" }),
  addMember: (groupId, climberId) =>
    request(`/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ climber_id: climberId }),
    }),
};

// Альпинисты
export const apiClimbers = {
  list: (from, to) => request("/climbers" + qs({ active_from: from, active_to: to })),
  create: (data) =>
    request("/climbers", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/climbers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => request(`/climbers/${id}`, { method: "DELETE" }),
};

// Статистика
export const apiStats = {
  ascentsPerClimberPerMountain: () =>
    request("/stats/ascents-per-climber-per-mountain"),
  uniqueClimbersPerMountain: () =>
    request("/stats/unique-climbers-per-mountain"),
};
