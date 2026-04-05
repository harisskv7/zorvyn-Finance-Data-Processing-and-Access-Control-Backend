const state = {
  apiBase: window.location.origin,
  token: localStorage.getItem("finance_token") || "",
  user: JSON.parse(localStorage.getItem("finance_user") || "null"),
  currentSection: "overview",
  recordsPage: 1,
  recordsLimit: 10,
  recordsPagination: null,
  recordFilters: {
    type: "",
    category: "",
    from: "",
    to: "",
  },
};

const els = {
  toast: document.getElementById("toast"),
  authPanel: document.getElementById("auth-panel"),
  appPanel: document.getElementById("app-panel"),
  loginForm: document.getElementById("login-form"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  whoami: document.getElementById("whoami"),
  statusChip: document.getElementById("status-chip"),
  logoutBtn: document.getElementById("logout-btn"),
  sectionTitle: document.getElementById("section-title"),
  navLinks: document.querySelectorAll(".nav-link"),
  openDocsBtn: document.getElementById("open-docs-btn"),

  overviewSection: document.getElementById("overview-section"),
  recordsSection: document.getElementById("records-section"),
  analyticsSection: document.getElementById("analytics-section"),
  usersSection: document.getElementById("users-section"),

  kpiIncome: document.getElementById("kpi-income"),
  kpiExpenses: document.getElementById("kpi-expenses"),
  kpiBalance: document.getElementById("kpi-balance"),
  kpiCount: document.getElementById("kpi-count"),
  recentBody: document.getElementById("recent-body"),
  refreshOverviewBtn: document.getElementById("refresh-overview-btn"),

  recordFilterForm: document.getElementById("record-filter-form"),
  filterType: document.getElementById("filter-type"),
  filterCategory: document.getElementById("filter-category"),
  filterFrom: document.getElementById("filter-from"),
  filterTo: document.getElementById("filter-to"),
  clearFiltersBtn: document.getElementById("clear-filters-btn"),
  refreshRecordsBtn: document.getElementById("refresh-records-btn"),
  newRecordBtn: document.getElementById("new-record-btn"),
  recordsBody: document.getElementById("records-body"),
  prevPageBtn: document.getElementById("prev-page-btn"),
  nextPageBtn: document.getElementById("next-page-btn"),
  recordsPageMeta: document.getElementById("records-page-meta"),

  refreshAnalyticsBtn: document.getElementById("refresh-analytics-btn"),
  trendPeriod: document.getElementById("trend-period"),
  categoryBody: document.getElementById("category-body"),
  trendsBody: document.getElementById("trends-body"),

  refreshUsersBtn: document.getElementById("refresh-users-btn"),
  usersBody: document.getElementById("users-body"),

  recordDialog: document.getElementById("record-dialog"),
  recordForm: document.getElementById("record-form"),
  recordFormTitle: document.getElementById("record-form-title"),
  recordId: document.getElementById("record-id"),
  recordAmount: document.getElementById("record-amount"),
  recordType: document.getElementById("record-type"),
  recordCategory: document.getElementById("record-category"),
  recordDate: document.getElementById("record-date"),
  recordNotes: document.getElementById("record-notes"),
  cancelRecordBtn: document.getElementById("cancel-record-btn"),
};

function showToast(message, type = "success") {
  els.toast.textContent = message;
  els.toast.className = `toast show ${type}`;

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.className = "toast";
  }, 2600);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(dateStr) {
  if (!dateStr) {
    return "-";
  }

  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? dateStr : date.toLocaleDateString();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isAdmin() {
  return state.user?.role === "admin";
}

function canAccessRecords() {
  return state.user?.role === "analyst" || state.user?.role === "admin";
}

function canAccessAnalytics() {
  return state.user?.role === "analyst" || state.user?.role === "admin";
}

function canUseFilters() {
  return canAccessRecords();
}

function setStatusChip() {
  if (!state.user) {
    els.statusChip.textContent = "Disconnected";
    return;
  }

  const role = state.user.role.toUpperCase();
  els.statusChip.textContent = `Connected • ${role}`;
}

async function apiRequest(path, options = {}) {
  const method = options.method || "GET";
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (state.token && options.auth !== false) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${state.apiBase}/api${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const errorMessage = payload?.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function persistAuth() {
  if (state.token && state.user) {
    localStorage.setItem("finance_token", state.token);
    localStorage.setItem("finance_user", JSON.stringify(state.user));
    return;
  }

  localStorage.removeItem("finance_token");
  localStorage.removeItem("finance_user");
}

function resetAuth() {
  state.token = "";
  state.user = null;
  persistAuth();
  renderAuthState();
}

function renderAuthState() {
  const signedIn = Boolean(state.token && state.user);

  els.authPanel.hidden = signedIn;
  els.appPanel.hidden = !signedIn;
  els.logoutBtn.hidden = !signedIn;

  if (!signedIn) {
    els.whoami.textContent = "Not signed in";
    setStatusChip();
    return;
  }

  els.whoami.textContent = `${state.user.name} (${state.user.role})`;
  setStatusChip();
  syncRoleBasedControls();
}

function syncRoleBasedControls() {
  const recordsNav = document.querySelector('.nav-link[data-section="records"]');
  const analyticsNav = document.querySelector('.nav-link[data-section="analytics"]');
  const usersNav = document.querySelector('.nav-link[data-section="users"]');

  recordsNav.hidden = !canAccessRecords();
  analyticsNav.hidden = !canAccessAnalytics();
  usersNav.hidden = !isAdmin();
  els.newRecordBtn.hidden = !isAdmin();

  Array.from(els.recordFilterForm.elements).forEach((field) => {
    if (field.id === "clear-filters-btn") {
      return;
    }

    if (field.id === "filter-type" || field.id === "filter-category" || field.id === "filter-from" || field.id === "filter-to") {
      field.disabled = !canUseFilters();
    }
  });

  if (!canUseFilters()) {
    els.recordFilterForm.title = "Records and filters are enabled for Analyst/Admin roles";
  } else {
    els.recordFilterForm.title = "";
  }
}

function showSection(section) {
  if (!state.user) {
    showToast("Please sign in first", "error");
    return;
  }

  if (section === "analytics" && !canAccessAnalytics()) {
    showToast("Analytics access requires Analyst or Admin role", "error");
    return;
  }

  if (section === "records" && !canAccessRecords()) {
    showToast("Records access requires Analyst or Admin role", "error");
    return;
  }

  if (section === "users" && !isAdmin()) {
    showToast("Users management is Admin only", "error");
    return;
  }

  state.currentSection = section;

  els.overviewSection.hidden = section !== "overview";
  els.recordsSection.hidden = section !== "records";
  els.analyticsSection.hidden = section !== "analytics";
  els.usersSection.hidden = section !== "users";

  els.navLinks.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === section);
  });

  const titleMap = {
    overview: "Overview",
    records: "Records",
    analytics: "Analytics",
    users: "Users",
  };
  els.sectionTitle.textContent = titleMap[section] || "Overview";

  refreshCurrentSection();
}

async function restoreSession() {
  if (!state.token || !state.user?.id) {
    renderAuthState();
    return;
  }

  try {
    const result = await apiRequest(`/users/${state.user.id}`);
    state.user = result.data.user;
    persistAuth();
    renderAuthState();
    await refreshCurrentSection();
  } catch (error) {
    resetAuth();
    showToast("Session expired. Please sign in again.", "error");
  }
}

async function refreshCurrentSection() {
  if (!state.user) {
    return;
  }

  if (state.currentSection === "overview") {
    await loadOverview();
    return;
  }

  if (state.currentSection === "records") {
    await loadRecords();
    return;
  }

  if (state.currentSection === "analytics") {
    await loadAnalytics();
    return;
  }

  if (state.currentSection === "users") {
    await loadUsers();
  }
}

function renderRows(target, rows, emptyMessage) {
  if (!rows.length) {
    target.innerHTML = `<tr><td colspan="8" class="empty-state">${escapeHtml(emptyMessage)}</td></tr>`;
    return;
  }

  target.innerHTML = rows.join("");
}

async function loadOverview() {
  try {
    const [summaryResp, recentResp] = await Promise.all([
      apiRequest("/dashboard/summary"),
      apiRequest("/dashboard/recent?limit=5"),
    ]);

    const summary = summaryResp.data.summary;
    const recent = recentResp.data.transactions;

    els.kpiIncome.textContent = formatCurrency(summary.total_income);
    els.kpiExpenses.textContent = formatCurrency(summary.total_expenses);
    els.kpiBalance.textContent = formatCurrency(summary.net_balance);
    els.kpiCount.textContent = String(summary.record_count);

    const rows = recent.map((record) => `
      <tr>
        <td>${escapeHtml(record.date)}</td>
        <td><span class="badge ${escapeHtml(record.type)}">${escapeHtml(record.type)}</span></td>
        <td>${escapeHtml(record.category)}</td>
        <td>${formatCurrency(record.amount)}</td>
        <td>${escapeHtml(record.created_by_name)}</td>
      </tr>
    `);

    renderRows(els.recentBody, rows, "No recent transactions.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function buildRecordQuery() {
  const params = new URLSearchParams();
  params.set("page", String(state.recordsPage));
  params.set("limit", String(state.recordsLimit));

  if (canUseFilters()) {
    if (state.recordFilters.type) {
      params.set("type", state.recordFilters.type);
    }

    if (state.recordFilters.category) {
      params.set("category", state.recordFilters.category);
    }

    if (state.recordFilters.from) {
      params.set("from", state.recordFilters.from);
    }

    if (state.recordFilters.to) {
      params.set("to", state.recordFilters.to);
    }
  }

  return params.toString();
}

function renderRecordActions(record) {
  if (!isAdmin()) {
    return "-";
  }

  return `
    <div class="inline-actions">
      <button class="secondary-btn" data-action="edit-record" data-id="${record.id}">Edit</button>
      <button class="danger-btn" data-action="delete-record" data-id="${record.id}">Delete</button>
    </div>
  `;
}

async function loadRecords() {
  if (!canAccessRecords()) {
    return;
  }

  try {
    const query = buildRecordQuery();
    const response = await apiRequest(`/records?${query}`);

    const records = response.data.records;
    state.recordsPagination = response.data.pagination;

    const rows = records.map(
      (record) => `
      <tr>
        <td>${record.id}</td>
        <td>${escapeHtml(record.date)}</td>
        <td><span class="badge ${escapeHtml(record.type)}">${escapeHtml(record.type)}</span></td>
        <td>${escapeHtml(record.category)}</td>
        <td>${formatCurrency(record.amount)}</td>
        <td>${escapeHtml(record.notes || "-")}</td>
        <td>${escapeHtml(record.created_by_name)}</td>
        <td>${renderRecordActions(record)}</td>
      </tr>
    `
    );

    renderRows(els.recordsBody, rows, "No records available.");

    const p = state.recordsPagination;
    els.recordsPageMeta.textContent = `Page ${p.page} of ${p.totalPages || 1} • Total ${p.total}`;
    els.prevPageBtn.disabled = !p.hasPrevPage;
    els.nextPageBtn.disabled = !p.hasNextPage;
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function loadAnalytics() {
  if (!canAccessAnalytics()) {
    return;
  }

  try {
    const period = els.trendPeriod.value;
    const [categoryResp, trendsResp] = await Promise.all([
      apiRequest("/dashboard/by-category"),
      apiRequest(`/dashboard/trends?period=${encodeURIComponent(period)}`),
    ]);

    const categoryRows = categoryResp.data.categories.map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.category)}</td>
        <td>${formatCurrency(row.total_income)}</td>
        <td>${formatCurrency(row.total_expenses)}</td>
        <td>${formatCurrency(row.net_amount)}</td>
        <td>${row.record_count}</td>
      </tr>
    `
    );
    renderRows(els.categoryBody, categoryRows, "No category analytics yet.");

    const trendRows = trendsResp.data.trends.map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.period)}</td>
        <td>${formatCurrency(row.total_income)}</td>
        <td>${formatCurrency(row.total_expenses)}</td>
        <td>${formatCurrency(row.net_amount)}</td>
        <td>${row.record_count}</td>
      </tr>
    `
    );
    renderRows(els.trendsBody, trendRows, "No trend data yet.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function loadUsers() {
  if (!isAdmin()) {
    return;
  }

  try {
    const response = await apiRequest("/users?page=1&limit=100");
    const users = response.data.users;

    const rows = users.map(
      (user) => `
      <tr>
        <td>${user.id}</td>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>
          <select id="role-${user.id}">
            <option value="viewer" ${user.role === "viewer" ? "selected" : ""}>viewer</option>
            <option value="analyst" ${user.role === "analyst" ? "selected" : ""}>analyst</option>
            <option value="admin" ${user.role === "admin" ? "selected" : ""}>admin</option>
          </select>
        </td>
        <td>
          <select id="status-${user.id}">
            <option value="active" ${user.status === "active" ? "selected" : ""}>active</option>
            <option value="inactive" ${user.status === "inactive" ? "selected" : ""}>inactive</option>
          </select>
        </td>
        <td>${escapeHtml(user.created_at)}</td>
        <td>
          <button class="secondary-btn" data-action="save-user" data-id="${user.id}" data-role="${user.role}" data-status="${user.status}">Save</button>
        </td>
      </tr>
    `
    );

    renderRows(els.usersBody, rows, "No users found.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function openRecordDialog(record = null) {
  if (!isAdmin()) {
    return;
  }

  if (record) {
    els.recordFormTitle.textContent = `Edit Record #${record.id}`;
    els.recordId.value = String(record.id);
    els.recordAmount.value = String(record.amount);
    els.recordType.value = record.type;
    els.recordCategory.value = record.category;
    els.recordDate.value = record.date;
    els.recordNotes.value = record.notes || "";
  } else {
    els.recordFormTitle.textContent = "New Record";
    els.recordId.value = "";
    els.recordAmount.value = "";
    els.recordType.value = "income";
    els.recordCategory.value = "";
    els.recordDate.value = new Date().toISOString().slice(0, 10);
    els.recordNotes.value = "";
  }

  els.recordDialog.showModal();
}

function closeRecordDialog() {
  els.recordDialog.close();
}

async function handleLogin(event) {
  event.preventDefault();

  try {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      auth: false,
      body: {
        email: els.email.value.trim(),
        password: els.password.value,
      },
    });

    state.token = response.data.token;
    state.user = response.data.user;
    persistAuth();
    renderAuthState();

    els.password.value = "";
    showSection("overview");
    showToast(`Welcome, ${state.user.name}`);
  } catch (error) {
    showToast(error.message, "error");
  }
}

function handleLogout() {
  resetAuth();
  showToast("Logged out successfully");
}

async function handleRecordAction(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const action = target.dataset.action;
  if (!action) {
    return;
  }

  const id = target.dataset.id;
  if (!id) {
    return;
  }

  if (action === "edit-record") {
    try {
      const response = await apiRequest(`/records/${id}`);
      openRecordDialog(response.data.record);
    } catch (error) {
      showToast(error.message, "error");
    }
    return;
  }

  if (action === "delete-record") {
    const ok = window.confirm("Soft delete this record?");
    if (!ok) {
      return;
    }

    try {
      await apiRequest(`/records/${id}`, { method: "DELETE" });
      showToast("Record deleted");
      await Promise.all([loadRecords(), loadOverview()]);
      if (canAccessAnalytics()) {
        await loadAnalytics();
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  }
}

async function handleRecordSubmit(event) {
  event.preventDefault();

  const id = els.recordId.value.trim();

  const payload = {
    amount: Number(els.recordAmount.value),
    type: els.recordType.value,
    category: els.recordCategory.value.trim(),
    date: els.recordDate.value,
    notes: els.recordNotes.value.trim() || undefined,
  };

  try {
    if (id) {
      await apiRequest(`/records/${id}`, { method: "PATCH", body: payload });
      showToast("Record updated");
    } else {
      await apiRequest("/records", { method: "POST", body: payload });
      showToast("Record created");
    }

    closeRecordDialog();
    await Promise.all([loadRecords(), loadOverview()]);
    if (canAccessAnalytics()) {
      await loadAnalytics();
    }
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleUserAction(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement) || target.dataset.action !== "save-user") {
    return;
  }

  const userId = target.dataset.id;
  if (!userId) {
    return;
  }

  const roleSelect = document.getElementById(`role-${userId}`);
  const statusSelect = document.getElementById(`status-${userId}`);
  if (!(roleSelect instanceof HTMLSelectElement) || !(statusSelect instanceof HTMLSelectElement)) {
    return;
  }

  const nextRole = roleSelect.value;
  const nextStatus = statusSelect.value;
  const prevRole = target.dataset.role;
  const prevStatus = target.dataset.status;

  try {
    if (nextRole !== prevRole) {
      await apiRequest(`/users/${userId}/role`, {
        method: "PATCH",
        body: { role: nextRole },
      });
    }

    if (nextStatus !== prevStatus) {
      await apiRequest(`/users/${userId}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
    }

    if (nextRole === prevRole && nextStatus === prevStatus) {
      showToast("No changes to save");
      return;
    }

    showToast("User updated successfully");
    await loadUsers();
  } catch (error) {
    showToast(error.message, "error");
  }
}

function bindEvents() {
  els.loginForm.addEventListener("submit", handleLogin);
  els.logoutBtn.addEventListener("click", handleLogout);
  els.openDocsBtn.addEventListener("click", () => {
    window.open("/api/docs", "_blank", "noopener,noreferrer");
  });

  els.navLinks.forEach((btn) => {
    btn.addEventListener("click", () => showSection(btn.dataset.section));
  });

  els.refreshOverviewBtn.addEventListener("click", loadOverview);
  els.refreshRecordsBtn.addEventListener("click", loadRecords);
  els.refreshAnalyticsBtn.addEventListener("click", loadAnalytics);
  els.refreshUsersBtn.addEventListener("click", loadUsers);

  els.recordFilterForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!canUseFilters()) {
      showToast("Records and filters are available for Analyst/Admin only", "error");
      return;
    }

    state.recordFilters.type = els.filterType.value;
    state.recordFilters.category = els.filterCategory.value.trim();
    state.recordFilters.from = els.filterFrom.value;
    state.recordFilters.to = els.filterTo.value;
    state.recordsPage = 1;
    loadRecords();
  });

  els.clearFiltersBtn.addEventListener("click", () => {
    state.recordFilters = { type: "", category: "", from: "", to: "" };
    els.filterType.value = "";
    els.filterCategory.value = "";
    els.filterFrom.value = "";
    els.filterTo.value = "";
    state.recordsPage = 1;
    loadRecords();
  });

  els.prevPageBtn.addEventListener("click", () => {
    if (state.recordsPagination?.hasPrevPage) {
      state.recordsPage -= 1;
      loadRecords();
    }
  });

  els.nextPageBtn.addEventListener("click", () => {
    if (state.recordsPagination?.hasNextPage) {
      state.recordsPage += 1;
      loadRecords();
    }
  });

  els.trendPeriod.addEventListener("change", loadAnalytics);

  els.newRecordBtn.addEventListener("click", () => openRecordDialog());
  els.cancelRecordBtn.addEventListener("click", closeRecordDialog);
  els.recordForm.addEventListener("submit", handleRecordSubmit);

  els.recordsBody.addEventListener("click", handleRecordAction);
  els.usersBody.addEventListener("click", handleUserAction);
}

function init() {
  bindEvents();
  renderAuthState();
  restoreSession();
}

init();

