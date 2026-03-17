const STORAGE_KEY = "budget-duo-v2";

const DEFAULT_STATE = {
  household: {
    householdName: "Budget Simon",
    partnerOne: "Simon",
    partnerTwo: "Ma conjointe",
    currency: "CAD",
    currentBalance: 998,
    projectionMonths: 6,
    safetyBuffer: 1500,
  },
  paychecks: [
    {
      id: "pay_simon_abb",
      owner: "Simon",
      label: "Paie ABB",
      amount: 1988,
      frequency: "biweekly",
      nextDate: "2026-03-25",
    },
  ],
  bills: [
    {
      id: "bill_simon_mnp",
      owner: "Simon",
      label: "MNP",
      category: "Finances",
      amount: 400,
      frequency: "biweekly",
      nextDate: "2026-03-26",
    },
  ],
  savingsGoals: [
    {
      id: "saving_simon_urgence",
      owner: "Simon",
      label: "Fonds d'urgence",
      targetAmount: 1500,
      currentAmount: 300,
      contributionAmount: 300,
      frequency: "monthly",
      nextDate: "2026-04-09",
    },
  ],
  transactions: [],
};

const FREQUENCY_LABELS = {
  weekly: "Hebdomadaire",
  biweekly: "Bihebdomadaire",
  monthly: "Mensuel",
};

const TYPE_LABELS = {
  income: "Revenu",
  expense: "Depense",
  saving: "Epargne",
};

const $ = (id) => document.getElementById(id);
function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function getLast(items) {
  return items[items.length - 1];
}

let state = loadState();

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  renderAll();
});

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return cloneDefaults();
    }

    return sanitizeState(JSON.parse(raw));
  } catch (error) {
    console.error("Chargement impossible:", error);
    return cloneDefaults();
  }
}

function sanitizeState(input) {
  return {
    household: { ...cloneDefaults().household, ...(input.household || {}) },
    paychecks: Array.isArray(input.paychecks) ? input.paychecks : [],
    bills: Array.isArray(input.bills) ? input.bills : [],
    savingsGoals: Array.isArray(input.savingsGoals) ? input.savingsGoals : [],
    transactions: Array.isArray(input.transactions) ? input.transactions : [],
  };
}

function persistState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindEvents() {
  $("householdForm").addEventListener("submit", saveHousehold);
  $("paycheckForm").addEventListener("submit", (event) =>
    upsertCollection(event, "paychecks", readPaycheckForm)
  );
  $("billForm").addEventListener("submit", (event) =>
    upsertCollection(event, "bills", readBillForm)
  );
  $("savingsForm").addEventListener("submit", (event) =>
    upsertCollection(event, "savingsGoals", readSavingsForm)
  );
  $("transactionForm").addEventListener("submit", (event) =>
    upsertCollection(event, "transactions", readTransactionForm)
  );

  document.querySelectorAll(".form-reset").forEach((button) => {
    button.addEventListener("click", () => resetForm(button.dataset.form));
  });

  $("loadDemoBtn").addEventListener("click", () => {
    state = createDemoState();
    persistState();
    renderAll();
  });

  $("resetBtn").addEventListener("click", () => {
    if (!window.confirm("Supprimer toutes les donnees locales de ce tableau de bord ?")) {
      return;
    }

    state = cloneDefaults();
    persistState();
    renderAll();
  });

  $("exportBtn").addEventListener("click", exportState);
  $("importBtn").addEventListener("click", () => $("importInput").click());
  $("importInput").addEventListener("change", importState);
  document.addEventListener("click", handleTableActions);
}

function saveHousehold(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  state.household = {
    householdName: textValue(formData.get("householdName")) || "Budget du foyer",
    partnerOne: textValue(formData.get("partnerOne")) || "Moi",
    partnerTwo: textValue(formData.get("partnerTwo")) || "Ma conjointe",
    currency: textValue(formData.get("currency")) || "CAD",
    currentBalance: parseAmount(formData.get("currentBalance")),
    projectionMonths: parseInt(formData.get("projectionMonths"), 10) || 6,
    safetyBuffer: parseAmount(formData.get("safetyBuffer")),
  };
  persistState();
  renderAll();
}

function upsertCollection(event, key, reader) {
  event.preventDefault();
  const item = reader(new FormData(event.currentTarget));
  if (!item) {
    return;
  }

  const index = state[key].findIndex((entry) => entry.id === item.id);
  if (index >= 0) {
    state[key][index] = item;
  } else {
    state[key].unshift(item);
  }

  persistState();
  resetForm(event.currentTarget.id);
  renderAll();
}

function resetForm(formId) {
  const form = $(formId);
  if (!form) {
    return;
  }
  form.reset();
  if (form.elements.id) {
    form.elements.id.value = "";
  }
  seedFormDefaults();
}

function readPaycheckForm(formData) {
  const label = textValue(formData.get("label"));
  const amount = parseAmount(formData.get("amount"));
  const nextDate = textValue(formData.get("nextDate"));

  if (!label || !amount || !nextDate) {
    window.alert("Merci de remplir le libelle, le montant et la prochaine date.");
    return null;
  }

  return {
    id: textValue(formData.get("id")) || createId(),
    owner: readOwner(formData),
    label,
    amount,
    frequency: textValue(formData.get("frequency")) || "monthly",
    nextDate,
  };
}

function readBillForm(formData) {
  const label = textValue(formData.get("label"));
  const amount = parseAmount(formData.get("amount"));
  const nextDate = textValue(formData.get("nextDate"));

  if (!label || !amount || !nextDate) {
    window.alert("Merci de remplir le libelle, le montant et la prochaine date.");
    return null;
  }

  return {
    id: textValue(formData.get("id")) || createId(),
    owner: readOwner(formData),
    label,
    category: textValue(formData.get("category")) || "General",
    amount,
    frequency: textValue(formData.get("frequency")) || "monthly",
    nextDate,
  };
}

function readSavingsForm(formData) {
  const label = textValue(formData.get("label"));
  const contributionAmount = parseAmount(formData.get("contributionAmount"));
  const nextDate = textValue(formData.get("nextDate"));

  if (!label) {
    window.alert("Merci de donner un nom a votre objectif d'epargne.");
    return null;
  }

  if (contributionAmount > 0 && !nextDate) {
    window.alert("Ajoutez une prochaine date pour projeter cette contribution.");
    return null;
  }

  return {
    id: textValue(formData.get("id")) || createId(),
    owner: readOwner(formData),
    label,
    targetAmount: parseAmount(formData.get("targetAmount")),
    currentAmount: parseAmount(formData.get("currentAmount")),
    contributionAmount,
    frequency: textValue(formData.get("frequency")) || "monthly",
    nextDate,
  };
}

function readTransactionForm(formData) {
  const label = textValue(formData.get("label"));
  const amount = parseAmount(formData.get("amount"));
  const date = textValue(formData.get("date"));

  if (!label || !amount || !date) {
    window.alert("Merci de remplir la date, le libelle et le montant.");
    return null;
  }

  return {
    id: textValue(formData.get("id")) || createId(),
    owner: readOwner(formData),
    label,
    type: textValue(formData.get("type")) || "expense",
    amount,
    date,
    notes: textValue(formData.get("notes")),
  };
}

function readOwner(formData) {
  return textValue(formData.get("owner")) || state.household.partnerOne || "Moi";
}

function renderAll() {
  populateHouseholdForm();
  renderOwnerSelects();
  seedFormDefaults();
  renderStats();
  renderProjection();
  renderContributors();
  renderTables();
}

function populateHouseholdForm() {
  const form = $("householdForm");
  form.elements.householdName.value = state.household.householdName || "";
  form.elements.partnerOne.value = state.household.partnerOne || "";
  form.elements.partnerTwo.value = state.household.partnerTwo || "";
  form.elements.currency.value = state.household.currency || "CAD";
  form.elements.currentBalance.value = state.household.currentBalance || "";
  form.elements.projectionMonths.value = String(state.household.projectionMonths || 6);
  form.elements.safetyBuffer.value = state.household.safetyBuffer || "";
}

function renderOwnerSelects() {
  const owners = getOwners();

  document.querySelectorAll(".owner-select").forEach((select) => {
    const previous = select.value;
    select.innerHTML = owners
      .map((owner) => `<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`)
      .join("");
    if (owners.includes(previous)) {
      select.value = previous;
    }
  });
}

function seedFormDefaults() {
  const fallbackOwner = state.household.partnerOne || "Moi";
  const today = formatInputDate(new Date());

  document.querySelectorAll(".owner-select").forEach((select) => {
    if (!select.value) {
      select.value = fallbackOwner;
    }
  });

  [
    ["paycheckForm", "nextDate"],
    ["billForm", "nextDate"],
    ["savingsForm", "nextDate"],
    ["transactionForm", "date"],
  ].forEach(([formId, field]) => {
    const form = $(formId);
    if (form && form.elements[field] && !form.elements[field].value) {
      form.elements[field].value = today;
    }
  });

  $("projectionRangeChip").textContent = `${state.household.projectionMonths || 6} mois`;
}

function renderStats() {
  const metrics = computeMetrics();
  const cards = [
    {
      label: "Solde actuel",
      value: formatCurrency(state.household.currentBalance),
      note: "Point de depart du compte.",
      tone: state.household.currentBalance < 0 ? "negative" : "positive",
    },
    {
      label: "Revenus mensuels",
      value: formatCurrency(metrics.monthlyIncome),
      note: "Moyenne de vos paies recurrentes.",
      tone: "positive",
    },
    {
      label: "Factures mensuelles",
      value: formatCurrency(metrics.monthlyBills),
      note: "Sorties fixes estimees.",
      tone: metrics.monthlyBills > 0 ? "negative" : "",
    },
    {
      label: "Epargne mensuelle",
      value: formatCurrency(metrics.monthlySavings),
      note: "Contributions planifiees.",
      tone: "",
    },
    {
      label: "Net mensuel",
      value: formatCurrency(metrics.monthlyNet),
      note: metrics.monthlyNet >= 0 ? "Le budget respire encore." : "La cadence est trop lourde.",
      tone: metrics.monthlyNet >= 0 ? "positive" : "negative",
    },
  ];

  $("statsGrid").innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card fade-in">
          <span>${escapeHtml(card.label)}</span>
          <strong class="${escapeHtml(card.tone)}">${escapeHtml(card.value)}</strong>
          <p>${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");

  $("heroSavings").textContent = formatCurrency(metrics.monthlySavings);
  $("heroBuffer").textContent = state.household.safetyBuffer
    ? formatCurrency(state.household.safetyBuffer)
    : "-";
}

function renderTables() {
  renderTable("paychecksTable", state.paychecks, 6, renderPaycheckRow);
  renderTable("billsTable", state.bills, 7, renderBillRow);
  renderTable("savingsTable", state.savingsGoals, 6, renderSavingsRow);
  renderTable("transactionsTable", state.transactions.slice().sort(sortByDateDesc), 6, renderTransactionRow);
}

function renderTable(targetId, rows, colSpan, renderer) {
  const target = $(targetId);
  if (!rows.length) {
    target.innerHTML = `<tr><td colspan="${colSpan}" class="empty-state">Aucune donnee pour le moment.</td></tr>`;
    return;
  }

  target.innerHTML = rows.map(renderer).join("");
}

function renderPaycheckRow(item) {
  return `
    <tr>
      <td>${escapeHtml(item.owner)}</td>
      <td>${escapeHtml(item.label)}</td>
      <td>${escapeHtml(FREQUENCY_LABELS[item.frequency] || item.frequency)}</td>
      <td class="positive">${escapeHtml(formatCurrency(item.amount))}</td>
      <td>${escapeHtml(formatDate(item.nextDate))}</td>
      <td>${renderActions("paychecks", item.id)}</td>
    </tr>
  `;
}

function renderBillRow(item) {
  return `
    <tr>
      <td>${escapeHtml(item.owner)}</td>
      <td>${escapeHtml(item.label)}</td>
      <td>${escapeHtml(item.category || "-")}</td>
      <td>${escapeHtml(FREQUENCY_LABELS[item.frequency] || item.frequency)}</td>
      <td class="negative">${escapeHtml(formatCurrency(item.amount))}</td>
      <td>${escapeHtml(formatDate(item.nextDate))}</td>
      <td>${renderActions("bills", item.id)}</td>
    </tr>
  `;
}

function renderSavingsRow(item) {
  const currentAmount = item.currentAmount || 0;
  const targetAmount = item.targetAmount || 0;
  const progress = targetAmount ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const contributionLabel = item.contributionAmount
    ? `${formatCurrency(item.contributionAmount)} / ${FREQUENCY_LABELS[item.frequency] || item.frequency}`
    : "Aucune";

  return `
    <tr>
      <td>${escapeHtml(item.owner)}</td>
      <td>${escapeHtml(item.label)}</td>
      <td>
        <div>${escapeHtml(formatCurrency(currentAmount))} / ${escapeHtml(formatCurrency(targetAmount))}</div>
        <div class="progress-track"><div class="progress-fill" style="width: ${progress}%"></div></div>
      </td>
      <td>${escapeHtml(contributionLabel)}</td>
      <td>${escapeHtml(item.nextDate ? formatDate(item.nextDate) : "-")}</td>
      <td>${renderActions("savingsGoals", item.id)}</td>
    </tr>
  `;
}

function renderTransactionRow(item) {
  const amount = transactionDelta(item);
  return `
    <tr>
      <td>${escapeHtml(formatDate(item.date))}</td>
      <td>${escapeHtml(item.owner)}</td>
      <td>${escapeHtml(TYPE_LABELS[item.type] || item.type)}</td>
      <td>${escapeHtml(item.label)}</td>
      <td class="${amount >= 0 ? "positive" : "negative"}">${escapeHtml(formatSignedCurrency(amount))}</td>
      <td>${renderActions("transactions", item.id)}</td>
    </tr>
  `;
}

function renderActions(collection, id) {
  return `
    <div class="table-actions">
      <button class="table-button edit" type="button" data-action="edit" data-collection="${escapeHtml(collection)}" data-id="${escapeHtml(id)}">Modifier</button>
      <button class="table-button delete" type="button" data-action="delete" data-collection="${escapeHtml(collection)}" data-id="${escapeHtml(id)}">Supprimer</button>
    </div>
  `;
}

function handleTableActions(event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const { action, collection, id } = button.dataset;
  if (!action || !collection || !id) {
    return;
  }

  if (action === "delete") {
    state[collection] = state[collection].filter((item) => item.id !== id);
    persistState();
    renderAll();
    return;
  }

  editItem(collection, id);
}

function editItem(collection, id) {
  const item = state[collection].find((entry) => entry.id === id);
  if (!item) {
    return;
  }

  const formIdByCollection = {
    paychecks: "paycheckForm",
    bills: "billForm",
    savingsGoals: "savingsForm",
    transactions: "transactionForm",
  };

  const form = $(formIdByCollection[collection]);
  Object.entries(item).forEach(([key, value]) => {
    if (form.elements[key]) {
      form.elements[key].value = value;
    }
  });
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderProjection() {
  const projection = buildProjection(state.household.projectionMonths || 6);
  const metrics = computeMetrics();
  const futureEvents = projection.events.filter((event) => event.date >= startOfDay(new Date()));
  const lastPoint = getLast(projection.points);
  const lowestPoint = projection.points.reduce((lowest, point) => {
    if (!lowest || point.balance < lowest.balance) {
      return point;
    }
    return lowest;
  }, null);
  const nextIncome = futureEvents.find((event) => event.kind === "income");
  const nextBill = futureEvents.find((event) => event.kind === "bill");

  $("heroProjected").textContent = lastPoint
    ? formatCurrency(lastPoint.balance)
    : formatCurrency(state.household.currentBalance);
  $("heroProjectedCaption").textContent = `A ${state.household.projectionMonths || 6} mois.`;
  $("heroNextIncome").textContent = nextIncome ? formatDate(nextIncome.date) : "Aucune";
  $("heroNextBill").textContent = nextBill ? formatDate(nextBill.date) : "Aucune";
  $("netMonthlyStat").textContent = formatCurrency(metrics.monthlyNet);
  $("netMonthlyCaption").textContent =
    metrics.monthlyNet >= 0 ? "Les recurrents vont dans le bon sens." : "Le rythme doit etre ajuste.";
  $("lowestBalanceStat").textContent = lowestPoint
    ? formatCurrency(lowestPoint.balance)
    : formatCurrency(state.household.currentBalance);
  $("lowestBalanceCaption").textContent = lowestPoint
    ? lowestPoint.balance < 0
      ? `Passage sous zero le ${formatDate(lowestPoint.date)}.`
      : `Creux attendu le ${formatDate(lowestPoint.date)}.`
    : "Aucune alerte pour l'instant.";
  $("projectionSummary").textContent = lastPoint
    ? `De ${formatCurrency(state.household.currentBalance)} a ${formatCurrency(lastPoint.balance)} sur l'horizon choisi.`
    : "Ajoutez des donnees pour lancer une projection.";

  $("upcomingList").innerHTML = futureEvents.length
    ? futureEvents
        .slice(0, 5)
        .map(
          (event) => `
            <li>
              <div>
                <strong>${escapeHtml(event.label)}</strong>
                <small>${escapeHtml(event.owner)} • ${escapeHtml(formatDate(event.date))}</small>
              </div>
              <strong class="${event.delta >= 0 ? "positive" : "negative"}">${escapeHtml(formatSignedCurrency(event.delta))}</strong>
            </li>
          `
        )
        .join("")
    : "<li><div><strong>Aucun mouvement a venir</strong><small>Ajoutez des paies, factures ou virements.</small></div></li>";

  drawProjectionChart(projection.points, state.household.safetyBuffer);
  drawMonthlyChart(projection.monthBuckets);
}

function renderContributors() {
  $("contributorsGrid").innerHTML = computeOwnerMetrics()
    .map(
      (card) => `
        <article class="contributor-card fade-in">
          <span>${escapeHtml(card.owner)}</span>
          <strong class="${card.net >= 0 ? "positive" : "negative"}">${escapeHtml(formatCurrency(card.net))}</strong>
          <p>Net mensuel estime.</p>
          <div class="badge-row">
            <span class="badge">Revenus ${escapeHtml(formatCurrency(card.income))}</span>
            <span class="badge">Factures ${escapeHtml(formatCurrency(card.bills))}</span>
            <span class="badge">Epargne ${escapeHtml(formatCurrency(card.savings))}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function computeMetrics() {
  const monthlyIncome = sumBy(state.paychecks, (item) => monthlyAmount(item.amount, item.frequency));
  const monthlyBills = sumBy(state.bills, (item) => monthlyAmount(item.amount, item.frequency));
  const monthlySavings = sumBy(state.savingsGoals, (item) =>
    monthlyAmount(item.contributionAmount, item.frequency)
  );

  return {
    monthlyIncome,
    monthlyBills,
    monthlySavings,
    monthlyNet: monthlyIncome - monthlyBills - monthlySavings,
  };
}

function computeOwnerMetrics() {
  return getOwners().map((owner) => {
    const income = sumBy(
      state.paychecks.filter((item) => item.owner === owner),
      (item) => monthlyAmount(item.amount, item.frequency)
    );
    const bills = sumBy(
      state.bills.filter((item) => item.owner === owner),
      (item) => monthlyAmount(item.amount, item.frequency)
    );
    const savings = sumBy(
      state.savingsGoals.filter((item) => item.owner === owner),
      (item) => monthlyAmount(item.contributionAmount, item.frequency)
    );
    return { owner, income, bills, savings, net: income - bills - savings };
  });
}

function buildProjection(months) {
  const start = startOfDay(new Date());
  const end = addMonthsClamped(start, months);
  const events = [];

  state.paychecks.forEach((item) => {
    events.push(...expandRecurring(item, "income", item.amount, start, end));
  });
  state.bills.forEach((item) => {
    events.push(...expandRecurring(item, "bill", -item.amount, start, end));
  });
  state.savingsGoals.forEach((item) => {
    if (item.contributionAmount > 0 && item.nextDate) {
      events.push(...expandRecurring(item, "saving", -item.contributionAmount, start, end));
    }
  });
  state.transactions.forEach((item) => {
    const date = parseDate(item.date);
    if (date >= start && date <= end) {
      events.push({
        id: item.id,
        label: item.label,
        owner: item.owner,
        date,
        delta: transactionDelta(item),
        kind: item.type === "expense" ? "bill" : item.type,
      });
    }
  });

  events.sort(compareEvents);

  let runningBalance = state.household.currentBalance || 0;
  const points = [{ date: start, balance: runningBalance }];
  events.forEach((event) => {
    runningBalance += event.delta;
    points.push({ date: event.date, balance: runningBalance });
  });
  if (getLast(points).date < end) {
    points.push({ date: end, balance: runningBalance });
  }

  return {
    events,
    points,
    monthBuckets: buildMonthBuckets(start, end, events),
  };
}

function expandRecurring(item, kind, delta, start, end) {
  let cursor = parseDate(item.nextDate);
  const events = [];
  let guard = 0;
  if (Number.isNaN(cursor.getTime())) {
    return events;
  }

  while (cursor < start && guard < 200) {
    cursor = advanceDate(cursor, item.frequency);
    guard += 1;
  }
  while (cursor <= end && guard < 600) {
    events.push({ id: item.id, label: item.label, owner: item.owner, date: cursor, delta, kind });
    cursor = advanceDate(cursor, item.frequency);
    guard += 1;
  }
  return events;
}

function buildMonthBuckets(start, end, events) {
  const buckets = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const limit = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= limit) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthEvents = events.filter((event) => event.date >= monthStart && event.date <= monthEnd);
    const income = sumBy(
      monthEvents.filter((event) => event.delta > 0),
      (event) => event.delta
    );
    const outflow = Math.abs(
      sumBy(
        monthEvents.filter((event) => event.delta < 0),
        (event) => event.delta
      )
    );
    buckets.push({
      label: monthStart.toLocaleDateString("fr-CA", { month: "short", year: "numeric" }),
      income,
      outflow,
      net: income - outflow,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
}

function compareEvents(a, b) {
  if (a.date.getTime() !== b.date.getTime()) {
    return a.date - b.date;
  }
  const order = { income: 0, saving: 1, bill: 2 };
  return (order[a.kind] || 9) - (order[b.kind] || 9);
}

function drawProjectionChart(points, safetyBuffer) {
  const svg = $("projectionChart");
  if (!points.length) {
    svg.innerHTML = "";
    return;
  }

  const width = 760;
  const height = 340;
  const padding = { top: 24, right: 24, bottom: 38, left: 64 };
  const balances = points.map((point) => point.balance);
  const minBalance = Math.min(...balances, safetyBuffer || 0);
  const maxBalance = Math.max(...balances, safetyBuffer || 0, 1);
  const span = maxBalance - minBalance || 1;
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  const minDate = points[0].date.getTime();
  const maxDate = getLast(points).date.getTime();
  const dateSpan = maxDate - minDate || 1;
  const scaleX = (date) => padding.left + ((date.getTime() - minDate) / dateSpan) * usableWidth;
  const scaleY = (amount) => padding.top + (1 - (amount - minBalance) / span) * usableHeight;

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${scaleX(point.date).toFixed(2)} ${scaleY(point.balance).toFixed(2)}`)
    .join(" ");
  const area = `${path} L ${scaleX(getLast(points).date).toFixed(2)} ${height - padding.bottom} L ${scaleX(points[0].date).toFixed(2)} ${height - padding.bottom} Z`;

  const grid = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const y = padding.top + ratio * usableHeight;
    const value = maxBalance - ratio * span;
    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(19,35,29,0.09)" stroke-width="1" />
      <text x="${padding.left - 10}" y="${y + 4}" fill="#5c6e63" font-size="12" text-anchor="end">${escapeHtml(formatCurrency(value))}</text>
    `;
  }).join("");

  const labels = [points[0], getLast(points)]
    .map(
      (point) => `
        <text x="${scaleX(point.date)}" y="${height - 12}" fill="#5c6e63" font-size="12" text-anchor="middle">${escapeHtml(formatDate(point.date))}</text>
      `
    )
    .join("");

  const safetyLine = safetyBuffer
    ? `
        <line x1="${padding.left}" y1="${scaleY(safetyBuffer)}" x2="${width - padding.right}" y2="${scaleY(safetyBuffer)}" stroke="#d96d30" stroke-width="2" stroke-dasharray="6 6" />
        <text x="${width - padding.right}" y="${scaleY(safetyBuffer) - 8}" fill="#d96d30" font-size="12" text-anchor="end">Coussin cible</text>
      `
    : "";

  svg.innerHTML = `
    <defs>
      <linearGradient id="balanceFill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="rgba(21, 94, 99, 0.35)" />
        <stop offset="100%" stop-color="rgba(21, 94, 99, 0.02)" />
      </linearGradient>
    </defs>
    ${grid}
    ${safetyLine}
    <path d="${area}" fill="url(#balanceFill)" />
    <path d="${path}" fill="none" stroke="#155e63" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    ${points.map((point) => `<circle cx="${scaleX(point.date)}" cy="${scaleY(point.balance)}" r="4.5" fill="#155e63" />`).join("")}
    ${labels}
  `;
}

function drawMonthlyChart(buckets) {
  const svg = $("monthlyChart");
  if (!buckets.length) {
    svg.innerHTML = "";
    return;
  }

  const width = 760;
  const height = 260;
  const padding = { top: 22, right: 18, bottom: 38, left: 46 };
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  const maxValue = buckets.reduce(
    (max, bucket) => Math.max(max, bucket.income, bucket.outflow, Math.abs(bucket.net)),
    1
  );
  const groupWidth = usableWidth / buckets.length;
  const barWidth = Math.min(24, groupWidth / 3);
  const baseline = padding.top + usableHeight;
  const scaleHeight = (value) => (value / maxValue) * usableHeight;

  svg.innerHTML = buckets
    .map((bucket, index) => {
      const center = padding.left + index * groupWidth + groupWidth / 2;
      const incomeHeight = scaleHeight(bucket.income);
      const outflowHeight = scaleHeight(bucket.outflow);
      const netHeight = scaleHeight(Math.abs(bucket.net));
      const netY = baseline - netHeight;
      return `
        <g>
          <line x1="${center}" y1="${padding.top}" x2="${center}" y2="${baseline}" stroke="rgba(19,35,29,0.06)" />
          <rect x="${center - barWidth - 4}" y="${baseline - incomeHeight}" width="${barWidth}" height="${incomeHeight}" rx="6" fill="#155e63" />
          <rect x="${center + 4}" y="${baseline - outflowHeight}" width="${barWidth}" height="${outflowHeight}" rx="6" fill="#d96d30" />
          <rect x="${center - barWidth / 2}" y="${netY}" width="${barWidth}" height="${netHeight}" rx="6" fill="${bucket.net >= 0 ? "#206c4f" : "#b43f28"}" opacity="0.9" />
          <text x="${center}" y="${height - 12}" fill="#5c6e63" font-size="12" text-anchor="middle">${escapeHtml(bucket.label)}</text>
        </g>
      `;
    })
    .join("");
}

function exportState() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "budget-duo-data.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importState(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = sanitizeState(JSON.parse(reader.result));
      persistState();
      renderAll();
    } catch (error) {
      window.alert("Le fichier JSON n'est pas valide.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function monthlyAmount(amount, frequency) {
  if (frequency === "weekly") {
    return (amount * 52) / 12;
  }
  if (frequency === "biweekly") {
    return (amount * 26) / 12;
  }
  return amount || 0;
}

function transactionDelta(transaction) {
  return transaction.type === "income" ? transaction.amount || 0 : -Math.abs(transaction.amount || 0);
}

function parseAmount(value) {
  const normalized = String(value || "").trim().replace(",", ".");
  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseDate(value) {
  if (!value) {
    return new Date("invalid");
  }
  if (value instanceof Date) {
    return startOfDay(value);
  }
  return startOfDay(new Date(`${value}T00:00:00`));
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function advanceDate(date, frequency) {
  const next = new Date(date);
  if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
    return startOfDay(next);
  }
  if (frequency === "biweekly") {
    next.setDate(next.getDate() + 14);
    return startOfDay(next);
  }
  return addMonthsClamped(next, 1);
}

function addMonthsClamped(date, months) {
  const value = new Date(date);
  const day = value.getDate();
  value.setDate(1);
  value.setMonth(value.getMonth() + months);
  const lastDay = new Date(value.getFullYear(), value.getMonth() + 1, 0).getDate();
  value.setDate(Math.min(day, lastDay));
  return startOfDay(value);
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return startOfDay(value);
}

function formatDate(value) {
  const date = parseDate(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" });
}

function formatInputDate(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: state.household.currency || "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatSignedCurrency(value) {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

function textValue(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getOwners() {
  return [
    state.household.partnerOne || "Moi",
    state.household.partnerTwo || "Ma conjointe",
    state.household.householdName || "Budget du foyer",
  ];
}

function sortByDateDesc(a, b) {
  return parseDate(b.date) - parseDate(a.date);
}

function sumBy(items, mapper) {
  return items.reduce((sum, item) => sum + mapper(item), 0);
}

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function createDemoState() {
  return {
    household: {
      householdName: "Budget Simon",
      partnerOne: "Simon",
      partnerTwo: "Ma conjointe",
      currency: "CAD",
      currentBalance: 998,
      projectionMonths: 6,
      safetyBuffer: 1500,
    },
    paychecks: [
      {
        id: createId(),
        owner: "Simon",
        label: "Paie ABB",
        amount: 1988,
        frequency: "biweekly",
        nextDate: "2026-03-25",
      },
    ],
    bills: [
      {
        id: createId(),
        owner: "Simon",
        label: "MNP",
        category: "Finances",
        amount: 400,
        frequency: "biweekly",
        nextDate: "2026-03-26",
      },
    ],
    savingsGoals: [
      {
        id: createId(),
        owner: "Simon",
        label: "Fonds d'urgence",
        targetAmount: 1500,
        currentAmount: 300,
        contributionAmount: 300,
        frequency: "monthly",
        nextDate: "2026-04-09",
      },
    ],
    transactions: [],
  };
}
