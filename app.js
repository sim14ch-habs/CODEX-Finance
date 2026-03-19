const STORAGE_KEY = "budget-duo-v2";
const LOCAL_BACKUP_STORAGE_KEY = "budget-duo-v2-local-backup";
const UNDO_STACK_STORAGE_KEY = "budget-duo-v2-undo-stack";
const ACCOUNT_IDS = {
  partnerOne: "account_partner_one",
  partnerTwo: "account_partner_two",
};
const ACCOUNT_HOLDERS = {
  partnerOne: "partnerOne",
  partnerTwo: "partnerTwo",
  shared: "shared",
};
const ACCOUNT_KIND_LABELS = {
  checking: "Courant",
  savings: "Épargne",
  other: "Autre",
};
const ACCOUNT_STATUS_LABELS = {
  active: "Actif",
  closed: "Fermé",
};
const ACTIVITY_LOG_LIMIT = 60;
const UNDO_STACK_LIMIT = 20;
const COMPACT_TABLE_LIMIT = 5;
const MORTGAGE_PAYMENT_FREQUENCIES = {
  accelerated_weekly: {
    label: "Accélérée à la semaine",
    periodsPerYear: 52,
    mode: "accelerated",
    divisor: 4,
  },
  weekly: {
    label: "Hebdomadaire (à la semaine)",
    periodsPerYear: 52,
    mode: "regular",
  },
  accelerated_biweekly: {
    label: "Accélérée aux deux semaines",
    periodsPerYear: 26,
    mode: "accelerated",
    divisor: 2,
  },
  biweekly: {
    label: "Aux deux semaines",
    periodsPerYear: 26,
    mode: "regular",
  },
  semimonthly: {
    label: "Bi-mensuelle (24x par année)",
    periodsPerYear: 24,
    mode: "regular",
  },
  monthly: {
    label: "Mensuelle (12x par année)",
    periodsPerYear: 12,
    mode: "regular",
  },
};
const MORTGAGE_PREPAYMENT_FREQUENCY_LABELS = {
  once: "Une seule fois",
  yearly: "À chaque année",
  regular: "Même que vos versements",
};
const DEFAULT_MORTGAGE_TOOL = {
  principal: 100000,
  interestRate: 5,
  amortizationYears: 25,
  amortizationMonths: 0,
  paymentFrequency: "monthly",
  termYears: 5,
  prepaymentAmount: 0,
  prepaymentFrequency: "once",
  prepaymentStartPayment: 1,
  propertyTaxAnnual: 0,
  schoolTaxAnnual: 0,
  homeInsuranceMonthly: 0,
  heatingMonthly: 0,
  electricityMonthly: 0,
  waterWasteMonthly: 0,
  condoFeesMonthly: 0,
  internetMonthly: 0,
  maintenanceAnnual: 0,
  otherHousingMonthly: 0,
};

const DEFAULT_STATE = {
  household: {
    householdName: "Budget Simon",
    partnerOne: "Simon",
    partnerTwo: "Geneviève",
    currency: "CAD",
    currentBalance: 1298,
    projectionMonths: 6,
  },
  accounts: [
    {
      id: ACCOUNT_IDS.partnerOne,
      owner: "Simon",
      holder: ACCOUNT_HOLDERS.partnerOne,
      kind: "checking",
      status: "active",
      balance: 998,
    },
    {
      id: ACCOUNT_IDS.partnerTwo,
      owner: "Geneviève",
      holder: ACCOUNT_HOLDERS.partnerTwo,
      kind: "checking",
      status: "active",
      balance: 0,
    },
    {
      id: "account_simon_emergency_fund",
      owner: "Fonds d'urgence",
      holder: ACCOUNT_HOLDERS.partnerOne,
      kind: "savings",
      status: "active",
      balance: 300,
    },
  ],
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
    {
      id: "bill_simon_videotron",
      owner: "Simon",
      label: "Videotron",
      category: "Télécom",
      amount: 180,
      frequency: "monthly",
      nextDate: "2026-03-26",
    },
    {
      id: "bill_simon_loyer",
      owner: "Simon",
      label: "Loyer",
      category: "Logement",
      amount: 863.5,
      frequency: "monthly",
      nextDate: "2026-03-28",
    },
    {
      id: "bill_simon_assurance_vie",
      owner: "Simon",
      label: "Assurance vie",
      category: "Assurances",
      amount: 82.33,
      frequency: "monthly",
      nextDate: "2026-04-01",
    },
    {
      id: "bill_simon_assurance_auto",
      owner: "Simon",
      label: "Assurance auto",
      category: "Auto",
      amount: 99.02,
      frequency: "monthly",
      nextDate: "2026-04-01",
    },
    {
      id: "bill_simon_caa",
      owner: "Simon",
      label: "CAA",
      category: "Auto",
      amount: 8.93,
      frequency: "monthly",
      nextDate: "2026-04-01",
    },
    {
      id: "bill_simon_cellulaire",
      owner: "Simon",
      label: "Cellulaire",
      category: "Télécom",
      amount: 49.66,
      frequency: "monthly",
      nextDate: "2026-04-02",
    },
    {
      id: "bill_simon_saaq",
      owner: "Simon",
      label: "SAAQ permis de conduire",
      category: "Auto",
      amount: 26,
      frequency: "monthly",
      nextDate: "2026-04-02",
    },
    {
      id: "bill_simon_poker",
      owner: "Simon",
      label: "Poker",
      category: "Loisirs",
      amount: 20,
      frequency: "weekly",
      nextDate: "2026-03-23",
      endDate: "2026-04-20",
    },
    {
      id: "bill_simon_quilles",
      owner: "Simon",
      label: "Quilles",
      category: "Loisirs",
      amount: 25,
      frequency: "weekly",
      nextDate: "2026-03-20",
    },
    {
      id: "bill_simon_lastpass",
      owner: "Simon",
      label: "LastPass",
      category: "Abonnements",
      amount: 49,
      frequency: "yearly",
      nextDate: "2026-10-08",
    },
  ],
  savingsGoals: [
    {
      id: "saving_simon_urgence",
      scope: "personal",
      owner: "Fonds d'urgence",
      label: "Fonds d'urgence",
      targetAmount: 1500,
      currentAmount: 300,
      contributionAmount: 300,
      frequency: "monthly",
      nextDate: "2026-04-09",
      targetDate: "2026-09-01",
      sourceOwner: "Simon",
    },
  ],
  sharedExpenses: [],
  transactions: [],
  transfers: [],
  activityLog: [],
  mortgageTool: { ...DEFAULT_MORTGAGE_TOOL },
};

const FREQUENCY_LABELS = {
  weekly: "Hebdomadaire",
  biweekly: "Bihebdomadaire",
  monthly: "Mensuel",
  yearly: "Annuel",
};

const TYPE_LABELS = {
  income: "Revenu",
  expense: "Dépense",
  saving: "Épargne",
};

const COLLECTION_LABELS = {
  paychecks: "paie",
  bills: "facture",
  savingsGoals: "objectif d'épargne",
  sharedExpenses: "dépense partagée",
  transactions: "mouvement",
  transfers: "virement",
  accounts: "compte",
};

const CLOUD_SYNC_DELAY_MS = 500;
const EMBEDDED_SUPABASE_CONFIG = {
  url: "https://rpgplqeabqcdavnvnukj.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ3BscWVhYnFjZGF2bnZudWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzExMDAsImV4cCI6MjA4OTQwNzEwMH0.NLp7fCR_MxmMUha1nzKiYN8MpF88Yo_ofUIOH5bi7_M",
  redirectUrl: "https://sim14ch-habs.github.io/CODEX-Finance/",
};

const cloudState = {
  config: null,
  client: null,
  user: null,
  household: null,
  lastSerializedBudget: "",
  syncTimer: null,
  syncInFlight: false,
  channel: null,
  channelHouseholdId: null,
  status: "local",
  message: "Vos données restent sur cet appareil.",
  detail: "Ajoutez la configuration Supabase pour activer la synchro.",
  lastSyncAt: "",
};

const goalPlannerState = {
  result: null,
};

const projectionUiState = {
  owner: "",
};

const compactTableState = {
  bills: false,
  sharedExpenses: false,
  transactions: false,
};

const calendarUiState = {
  monthCursor: startOfMonth(new Date()),
};

const mobileUiState = {
  section: "overview",
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
  void initCloud();
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
  const household = { ...cloneDefaults().household, ...(input.household || {}) };
  const referencedAccountSeeds = collectReferencedAccountSeeds(input, household);
  let accounts = sanitizeAccounts(input.accounts, household, household.currentBalance, referencedAccountSeeds);
  const savingsAccountSeeds = buildSavingsGoalAccountSeeds(input.savingsGoals || [], household, accounts);
  if (savingsAccountSeeds.length) {
    accounts = sanitizeAccounts([...accounts, ...savingsAccountSeeds], household, household.currentBalance, []);
  }
  return {
    household: {
      ...household,
      currentBalance: getTotalCurrentBalance(accounts),
    },
    accounts,
    paychecks: Array.isArray(input.paychecks)
      ? input.paychecks.map((item) => sanitizeOwnedItem(item, household, accounts))
      : [],
    bills: Array.isArray(input.bills)
      ? input.bills.map((item) => sanitizeOwnedItem(item, household, accounts))
      : [],
    savingsGoals: Array.isArray(input.savingsGoals)
      ? input.savingsGoals.map((item) => sanitizeSavingsGoal(item, household, accounts))
      : [],
    sharedExpenses: Array.isArray(input.sharedExpenses)
      ? input.sharedExpenses.map((item) => sanitizeSharedExpense(item, household, accounts))
      : [],
    transactions: Array.isArray(input.transactions)
      ? input.transactions.map((item) => sanitizeOwnedItem(item, household, accounts))
      : [],
    transfers: Array.isArray(input.transfers)
      ? input.transfers.map((item) => sanitizeTransfer(item, household, accounts))
      : [],
    activityLog: Array.isArray(input.activityLog)
      ? input.activityLog.map(sanitizeActivityLogEntry).filter(Boolean).slice(0, ACTIVITY_LOG_LIMIT)
      : [],
    mortgageTool: sanitizeMortgageTool(input.mortgageTool),
  };
}

function persistState(options = {}) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (!options.skipCloud) {
    scheduleCloudSave();
  }
}

function bindEvents() {
  $("householdForm").addEventListener("submit", saveHousehold);
  $("accountForm").addEventListener("submit", saveAccount);
  $("paycheckForm").addEventListener("submit", (event) =>
    upsertCollection(event, "paychecks", readPaycheckForm)
  );
  $("billForm").addEventListener("submit", (event) =>
    upsertCollection(event, "bills", readBillForm)
  );
  $("mergeSimonBillsBtn").addEventListener("click", mergeStarterBills);
  $("savingsForm").addEventListener("submit", (event) =>
    upsertCollection(event, "savingsGoals", readSavingsForm)
  );
  $("sharedExpenseForm").addEventListener("submit", (event) =>
    upsertCollection(event, "sharedExpenses", readSharedExpenseForm)
  );
  $("transactionForm").addEventListener("submit", (event) =>
    upsertCollection(event, "transactions", readTransactionForm)
  );
  $("transferForm").addEventListener("submit", (event) =>
    upsertCollection(event, "transfers", readTransferForm)
  );
  $("goalPlannerForm").addEventListener("submit", handleGoalPlannerSubmit);
  $("mortgageForm").addEventListener("submit", handleMortgageFormSubmit);
  $("mortgageForm").addEventListener("input", handleMortgageFormInput);
  $("mortgageForm").addEventListener("change", handleMortgageFormInput);
  $("mortgageResetBtn").addEventListener("click", resetMortgageTool);
  $("mortgageExampleBtn").addEventListener("click", loadMortgageAcfcExample);

  document.querySelectorAll(".form-reset").forEach((button) => {
    button.addEventListener("click", () => resetForm(button.dataset.form));
  });

  $("loadDemoBtn").addEventListener("click", () => {
    pushUndoSnapshot("Avant chargement des données de démo");
    state = createDemoState();
    recordActivity(
      "Données de démo chargées",
      "Le budget a été remplacé par la base d'exemple pour tester rapidement l'interface."
    );
    persistState();
    renderAll();
  });

  $("resetBtn").addEventListener("click", () => {
    if (!window.confirm("Supprimer toutes les données locales de ce tableau de bord ?")) {
      return;
    }

    pushUndoSnapshot("Avant réinitialisation du budget");
    state = cloneDefaults();
    recordActivity(
      "Budget réinitialisé",
      "Toutes les données locales ont été remises à l'état de départ sur cet appareil."
    );
    persistState();
    renderAll();
  });

  $("exportBtn").addEventListener("click", exportState);
  $("importBtn").addEventListener("click", () => $("importInput").click());
  $("importInput").addEventListener("change", importState);
  document.addEventListener("click", handleTableActions);
  document.addEventListener("click", handleQuickActionClicks);
  document.addEventListener("click", handleCompactTableToggle);

  $("cloudAuthForm").addEventListener("submit", handleCloudAuthSubmit);
  $("cloudCreateForm").addEventListener("submit", handleCreateHouseholdSubmit);
  $("cloudJoinForm").addEventListener("submit", handleJoinHouseholdSubmit);
  $("cloudPullBtn").addEventListener("click", () => {
    void loadBudgetFromCloud();
  });
  $("cloudPushBtn").addEventListener("click", () => {
    void saveBudgetToCloud(true);
  });
  $("cloudRestoreLocalBtn").addEventListener("click", restoreLocalBackup);
  $("undoLastBtn").addEventListener("click", undoLastLocalChange);
  $("cloudSignOutBtn").addEventListener("click", () => {
    void signOutFromCloud();
  });
  document.querySelectorAll("[data-mobile-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      mobileUiState.section = button.dataset.mobileNav || "overview";
      renderMobileSections();
    });
  });
  window.addEventListener("resize", renderMobileSections);
  $("savingsForm").elements.scope.addEventListener("change", updateSavingsFormOwnership);
  $("savingsForm").elements.owner.addEventListener("change", () => {
    syncSavingsCurrentAmountField();
    syncSavingsSourceOwnerField();
  });
  $("goalPlannerForm").elements.owner.addEventListener("change", syncGoalPlannerCurrentAmountField);
  $("goalPlannerUseBtn").addEventListener("click", applyGoalPlannerToSavings);
  $("projectionOwnerSelect").addEventListener("change", (event) => {
    projectionUiState.owner = normalizeProjectionSelectionValue(event.currentTarget.value || "");
    renderProjection();
  });
  $("calendarPrevBtn").addEventListener("click", () => {
    calendarUiState.monthCursor = addMonthsClamped(calendarUiState.monthCursor, -1);
    renderCalendar();
  });
  $("calendarTodayBtn").addEventListener("click", () => {
    calendarUiState.monthCursor = startOfMonth(new Date());
    renderCalendar();
  });
  $("calendarNextBtn").addEventListener("click", () => {
    calendarUiState.monthCursor = addMonthsClamped(calendarUiState.monthCursor, 1);
    renderCalendar();
  });
  $("transferForm").elements.fromOwner.addEventListener("change", () => syncTransferFormOwners("fromOwner"));
  $("transferForm").elements.toOwner.addEventListener("change", () => syncTransferFormOwners("toOwner"));
}

function saveHousehold(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const previousHousehold = { ...state.household };
  pushUndoSnapshot("Avant mise à jour du foyer");
  const renameRules = [
    {
      id: ACCOUNT_IDS.partnerOne,
      nextOwner: textValue(formData.get("partnerOne")) || "Moi",
      holder: ACCOUNT_HOLDERS.partnerOne,
      previousOwner: state.accounts.find((account) => account.id === ACCOUNT_IDS.partnerOne)?.owner || state.household.partnerOne || "Moi",
    },
    {
      id: ACCOUNT_IDS.partnerTwo,
      nextOwner: textValue(formData.get("partnerTwo")) || "Geneviève",
      holder: ACCOUNT_HOLDERS.partnerTwo,
      previousOwner:
        state.accounts.find((account) => account.id === ACCOUNT_IDS.partnerTwo)?.owner || state.household.partnerTwo || "Geneviève",
    },
  ];
  state.household = {
    householdName: textValue(formData.get("householdName")) || "Budget du foyer",
    partnerOne: textValue(formData.get("partnerOne")) || "Moi",
    partnerTwo: textValue(formData.get("partnerTwo")) || "Geneviève",
    currency: "CAD",
    currentBalance: getTotalCurrentBalance(),
    projectionMonths: parseInt(formData.get("projectionMonths"), 10) || 6,
  };
  const ownerRenames = new Map();

  state.accounts = state.accounts.map((account) => {
    const rule = renameRules.find((entry) => entry.id === account.id);
    if (!rule) {
      return {
        ...account,
        holder: sanitizeAccountHolder(account.holder, state.household, account.id, account.kind, account.owner),
      };
    }

    if (textValue(account.owner) === textValue(rule.previousOwner)) {
      ownerRenames.set(textValue(rule.previousOwner), rule.nextOwner);
      return {
        ...account,
        owner: rule.nextOwner,
        holder: rule.holder,
      };
    }

    return {
      ...account,
      holder: rule.holder,
    };
  });

  const renameOwner = (owner) => ownerRenames.get(textValue(owner)) || owner;

  ["paychecks", "bills", "transactions"].forEach((collection) => {
    state[collection] = state[collection].map((item) => ({ ...item, owner: renameOwner(item.owner) }));
  });
  state.savingsGoals = state.savingsGoals.map((item) => {
    const nextOwner = renameOwner(item.owner);
    const nextAccount = getAccountByOwner(nextOwner, state.accounts);
    return {
      ...item,
      owner: nextOwner,
      sourceOwner: renameOwner(item.sourceOwner),
      scope: isSharedHolder(nextAccount?.holder) || item.scope === "shared" ? "shared" : "personal",
    };
  });
  state.transfers = state.transfers.map((item) => ({
    ...item,
    fromOwner: renameOwner(item.fromOwner),
    toOwner: renameOwner(item.toOwner),
  }));
  state.accounts = sanitizeAccounts(
    state.accounts,
    state.household,
    previousHousehold.currentBalance,
    collectReferencedAccountSeeds(state, state.household)
  );
  syncCurrentBalance();
  recordActivity(
    "Foyer mis à jour",
    `${state.household.householdName} • ${state.household.partnerOne} et ${state.household.partnerTwo} • horizon ${state.household.projectionMonths} mois`
  );
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
  pushUndoSnapshot(
    index >= 0
      ? `Avant modification ${COLLECTION_LABELS[key] || "élément"}`
      : `Avant ajout ${COLLECTION_LABELS[key] || "élément"}`
  );
  if (index >= 0) {
    state[key][index] = item;
  } else {
    state[key].unshift(item);
  }

  recordActivity(
    index >= 0
      ? `${COLLECTION_LABELS[key] || "Entrée"} mise à jour`
      : `${COLLECTION_LABELS[key] || "Entrée"} ajoutée`,
    buildCollectionActivityDetail(key, item)
  );
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
  updateSavingsFormOwnership();
}

function saveAccount(event) {
  event.preventDefault();
  const account = readAccountForm(new FormData(event.currentTarget));
  if (!account) {
    return;
  }

  const index = state.accounts.findIndex((entry) => entry.id === account.id);
  pushUndoSnapshot(index >= 0 ? "Avant modification du compte" : "Avant ajout du compte");
  if (index >= 0) {
    const previous = state.accounts[index];
    state.accounts[index] = {
      ...previous,
      ...account,
      status: previous.status || "active",
    };
  } else {
    state.accounts.unshift(account);
  }

  state.accounts = sanitizeAccounts(
    state.accounts,
    state.household,
    state.household.currentBalance,
    collectReferencedAccountSeeds(state, state.household)
  );
  syncCurrentBalance();
  recordActivity(
    index >= 0 ? "Compte mis à jour" : "Compte ajouté",
    `${account.owner} • ${formatAccountHolder(account.holder)} • ${formatCurrency(account.balance)}`
  );
  persistState();
  resetForm(event.currentTarget.id);
  renderAll();
}

function readAccountForm(formData) {
  const id = textValue(formData.get("id")) || createId();
  const owner = textValue(formData.get("owner"));
  const holder = sanitizeAccountHolder(textValue(formData.get("holder")) || ACCOUNT_HOLDERS.partnerOne, state.household, id);
  const kind = sanitizeAccountKind(textValue(formData.get("kind")) || "checking");
  const balance = parseAmount(formData.get("balance"));
  const existing = state.accounts.find((account) => account.id === id);
  const duplicate = state.accounts.find(
    (account) => account.id !== id && textValue(account.owner).toLowerCase() === owner.toLowerCase()
  );

  if (!owner) {
    window.alert("Ajoute un nom de compte pour pouvoir le retrouver partout dans le budget.");
    return null;
  }

  if (duplicate) {
    window.alert("Un autre compte porte déjà ce nom. Choisis un nom distinct.");
    return null;
  }

  return {
    id,
    owner,
    holder,
    kind,
    status: existing?.status || "active",
    balance,
  };
}

function readPaycheckForm(formData) {
  const label = textValue(formData.get("label"));
  const amount = parseAmount(formData.get("amount"));
  const nextDate = textValue(formData.get("nextDate"));

  if (!label || !amount || !nextDate) {
    window.alert("Merci de remplir le libellé, le montant et la prochaine date.");
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
  const endDate = textValue(formData.get("endDate"));

  if (!label || !amount || !nextDate) {
    window.alert("Merci de remplir le libellé, le montant et la prochaine date.");
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
    endDate,
  };
}

function mergeStarterBills() {
  const owner = getDefaultOwnerForHolder(ACCOUNT_HOLDERS.partnerOne) || state.household.partnerOne || "Simon";
  const starterBills = cloneDefaults().bills.map((item) => ({ ...item, owner }));
  const existingKeys = new Set(state.bills.map((item) => buildOwnedLabelKey(item.owner, item.label)));
  const missingBills = starterBills.filter(
    (item) => !existingKeys.has(buildOwnedLabelKey(item.owner, item.label))
  );

  if (!missingBills.length) {
    window.alert("Les dépenses Simon de départ sont déjà présentes dans ce budget.");
    return;
  }

  pushUndoSnapshot("Avant fusion des dépenses Simon");
  state.bills = [...state.bills, ...missingBills];
  recordActivity(
    "Dépenses Simon ajoutées",
    `${missingBills.length} facture${missingBills.length > 1 ? "s" : ""} ajoutée${missingBills.length > 1 ? "s" : ""} au compte ${owner}.`
  );
  persistState();
  renderAll();
  window.alert(`${missingBills.length} dépenses ont été ajoutées au compte ${owner}.`);
}

function readSavingsForm(formData) {
  const label = textValue(formData.get("label"));
  const contributionAmount = parseAmount(formData.get("contributionAmount"));
  const nextDate = textValue(formData.get("nextDate"));
  const targetDate = textValue(formData.get("targetDate"));
  const scope = readSavingsScope(formData);
  const owner = readOwner(formData, scope === "shared" ? ACCOUNT_HOLDERS.shared : "personal");
  const sourceOwner =
    textValue(formData.get("sourceOwner")) || getDefaultSavingsSourceOwner(owner, state.accounts);
  const ownerAccount = getAccountByOwner(owner);
  const sourceAccount = getAccountByOwner(sourceOwner);

  if (!label) {
    window.alert("Merci de donner un nom à votre objectif d'épargne.");
    return null;
  }

  if (!owner || !ownerAccount || ownerAccount.kind !== "savings") {
    window.alert("Choisissez un compte d'épargne existant pour rattacher cet objectif.");
    return null;
  }

  if (contributionAmount > 0 && (!sourceOwner || !sourceAccount)) {
    window.alert("Choisissez un compte source existant pour financer cette épargne.");
    return null;
  }

  if (sourceOwner && sourceOwner === owner) {
    window.alert("Le compte source doit être différent du compte d'épargne ciblé.");
    return null;
  }

  if (contributionAmount > 0 && !nextDate) {
    window.alert("Ajoutez une prochaine date pour projeter cette contribution.");
    return null;
  }

  return {
    id: textValue(formData.get("id")) || createId(),
    scope,
    owner,
    label,
    targetAmount: parseAmount(formData.get("targetAmount")),
    currentAmount: parseAmount(ownerAccount.balance),
    contributionAmount,
    frequency: textValue(formData.get("frequency")) || "monthly",
    nextDate,
    targetDate,
    sourceOwner,
  };
}

function readSharedExpenseForm(formData) {
  const label = textValue(formData.get("label"));
  const amount = parseAmount(formData.get("amount"));
  const date = textValue(formData.get("date"));
  const paidBy = readOwnerWithFallback(textValue(formData.get("paidBy")), ACCOUNT_HOLDERS.partnerOne);
  const payerAccount = getAccountByOwner(paidBy);
  const payerHolder = payerAccount ? payerAccount.holder : ACCOUNT_HOLDERS.partnerOne;
  const sharePercentRaw = parseAmount(formData.get("sharePercent"));
  const sharePercent = Math.max(0, Math.min(sharePercentRaw || 50, 100));

  if (!label || !amount || !date || !paidBy) {
    window.alert("Merci de remplir la date, le compte payeur, le libellé et le montant.");
    return null;
  }

  return {
    id: textValue(formData.get("id")) || createId(),
    label,
    amount,
    date,
    paidBy,
    payerHolder,
    sharePercent: isSharedHolder(payerHolder) ? 0 : sharePercent,
    notes: textValue(formData.get("notes")),
  };
}

function readTransactionForm(formData) {
  const label = textValue(formData.get("label"));
  const amount = parseAmount(formData.get("amount"));
  const date = textValue(formData.get("date"));

  if (!label || !amount || !date) {
    window.alert("Merci de remplir la date, le libellé et le montant.");
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

function readTransferForm(formData) {
  const amount = parseAmount(formData.get("amount"));
  const date = textValue(formData.get("date"));
  const fromOwner = textValue(formData.get("fromOwner"));
  const toOwner = textValue(formData.get("toOwner"));
  const label = textValue(formData.get("label")) || "Virement";

  if (!amount || !date || !fromOwner || !toOwner) {
    window.alert("Merci de remplir la date, les deux comptes et le montant du virement.");
    return null;
  }

  if (fromOwner === toOwner) {
    window.alert("Le compte source et le compte destination doivent être différents.");
    return null;
  }

  return {
    id: textValue(formData.get("id")) || createId(),
    fromOwner,
    toOwner,
    label,
    amount,
    date,
    notes: textValue(formData.get("notes")),
    settlesDebt: false,
  };
}

function readOwner(formData, fallbackHolder = ACCOUNT_HOLDERS.partnerOne) {
  return readOwnerWithFallback(textValue(formData.get("owner")), fallbackHolder);
}

function readSavingsScope(formData) {
  return textValue(formData.get("scope")) === "shared" ? "shared" : "personal";
}

function getCloudConfig() {
  const rawConfig = window.BUDGET_DUO_SUPABASE || EMBEDDED_SUPABASE_CONFIG;
  const url = textValue(rawConfig.url);
  const anonKey = textValue(rawConfig.anonKey);
  const redirectUrl = textValue(rawConfig.redirectUrl) || `${window.location.origin}${window.location.pathname}`;

  if (!url || !anonKey || !window.supabase || typeof window.supabase.createClient !== "function") {
    return null;
  }

  return { url, anonKey, redirectUrl };
}

function setCloudStatus(status, message, detail) {
  cloudState.status = status;
  cloudState.message = message;
  cloudState.detail = detail;
}

async function initCloud() {
  cloudState.config = getCloudConfig();
  if (!cloudState.config) {
    setCloudStatus(
      "local",
      "Vos données restent sur cet appareil.",
      "Ajoutez la configuration Supabase pour activer la synchro."
    );
    renderAll();
    return;
  }

  try {
    cloudState.client = window.supabase.createClient(cloudState.config.url, cloudState.config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    setCloudStatus(
      "auth",
      "Connexion cloud disponible.",
      "Connectez-vous pour partager le budget avec votre conjointe."
    );
    renderAll();

    const {
      data: { session },
      error,
    } = await cloudState.client.auth.getSession();

    if (error) {
      throw error;
    }

    cloudState.user = session ? session.user : null;
    await refreshCloudContext();

    cloudState.client.auth.onAuthStateChange((_event, sessionUpdate) => {
      window.setTimeout(() => {
        cloudState.user = sessionUpdate ? sessionUpdate.user : null;
        void refreshCloudContext();
      }, 0);
    });
  } catch (error) {
    console.error("Init cloud impossible:", error);
    setCloudStatus(
      "error",
      "Le mode cloud n'a pas pu demarrer.",
      "Verifiez la configuration Supabase et rechargez la page."
    );
    renderAll();
  }
}

async function refreshCloudContext() {
  if (!cloudState.client || !cloudState.config) {
    renderAll();
    return;
  }

  if (!cloudState.user) {
    cloudState.household = null;
    cloudState.lastSerializedBudget = "";
    cloudState.lastSyncAt = "";
    await closeCloudSubscription();
    setCloudStatus(
      "auth",
      "Connectez-vous pour partager votre budget.",
    "Un lien magique sera envoyé par email."
    );
    renderAll();
    return;
  }

  try {
    const household = await fetchMyHousehold();
    cloudState.household = household;

    if (!household) {
      cloudState.lastSerializedBudget = "";
      cloudState.lastSyncAt = "";
      await closeCloudSubscription();
      setCloudStatus(
        "auth",
        `Connecté comme ${cloudState.user.email || "utilisateur"}.`,
        "Créez votre foyer cloud ou rejoignez celui de votre conjointe avec le code d'invitation."
      );
      renderAll();
      return;
    }

    setCloudStatus(
      "syncing",
      `Foyer ${household.household_name} connecté.`,
      "Lecture des données cloud..."
    );
    renderAll();
    await subscribeToBudgetChanges(household.household_id);
    await loadBudgetFromCloud();
  } catch (error) {
    console.error("Lecture cloud impossible:", error);
    setCloudStatus(
      "error",
      "Impossible de lire votre foyer cloud.",
      error.message || "Verifiez les policies et les fonctions SQL Supabase."
    );
    renderAll();
  }
}

async function fetchMyHousehold() {
  const { data, error } = await cloudState.client.rpc("get_my_household");
  if (error) {
    throw error;
  }

  if (Array.isArray(data)) {
    return data[0] || null;
  }

  return data || null;
}

async function handleCloudAuthSubmit(event) {
  event.preventDefault();
  if (!cloudState.client || !cloudState.config) {
    return;
  }

  const email = textValue(new FormData(event.currentTarget).get("email"));
  if (!email) {
    window.alert("Ajoutez votre email pour recevoir le lien magique.");
    return;
  }

  setCloudStatus("syncing", "Envoi du lien magique...", "Verifiez ensuite votre boite email.");
  renderAll();

  const { error } = await cloudState.client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: cloudState.config.redirectUrl,
    },
  });

  if (error) {
    console.error("Connexion email impossible:", error);
    setCloudStatus("error", "Le lien magique n'a pas pu être envoyé.", error.message || "");
    renderAll();
    return;
  }

  setCloudStatus(
    "auth",
    "Lien magique envoyé.",
    `Ouvrez l'email envoyé à ${email} sur votre appareil pour terminer la connexion.`
  );
  renderAll();
}

async function handleCreateHouseholdSubmit(event) {
  event.preventDefault();
  if (!cloudState.client || !cloudState.user) {
    return;
  }

  const formData = new FormData(event.currentTarget);
  const householdName = textValue(formData.get("householdName")) || state.household.householdName || "Budget du foyer";

  setCloudStatus("syncing", "Creation du foyer cloud...", "Import du budget local actuel.");
  renderAll();

  const { error } = await cloudState.client.rpc("create_household", {
    initial_name: householdName,
    initial_budget_state: state,
  });

  if (error) {
    console.error("Creation du foyer impossible:", error);
    setCloudStatus("error", "Le foyer cloud n'a pas pu être créé.", error.message || "");
    renderAll();
    return;
  }

  await refreshCloudContext();
}

async function handleJoinHouseholdSubmit(event) {
  event.preventDefault();
  if (!cloudState.client || !cloudState.user) {
    return;
  }

  const inviteCode = textValue(new FormData(event.currentTarget).get("inviteCode")).toLowerCase();
  if (!inviteCode) {
    window.alert("Ajoutez le code d'invitation reçu.");
    return;
  }

  setCloudStatus("syncing", "Connexion au foyer cloud...", "Import des données partagées en cours.");
  renderAll();

  const { error } = await cloudState.client.rpc("join_household", {
    invite_code_input: inviteCode,
  });

  if (error) {
    console.error("Rejoindre le foyer impossible:", error);
    setCloudStatus("error", "Impossible de rejoindre ce foyer.", error.message || "");
    renderAll();
    return;
  }

  await refreshCloudContext();
}

async function signOutFromCloud() {
  if (!cloudState.client) {
    return;
  }

  await cloudState.client.auth.signOut();
  cloudState.user = null;
  cloudState.household = null;
  cloudState.lastSerializedBudget = "";
  cloudState.lastSyncAt = "";
  await closeCloudSubscription();
  setCloudStatus(
    "auth",
    "Connexion cloud terminee.",
    "Vos données locales restent disponibles sur cet appareil."
  );
  renderAll();
}

async function loadBudgetFromCloud() {
  if (!cloudState.client || !cloudState.household) {
    return;
  }

  const { data, error } = await cloudState.client
    .from("household_budget_state")
    .select("budget_state, updated_at")
    .eq("household_id", cloudState.household.household_id)
    .limit(1);

  if (error) {
    console.error("Chargement budget cloud impossible:", error);
    setCloudStatus("error", "Impossible de lire le budget cloud.", error.message || "");
    renderAll();
    return;
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row || !row.budget_state) {
    await saveBudgetToCloud(true);
    return;
  }

  applyRemoteBudget(row.budget_state, row.updated_at);
}

async function subscribeToBudgetChanges(householdId) {
  if (!cloudState.client || !householdId) {
    return;
  }

  if (cloudState.channel && cloudState.channelHouseholdId === householdId) {
    return;
  }

  await closeCloudSubscription();

  cloudState.channel = cloudState.client
    .channel(`budget-sync-${householdId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "household_budget_state",
        filter: `household_id=eq.${householdId}`,
      },
      (payload) => {
        const nextRecord = payload.new || payload.record;
        if (!nextRecord || !nextRecord.budget_state) {
          return;
        }

        const nextBudget = sanitizeState(nextRecord.budget_state);
        const nextSerialized = JSON.stringify(nextBudget);
        cloudState.lastSyncAt = nextRecord.updated_at || new Date().toISOString();

        if (nextSerialized === cloudState.lastSerializedBudget) {
          renderAll();
          return;
        }

        applyRemoteBudget(nextRecord.budget_state, nextRecord.updated_at);
      }
    )
    .subscribe();

  cloudState.channelHouseholdId = householdId;
}

async function closeCloudSubscription() {
  if (!cloudState.client || !cloudState.channel) {
    cloudState.channel = null;
    cloudState.channelHouseholdId = null;
    return;
  }

  await cloudState.client.removeChannel(cloudState.channel);
  cloudState.channel = null;
  cloudState.channelHouseholdId = null;
}

function scheduleCloudSave() {
  if (!cloudState.client || !cloudState.user || !cloudState.household) {
    return;
  }

  if (cloudState.syncTimer) {
    window.clearTimeout(cloudState.syncTimer);
  }

  cloudState.syncTimer = window.setTimeout(() => {
    void saveBudgetToCloud(false);
  }, CLOUD_SYNC_DELAY_MS);
}

async function saveBudgetToCloud(forceSync) {
  if (!cloudState.client || !cloudState.user || !cloudState.household || cloudState.syncInFlight) {
    return;
  }

  if (cloudState.syncTimer) {
    window.clearTimeout(cloudState.syncTimer);
    cloudState.syncTimer = null;
  }

  const serialized = JSON.stringify(state);
  if (!forceSync && serialized === cloudState.lastSerializedBudget) {
    return;
  }

  cloudState.syncInFlight = true;
  setCloudStatus(
    "syncing",
    `Synchronisation du foyer ${cloudState.household.household_name}...`,
    "Envoi des changements vers le cloud."
  );
  renderAll();

  const { data, error } = await cloudState.client
    .from("household_budget_state")
    .upsert({
      household_id: cloudState.household.household_id,
      budget_state: state,
      updated_at: new Date().toISOString(),
      updated_by: cloudState.user.id,
    })
    .select("budget_state, updated_at")
    .single();

  cloudState.syncInFlight = false;

  if (error) {
    console.error("Sauvegarde cloud impossible:", error);
    setCloudStatus("error", "La sauvegarde cloud a echoue.", error.message || "");
    renderAll();
    return;
  }

  cloudState.lastSerializedBudget = serialized;
  cloudState.lastSyncAt = data.updated_at || new Date().toISOString();
  setCloudStatus(
    "connected",
    `Foyer ${cloudState.household.household_name} synchronisé.`,
    "Les changements sont maintenant partagés avec les autres appareils connectés."
  );
  renderAll();
}

function applyRemoteBudget(nextBudget, updatedAt) {
  const nextState = sanitizeState(nextBudget);
  const nextSerialized = JSON.stringify(nextState);
  const localBackupSaved = saveLocalBackupBeforeCloudOverwrite(nextSerialized);

  state = nextState;
  cloudState.lastSerializedBudget = nextSerialized;
  cloudState.lastSyncAt = updatedAt || new Date().toISOString();
  persistState({ skipCloud: true });
  setCloudStatus(
    "connected",
    `Foyer ${cloudState.household.household_name} synchronisé.`,
    localBackupSaved
      ? "Le budget affiché provient du cloud partagé. Une copie locale de secours a été conservée."
      : "Le budget affiché provient du cloud partagé."
  );
  renderAll();
}

function renderCloudPanel() {
  const configured = Boolean(cloudState.config);
  const connected = Boolean(cloudState.user);
  const linkedHousehold = Boolean(cloudState.household);
  const localBackup = readLocalBackup();
  const badge = $("cloudModeBadge");

  badge.className = "cloud-badge";
  if (cloudState.status === "connected") {
    badge.classList.add("online");
  } else if (cloudState.status === "syncing") {
    badge.classList.add("syncing");
  } else if (cloudState.status === "error") {
    badge.classList.add("error");
  }

  const badgeLabels = {
    local: "Mode local",
    auth: "Cloud prêt",
    syncing: "Synchronisation",
    connected: "Cloud actif",
    error: "Attention",
  };

  badge.textContent = badgeLabels[cloudState.status] || "Mode local";
  $("cloudHeadline").textContent = cloudState.message;
  $("cloudDescription").textContent = cloudState.detail;
  $("cloudSummaryText").textContent = configured
    ? "Le budget peut être partagé et synchronisé entre vos appareils."
    : "Activez Supabase pour partager le budget entre vos appareils en temps réel.";
  $("cloudFootnote").textContent = cloudState.lastSyncAt
    ? `Dernière synchro: ${formatCloudDateTime(cloudState.lastSyncAt)}`
    : "Le budget local reste disponible même sans cloud.";

  $("cloudConfigBox").hidden = configured;
  $("cloudAuthForm").hidden = !configured || connected;
  $("cloudHouseholdBox").hidden = !configured || !connected || linkedHousehold;
  $("cloudConnectedBox").hidden = !configured || !connected || !linkedHousehold;
  $("cloudRecoveryBox").hidden = !configured;

  if ($("cloudHouseholdNameInput") && !$("cloudHouseholdNameInput").value) {
    $("cloudHouseholdNameInput").value = state.household.householdName || "Budget du foyer";
  }

  if (configured && connected) {
    $("cloudUserEmail").textContent = cloudState.user.email || "Connecté";
  }

  if (configured && linkedHousehold) {
    $("cloudHouseholdName").textContent = cloudState.household.household_name;
    $("cloudInviteCode").textContent = cloudState.household.invite_code;
  }

  $("cloudBackupInfo").textContent = localBackup
    ? `Dernière copie locale: ${formatCloudDateTime(localBackup.savedAt)}.${localBackup.reason ? ` ${localBackup.reason}` : ""}`
    : "Aucune copie locale de secours enregistrée pour le moment.";
  $("cloudRestoreLocalBtn").disabled = !localBackup;
}

function renderSyncGlance() {
  const badge = $("syncGlanceBadge");
  const title = $("syncGlanceTitle");
  const detail = $("syncGlanceDetail");
  if (!badge || !title || !detail) {
    return;
  }

  const localSerialized = JSON.stringify(state);
  const linkedHousehold = Boolean(cloudState.user && cloudState.household);
  const hasPendingChanges =
    linkedHousehold &&
    !cloudState.syncInFlight &&
    Boolean(cloudState.lastSerializedBudget) &&
    localSerialized !== cloudState.lastSerializedBudget;

  badge.className = "cloud-badge";
  if (cloudState.status === "connected" && !hasPendingChanges) {
    badge.classList.add("online");
  } else if (cloudState.status === "error") {
    badge.classList.add("error");
  } else if (cloudState.syncInFlight || hasPendingChanges || cloudState.status === "syncing") {
    badge.classList.add("syncing");
  }

  if (!cloudState.config) {
    badge.textContent = "Mode local";
    title.textContent = "Budget local uniquement";
    detail.textContent = "Cette copie reste sur cet appareil tant qu'elle n'est pas reliée au cloud.";
    return;
  }

  if (!cloudState.user || !cloudState.household) {
    badge.textContent = "Cloud prêt";
    title.textContent = "Connexion cloud disponible";
    detail.textContent = "Connectez-vous et rejoignez le foyer pour voir les changements sur tous vos appareils.";
    return;
  }

  if (cloudState.syncInFlight) {
    badge.textContent = "Envoi cloud";
    title.textContent = "Synchronisation en cours";
    detail.textContent = "Les dernières modifications sont en train d'être envoyées au foyer partagé.";
    return;
  }

  if (hasPendingChanges) {
    badge.textContent = "Local à envoyer";
    title.textContent = "Des changements attendent le cloud";
    detail.textContent = "Cette page a des modifs locales plus récentes que la dernière synchro enregistrée.";
    return;
  }

  badge.textContent = "Cloud à jour";
  title.textContent = "Budget partagé synchronisé";
  detail.textContent = cloudState.lastSyncAt
    ? `Dernière synchro ${formatCloudDateTime(cloudState.lastSyncAt)}.`
    : "Le budget cloud est actif.";
}

function renderActivityLog() {
  const target = $("activityLogList");
  const note = $("cloudSyncStatusNote");
  const undoButton = $("undoLastBtn");
  if (!target || !note || !undoButton) {
    return;
  }

  const undoAvailable = getUndoAvailability();
  undoButton.disabled = !undoAvailable;

  const linkedHousehold = Boolean(cloudState.user && cloudState.household);
  const hasPendingChanges =
    linkedHousehold &&
    Boolean(cloudState.lastSerializedBudget) &&
    JSON.stringify(state) !== cloudState.lastSerializedBudget;
  note.textContent = linkedHousehold
    ? hasPendingChanges
      ? "Cette version locale a des changements qui n'ont pas encore été confirmés dans le cloud."
      : cloudState.lastSyncAt
        ? `Cloud à jour au ${formatCloudDateTime(cloudState.lastSyncAt)}.`
        : "Cloud connecté."
    : "Le journal garde une trace simple des imports, changements et synchronisations utiles.";

  const entries = (state.activityLog || []).slice(0, 10);
  target.innerHTML = entries.length
    ? entries
        .map(
          (entry) => `
            <article class="activity-entry ${escapeHtml(entry.tone)}">
              <div class="activity-entry-head">
                <strong>${escapeHtml(entry.title)}</strong>
                <span>${escapeHtml(formatCloudDateTime(entry.createdAt))}</span>
              </div>
              <p>${escapeHtml(entry.detail || "Aucun détail supplémentaire.")}</p>
            </article>
          `
        )
        .join("")
    : `<article class="empty-state">Le journal apparaîtra ici dès qu'une action importante sera faite.</article>`;
}

function formatCloudDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("fr-CA", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function saveLocalBackupBeforeCloudOverwrite(nextSerialized) {
  const currentSerialized = JSON.stringify(state);
  if (currentSerialized === nextSerialized) {
    return false;
  }
  if (cloudState.lastSerializedBudget && currentSerialized === cloudState.lastSerializedBudget) {
    return false;
  }

  writeLocalBackup({
    savedAt: new Date().toISOString(),
    reason: "Copie enregistrée juste avant un rechargement depuis le cloud.",
    budgetState: state,
  });
  return true;
}

function writeLocalBackup(snapshot) {
  try {
    window.localStorage.setItem(LOCAL_BACKUP_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.error("Sauvegarde locale de secours impossible:", error);
  }
}

function readLocalBackup() {
  try {
    const raw = window.localStorage.getItem(LOCAL_BACKUP_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const snapshot = JSON.parse(raw);
    if (!snapshot || !snapshot.budgetState) {
      return null;
    }
    return snapshot;
  } catch (error) {
    console.error("Lecture de la sauvegarde locale impossible:", error);
    return null;
  }
}

function restoreLocalBackup() {
  const snapshot = readLocalBackup();
  if (!snapshot || !snapshot.budgetState) {
    window.alert("Aucune copie locale de secours n'est disponible sur cet appareil.");
    return;
  }

  pushUndoSnapshot("Avant restauration locale");
  state = sanitizeState(snapshot.budgetState);
  recordActivity(
    "Copie locale restaurée",
    "La dernière copie locale a été réappliquée sur cet appareil. Vérifie-la puis envoie-la au cloud si nécessaire."
  );
  persistState({ skipCloud: true });
  setCloudStatus(
    cloudState.household ? "connected" : "local",
    cloudState.household
      ? `Copie locale restaurée pour ${cloudState.household.household_name}.`
      : "Copie locale restaurée sur cet appareil.",
    "La version locale a été restaurée sans écraser le cloud. Vérifie-la puis utilise Envoyer mon budget local si nécessaire."
  );
  renderAll();
}

function readUndoStack() {
  try {
    const raw = window.localStorage.getItem(UNDO_STACK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Lecture de la pile d'annulation impossible:", error);
    return [];
  }
}

function writeUndoStack(stack) {
  try {
    window.localStorage.setItem(UNDO_STACK_STORAGE_KEY, JSON.stringify(stack.slice(0, UNDO_STACK_LIMIT)));
  } catch (error) {
    console.error("Écriture de la pile d'annulation impossible:", error);
  }
}

function pushUndoSnapshot(label) {
  const stack = readUndoStack();
  stack.unshift({
    id: createId(),
    label: textValue(label) || "Modification",
    savedAt: new Date().toISOString(),
    budgetState: cloneStateSnapshot(state),
  });
  writeUndoStack(stack);
}

function getUndoAvailability() {
  return readUndoStack().length > 0;
}

function undoLastLocalChange() {
  const stack = readUndoStack();
  const snapshot = stack.shift();
  if (!snapshot || !snapshot.budgetState) {
    window.alert("Aucune modification locale à annuler pour le moment.");
    return;
  }

  writeUndoStack(stack);
  state = sanitizeState(snapshot.budgetState);
  recordActivity(
    "Annulation locale",
    `Retour à l'état sauvegardé le ${formatCloudDateTime(snapshot.savedAt)} (${snapshot.label}).`
  );
  persistState();
  renderAll();
}

function cloneStateSnapshot(sourceState) {
  return JSON.parse(JSON.stringify(sourceState));
}

function recordActivity(title, detail, options = {}) {
  const entry = sanitizeActivityLogEntry({
    id: createId(),
    title,
    detail,
    createdAt: new Date().toISOString(),
    tone: options.tone || "neutral",
  });
  if (!entry) {
    return;
  }

  state.activityLog = [entry, ...(state.activityLog || [])].slice(0, ACTIVITY_LOG_LIMIT);
}

function getCollectionItemLabel(key, item) {
  return textValue(item.label || item.owner || item.paidBy || item.fromOwner || "Sans libellé");
}

function getCollectionItemOwnerLabel(key, item) {
  if (key === "sharedExpenses") {
    return item.paidBy;
  }
  if (key === "transfers") {
    return `${formatOwnerLabel(item.fromOwner)} -> ${formatOwnerLabel(item.toOwner)}`;
  }
  return item.owner;
}

function getCollectionItemAmount(key, item) {
  if (key === "savingsGoals") {
    return parseAmount(item.contributionAmount) || parseAmount(item.targetAmount);
  }
  if (key === "transactions") {
    return Math.abs(transactionDelta(item));
  }
  return parseAmount(item.amount);
}

function buildCollectionActivityDetail(key, item) {
  const ownerLabel = getCollectionItemOwnerLabel(key, item);
  const amount = getCollectionItemAmount(key, item);
  const bits = [getCollectionItemLabel(key, item)];
  if (ownerLabel) {
    bits.push(ownerLabel);
  }
  if (amount) {
    bits.push(formatCurrency(amount));
  }
  if (item.date) {
    bits.push(formatDate(item.date));
  } else if (item.nextDate) {
    bits.push(formatDate(item.nextDate));
  }
  return bits.join(" • ");
}

function renderAll() {
  populateHouseholdForm();
  renderBalanceLabels();
  renderAccountHolderOptions();
  renderOwnerSelects();
  renderProjectionOwnerOptions();
  seedFormDefaults();
  updateSavingsFormOwnership();
  renderGoalPlannerOwnerOptions();
  renderCloudPanel();
  renderSyncGlance();
  renderActivityLog();
  renderGoalPlanner();
  renderStats();
  renderAlerts();
  renderProjection();
  renderCalendar();
  renderMortgageTool();
  renderContributors();
  renderSharedDebtCards();
  renderAccountsTable();
  renderTables();
  renderMobileSections();
}

function populateHouseholdForm() {
  const form = $("householdForm");
  form.elements.householdName.value = state.household.householdName || "";
  form.elements.partnerOne.value = state.household.partnerOne || "";
  form.elements.partnerTwo.value = state.household.partnerTwo || "";
  form.elements.projectionMonths.value = String(state.household.projectionMonths || 6);
}

function renderOwnerSelects() {
  document.querySelectorAll(".owner-select").forEach((select) => {
    const previous = select.value;
    if (select.id === "savingsOwnerSelect" || select.name === "owner" && select.form && select.form.id === "goalPlannerForm") {
      return;
    }
    renderSelectOptions(select, getOwnerOptions(), previous);
  });
}

function renderProjectionOwnerOptions() {
  const select = $("projectionOwnerSelect");
  if (!select) {
    return;
  }

  const options = getProjectionSelectionOptions();
  const fallbackOwner =
    options.find((option) => option.value === `holder:${ACCOUNT_HOLDERS.partnerOne}`)?.value ||
    (options[0] || {}).value ||
    "";
  const normalizedPreference = normalizeProjectionSelectionValue(projectionUiState.owner);
  const preferred = options.some((option) => option.value === normalizedPreference)
    ? normalizedPreference
    : fallbackOwner;

  renderSelectOptions(select, options, preferred);
  projectionUiState.owner = normalizeProjectionSelectionValue(select.value || "");
  select.disabled = !options.length;
}

function renderAccountHolderOptions() {
  const select = $("accountHolderSelect");
  if (!select) {
    return;
  }

  renderSelectOptions(
    select,
    [
      { value: ACCOUNT_HOLDERS.partnerOne, label: state.household.partnerOne || "Moi" },
      { value: ACCOUNT_HOLDERS.partnerTwo, label: state.household.partnerTwo || "Geneviève" },
      { value: ACCOUNT_HOLDERS.shared, label: "Commun" },
    ],
    select.value
  );
}

function seedFormDefaults() {
  const fallbackOwner = getDefaultOwnerForHolder(ACCOUNT_HOLDERS.partnerOne) || getFirstActiveOwner() || "";
  const today = formatInputDate(new Date());

  document.querySelectorAll(".owner-select").forEach((select) => {
    if (!select.value && !select.disabled) {
      select.value = fallbackOwner;
    }
  });

  [
    ["paycheckForm", "nextDate"],
    ["billForm", "nextDate"],
    ["savingsForm", "nextDate"],
    ["sharedExpenseForm", "date"],
    ["transactionForm", "date"],
    ["transferForm", "date"],
    ["goalPlannerForm", "startDate"],
  ].forEach(([formId, field]) => {
    const form = $(formId);
    if (form && form.elements[field] && !form.elements[field].value) {
      form.elements[field].value = today;
    }
  });

  const plannerForm = $("goalPlannerForm");
  if (plannerForm && plannerForm.elements.targetDate && !plannerForm.elements.targetDate.value) {
    plannerForm.elements.targetDate.value = formatInputDate(addMonthsClamped(new Date(), 6));
  }

  const accountForm = $("accountForm");
  if (accountForm) {
    if (!accountForm.elements.holder.value) {
      accountForm.elements.holder.value = ACCOUNT_HOLDERS.partnerOne;
    }
    if (!accountForm.elements.kind.value) {
      accountForm.elements.kind.value = "checking";
    }
  }

  syncTransferFormOwners();
  $("projectionRangeChip").textContent = `${state.household.projectionMonths || 6} mois`;
}

function renderBalanceLabels() {
  const activeCount = getActiveAccounts().length;
  $("householdBalanceSummary").textContent = `Total actuel: ${formatCurrency(getTotalCurrentBalance())} • ${activeCount} compte${activeCount > 1 ? "s" : ""} actif${activeCount > 1 ? "s" : ""}`;
}

function renderMobileSections() {
  const nav = $("mobileSectionNav");
  if (!nav) {
    return;
  }

  const isMobile = window.innerWidth <= 760;
  nav.hidden = !isMobile;

  document.querySelectorAll("[data-mobile-section]").forEach((section) => {
    section.hidden = isMobile ? section.dataset.mobileSection !== mobileUiState.section : false;
  });

  document.querySelectorAll("[data-mobile-nav]").forEach((button) => {
    const active = button.dataset.mobileNav === mobileUiState.section;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function syncTransferFormOwners(changedField = "") {
  const form = $("transferForm");
  if (!form) {
    return;
  }

  const fromField = form.elements.fromOwner;
  const toField = form.elements.toOwner;
  if (!fromField || !toField) {
    return;
  }

  if (!fromField.value) {
    fromField.value = getDefaultOwnerForHolder(ACCOUNT_HOLDERS.partnerOne) || getFirstActiveOwner() || "";
  }

  if (!toField.value) {
    toField.value = getDefaultOwnerForHolder(ACCOUNT_HOLDERS.shared) || getAlternativeOwner(fromField.value) || "";
  }

  if (fromField.value !== toField.value) {
    return;
  }

  const alternatives = getOwnerOptions()
    .map((option) => option.value)
    .filter((value) => value !== fromField.value);
  const fallback = alternatives[0] || "";

  if (changedField === "toOwner") {
    fromField.value = fallback || fromField.value;
    return;
  }

  toField.value = fallback || toField.value;
}

function getSavingsGoalOwnerOptions(scope, options = {}) {
  const includeClosed = options.includeClosed === true;
  const accounts = (includeClosed ? state.accounts : getActiveAccounts()).filter((account) => {
    if (account.kind !== "savings") {
      return false;
    }
    if (scope === "shared") {
      return isSharedHolder(account.holder);
    }
    if (scope === "personal") {
      return !isSharedHolder(account.holder);
    }
    return true;
  });

  return accounts.map((account) => ({
    value: account.owner,
    label: account.owner,
  }));
}

function getSavingsSourceOwnerOptions(targetOwner, accounts = state.accounts, options = {}) {
  const includeClosed = options.includeClosed === true;
  const targetAccount = getAccountByOwner(targetOwner, accounts);
  const candidates = (accounts || [])
    .filter((account) => {
      if (!includeClosed && account.status === "closed") {
        return false;
      }
      return account.owner !== targetOwner;
    })
    .slice()
    .sort((left, right) => {
      const leftHolderMatch = targetAccount && left.holder === targetAccount.holder ? 0 : 1;
      const rightHolderMatch = targetAccount && right.holder === targetAccount.holder ? 0 : 1;
      if (leftHolderMatch !== rightHolderMatch) {
        return leftHolderMatch - rightHolderMatch;
      }

      const kindRank = (account) => {
        if (account.kind === "checking") {
          return 0;
        }
        if (account.kind === "other") {
          return 1;
        }
        return 2;
      };
      if (kindRank(left) !== kindRank(right)) {
        return kindRank(left) - kindRank(right);
      }
      return left.owner.localeCompare(right.owner, "fr-CA");
    });

  return candidates.map((account) => ({
    value: account.owner,
    label: `${account.owner} • ${formatAccountHolder(account.holder)} • ${
      ACCOUNT_KIND_LABELS[account.kind] || account.kind
    }`,
  }));
}

function getDefaultSavingsSourceOwner(targetOwner, accounts = state.accounts, options = {}) {
  const preferredOwner = textValue(options.preferredOwner);
  const choices = getSavingsSourceOwnerOptions(targetOwner, accounts, options);
  if (preferredOwner && choices.some((choice) => choice.value === preferredOwner)) {
    return preferredOwner;
  }
  return (choices[0] || {}).value || "";
}

function syncSavingsCurrentAmountField() {
  const form = $("savingsForm");
  if (!form || !form.elements.currentAmount) {
    return;
  }

  const account = getAccountByOwner(form.elements.owner.value);
  if (account && account.kind === "savings") {
    form.elements.currentAmount.value = String(account.balance || 0);
    form.elements.currentAmount.readOnly = true;
    return;
  }

  form.elements.currentAmount.readOnly = false;
}

function syncSavingsSourceOwnerField() {
  const form = $("savingsForm");
  if (!form || !form.elements.sourceOwner) {
    return;
  }

  const sourceField = form.elements.sourceOwner;
  const hint = $("savingsSourceHint");
  const targetOwner = textValue(form.elements.owner?.value);
  const currentSource = textValue(sourceField.value);
  const options = getSavingsSourceOwnerOptions(targetOwner);
  const preferredSource = getDefaultSavingsSourceOwner(targetOwner, state.accounts, {
    preferredOwner: currentSource,
  });

  renderSelectOptions(sourceField, options, preferredSource);
  sourceField.disabled = !options.length;

  if (hint) {
    hint.textContent = options.length
      ? "Choisissez le compte d'où part l'argent avant d'être placé dans cette épargne."
      : "Ajoutez d'abord un autre compte actif pour financer cette épargne.";
  }
}

function syncGoalPlannerCurrentAmountField() {
  const form = $("goalPlannerForm");
  if (!form || !form.elements.currentAmount) {
    return;
  }

  const account = getAccountByOwner(form.elements.owner.value);
  if (account && account.kind === "savings") {
    form.elements.currentAmount.value = String(account.balance || 0);
    form.elements.currentAmount.readOnly = true;
    return;
  }

  form.elements.currentAmount.readOnly = false;
}

function renderGoalPlannerOwnerOptions() {
  const form = $("goalPlannerForm");
  if (!form || !form.elements.owner) {
    return;
  }

  renderSelectOptions(form.elements.owner, getSavingsGoalOwnerOptions(""), form.elements.owner.value);
  syncGoalPlannerCurrentAmountField();
}

function updateSavingsFormOwnership() {
  const form = $("savingsForm");
  if (!form) {
    return;
  }

  const scopeField = form.elements.scope;
  const ownerField = form.elements.owner;
  const hint = $("savingsScopeHint");
  const scope = scopeField && scopeField.value === "shared" ? "shared" : "personal";
  const previousOwner = ownerField ? ownerField.value : "";

  if (!ownerField) {
    return;
  }

  if (scope === "shared") {
    renderSelectOptions(ownerField, getSavingsGoalOwnerOptions("shared"), previousOwner);
    ownerField.disabled = false;
    if (hint) {
      hint.textContent = ownerField.options.length
        ? "Choisissez le compte d'épargne commun qui porte cet objectif."
        : "Créez d'abord un compte commun de type épargne pour lui rattacher un objectif.";
    }
    syncSavingsCurrentAmountField();
    syncSavingsSourceOwnerField();
    return;
  }

  renderSelectOptions(ownerField, getSavingsGoalOwnerOptions("personal"), previousOwner);
  ownerField.disabled = false;

  if (!ownerField.value) {
    ownerField.value = (getSavingsGoalOwnerOptions("personal")[0] || {}).value || "";
  }

  if (hint) {
    hint.textContent = ownerField.options.length
      ? "Choisissez le compte d'épargne personnel qui porte cet objectif."
      : "Créez d'abord un compte personnel de type épargne pour lui rattacher un objectif.";
  }
  syncSavingsCurrentAmountField();
  syncSavingsSourceOwnerField();
}

function handleGoalPlannerSubmit(event) {
  event.preventDefault();
  const result = buildGoalPlannerResult(new FormData(event.currentTarget));
  if (!result) {
    return;
  }

  goalPlannerState.result = result;
  renderGoalPlanner();
}

function renderGoalPlanner() {
  const result = goalPlannerState.result;
  const useButton = $("goalPlannerUseBtn");

  if (!result) {
    $("goalPlannerHeadline").textContent = "À calculer";
    $("goalPlannerSummary").textContent =
      "Remplissez le but, l'échéance et la fréquence pour voir l'effort à fournir.";
    $("goalPlannerRemaining").textContent = "-";
    $("goalPlannerPeriods").textContent = "-";
    $("goalPlannerMonthly").textContent = "-";
    $("goalPlannerBreakdown").textContent =
      "Le calcul pourra ensuite pré-remplir un objectif d'épargne.";
    $("goalPlannerStatus").textContent = "Nouveau";
    $("goalPlannerStatus").className = "status-chip neutral";
    useButton.disabled = true;
    return;
  }

  const frequencyLabel = FREQUENCY_LABELS[result.frequency] || result.frequency;
  $("goalPlannerHeadline").textContent =
    result.remainingAmount > 0
      ? `${formatCurrency(result.contributionAmount)} / ${frequencyLabel.toLowerCase()}`
      : "Objectif déjà financé";
  $("goalPlannerSummary").textContent =
    result.remainingAmount > 0
      ? `${result.periods} ${result.periods > 1 ? "versements" : "versement"} du ${formatDate(result.startDate)} au ${formatDate(result.targetDate)}.`
      : `${result.label} atteint déjà la cible indiquée avec le montant actuel.`;
  $("goalPlannerRemaining").textContent = formatCurrency(result.remainingAmount);
  $("goalPlannerPeriods").textContent = String(result.periods);
  $("goalPlannerMonthly").textContent = formatCurrency(result.monthlyEquivalent);
  $("goalPlannerStatus").textContent = result.planStatus.label;
  $("goalPlannerStatus").className = `status-chip ${result.planStatus.tone}`;
  $("goalPlannerBreakdown").textContent =
    result.remainingAmount > 0
      ? `${result.planInsight} Recommandé: ${formatCurrency(result.contributionAmount)} / ${frequencyLabel.toLowerCase()}.`
      : `Tu peux quand même réutiliser ce but pour garder une trace dans la section épargne.`;
  useButton.disabled = false;
}

function applyGoalPlannerToSavings() {
  if (!goalPlannerState.result) {
    return;
  }

  const result = goalPlannerState.result;
  const form = $("savingsForm");
  form.elements.id.value = result.matchedGoal ? result.matchedGoal.id : "";
  form.elements.scope.value = isSharedOwner(result.owner) ? "shared" : "personal";
  form.elements.owner.value = result.owner;
  form.elements.label.value = result.label;
  form.elements.targetAmount.value = String(result.targetAmount);
  form.elements.currentAmount.value = String(result.currentAmount);
  form.elements.contributionAmount.value = String(result.contributionAmount);
  form.elements.frequency.value = result.frequency;
  form.elements.nextDate.value = result.startDate;
  form.elements.targetDate.value = result.targetDate;
  if (form.elements.sourceOwner) {
    form.elements.sourceOwner.value =
      textValue(result.matchedGoal?.sourceOwner) || getDefaultSavingsSourceOwner(result.owner, state.accounts);
  }
  updateSavingsFormOwnership();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderAlerts() {
  const alerts = collectAlerts();
  const target = $("alertsGrid");
  if (!target) {
    return;
  }

  if (!alerts.length) {
    target.innerHTML = `
      <article class="alert-card positive fade-in">
        <span class="status-chip success">Stable</span>
        <strong>Aucune alerte importante</strong>
        <p>Les comptes et les objectifs n'affichent pas de signal critique pour l'instant.</p>
      </article>
    `;
    return;
  }

  target.innerHTML = alerts
    .map(
      (alert) => `
        <article class="alert-card ${escapeHtml(alert.tone)} fade-in">
          <span class="status-chip ${escapeHtml(alert.tone)}">${escapeHtml(alert.label)}</span>
          <strong>${escapeHtml(alert.title)}</strong>
          <p>${escapeHtml(alert.message)}</p>
        </article>
      `
    )
    .join("");
}

function collectAlerts() {
  const alerts = [];
  const projection = buildProjection(state.household.projectionMonths || 6);
  const lowestCombined = projection.points.reduce((lowest, point) => {
    if (!lowest || point.balance < lowest.balance) {
      return point;
    }
    return lowest;
  }, null);

  if (lowestCombined && lowestCombined.balance < 0) {
    alerts.push({
      tone: "critical",
      label: "Critique",
      title: "Le total passe sous zéro",
      message: `Le total projeté tomberait à ${formatCurrency(lowestCombined.balance)} le ${formatDate(lowestCombined.date)}.`,
    });
  }

  getActiveAccounts().forEach((account) => {
    const owner = account.owner;
    const accountProjection = buildProjection(state.household.projectionMonths || 6, owner);
    const lowestPoint = accountProjection.points.reduce((lowest, point) => {
      if (!lowest || point.balance < lowest.balance) {
        return point;
      }
      return lowest;
    }, null);
    if (lowestPoint && lowestPoint.balance < 0) {
      alerts.push({
        tone: "critical",
        label: "Compte",
        title: `${formatOwnerLabel(owner)} passerait sous zéro`,
        message: `${formatOwnerLabel(owner)} atteindrait ${formatCurrency(lowestPoint.balance)} le ${formatDate(lowestPoint.date)}.`,
      });
    }
  });

  state.savingsGoals.forEach((goal) => {
    const plan = evaluateGoalPlan(goal);
    if (!goal.targetDate || !plan) {
      return;
    }
    if (plan.contributionGap > 0) {
      alerts.push({
        tone: "warning",
        label: "But",
        title: `${goal.label} demande un effort plus fort`,
        message: `Il manque ${formatCurrency(plan.contributionGap)} par ${FREQUENCY_LABELS[goal.frequency].toLowerCase()} pour tenir l'échéance du ${formatDate(goal.targetDate)}.`,
      });
      return;
    }
    if (plan.projectedFinishDate && parseDate(plan.projectedFinishDate) > parseDate(goal.targetDate)) {
      alerts.push({
        tone: "warning",
        label: "But",
        title: `${goal.label} finirait trop tard`,
        message: `Au rythme actuel, la cible serait atteinte vers ${formatDate(plan.projectedFinishDate)} au lieu du ${formatDate(goal.targetDate)}.`,
      });
    }
  });

  const debtSummary = computeSharedDebtSummary();
  if (Math.abs(debtSummary.net) >= 250) {
    alerts.push({
      tone: Math.abs(debtSummary.net) >= 750 ? "warning" : "neutral",
      label: "Partage",
      title:
        debtSummary.net > 0
          ? `${state.household.partnerOne || "Moi"} doit ${formatCurrency(debtSummary.net)}`
          : `${state.household.partnerTwo || "Geneviève"} doit ${formatCurrency(Math.abs(debtSummary.net))}`,
      message: "Les dépenses partagées commencent à peser. Un virement de règlement pourrait clarifier les soldes.",
    });
  }

  return alerts.slice(0, 6);
}

function renderStats() {
  const metrics = computeMetrics();
  const totalBalance = getTotalCurrentBalance();
  const sharedAccounts = getAccountsByHolder(ACCOUNT_HOLDERS.shared);
  const sharedBalance = sumBy(sharedAccounts, (account) => account.balance || 0);
  const alerts = collectAlerts();
  const debtSummary = computeSharedDebtSummary();
  const cards = [
    {
      label: "Solde total",
      value: formatCurrency(totalBalance),
      note: "Addition de tous les comptes actuels.",
      tone: totalBalance < 0 ? "negative" : "positive",
    },
    {
      label: "Comptes communs",
      value: formatCurrency(sharedBalance),
      note: `${sharedAccounts.length} compte${sharedAccounts.length > 1 ? "s" : ""} commun${sharedAccounts.length > 1 ? "s" : ""} actif${sharedAccounts.length > 1 ? "s" : ""}.`,
      tone: sharedBalance < 0 ? "negative" : "",
    },
    {
      label: "Revenus mensuels",
      value: formatCurrency(metrics.monthlyIncome),
      note: "Moyenne de vos paies récurrentes.",
      tone: "positive",
    },
    {
      label: "Factures mensuelles",
      value: formatCurrency(metrics.monthlyBills),
      note: "Sorties fixes estimées.",
      tone: metrics.monthlyBills > 0 ? "negative" : "",
    },
    {
      label: "Épargne mensuelle",
      value: formatCurrency(metrics.monthlySavings),
      note: `Perso ${formatCurrency(metrics.monthlyPersonalSavings)} • Commune ${formatCurrency(metrics.monthlySharedSavings)}.`,
      tone: "",
    },
    {
      label: "Net mensuel",
      value: formatCurrency(metrics.monthlyNet),
      note: metrics.monthlyNet >= 0 ? "Le budget respire encore." : "La cadence est trop lourde.",
      tone: metrics.monthlyNet >= 0 ? "positive" : "negative",
    },
    {
      label: "Alertes actives",
      value: String(alerts.length),
      note: alerts.length ? "Points à surveiller sur vos comptes et objectifs." : "Aucun signal bloquant pour l'instant.",
      tone: alerts.length ? "negative" : "positive",
    },
    {
      label: "Solde net entre vous",
      value: formatCurrency(Math.abs(debtSummary.net)),
      note:
        debtSummary.net > 0
          ? `${state.household.partnerOne || "Moi"} doit ${state.household.partnerTwo || "Geneviève"}.`
          : debtSummary.net < 0
            ? `${state.household.partnerTwo || "Geneviève"} doit ${state.household.partnerOne || "Moi"}.`
            : "Aucune dette interne en cours.",
      tone: debtSummary.net === 0 ? "positive" : "",
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
}

function renderTables() {
  renderTable("paychecksTable", state.paychecks, 6, renderPaycheckRow);
  renderCompactTable({
    key: "bills",
    rows: state.bills,
    targetId: "billsTable",
    colSpan: 7,
    renderer: renderBillRow,
    toolsId: "billsTableTools",
    summaryId: "billsTableSummary",
    toggleId: "billsTableToggle",
    emptySummary: "Aucune facture récurrente pour le moment.",
    collapsedSummary: (visible, total) => `${visible} facture${visible > 1 ? "s" : ""} sur ${total} affichée${visible > 1 ? "s" : ""}.`,
    expandedSummary: (total) => `${total} facture${total > 1 ? "s" : ""} récurrente${total > 1 ? "s" : ""} affichée${total > 1 ? "s" : ""}.`,
    expandLabel: "Voir toutes les factures",
    collapseLabel: "Réduire la liste",
  });
  renderTable("savingsTable", state.savingsGoals, 7, renderSavingsRow);
  renderCompactTable({
    key: "sharedExpenses",
    rows: state.sharedExpenses.slice().sort(sortByDateDesc),
    targetId: "sharedExpensesTable",
    colSpan: 7,
    renderer: renderSharedExpenseRow,
    toolsId: "sharedExpensesTableTools",
    summaryId: "sharedExpensesTableSummary",
    toggleId: "sharedExpensesTableToggle",
    emptySummary: "Aucune dépense partagée pour le moment.",
    collapsedSummary: (visible, total) => `${visible} dépense${visible > 1 ? "s" : ""} partagée${visible > 1 ? "s" : ""} sur ${total} affichée${visible > 1 ? "s" : ""}.`,
    expandedSummary: (total) => `${total} dépense${total > 1 ? "s" : ""} partagée${total > 1 ? "s" : ""} affichée${total > 1 ? "s" : ""}.`,
    expandLabel: "Voir toutes les dépenses partagées",
    collapseLabel: "Réduire la liste",
  });
  renderTable("transfersTable", state.transfers.slice().sort(sortByDateDesc), 6, renderTransferRow);
  renderCompactTable({
    key: "transactions",
    rows: state.transactions.slice().sort(sortByDateDesc),
    targetId: "transactionsTable",
    colSpan: 6,
    renderer: renderTransactionRow,
    toolsId: "transactionsTableTools",
    summaryId: "transactionsTableSummary",
    toggleId: "transactionsTableToggle",
    emptySummary: "Aucun mouvement unique pour le moment.",
    collapsedSummary: (visible, total) => `${visible} mouvement${visible > 1 ? "s" : ""} sur ${total} affiché${visible > 1 ? "s" : ""}.`,
    expandedSummary: (total) => `${total} mouvement${total > 1 ? "s" : ""} unique${total > 1 ? "s" : ""} affiché${total > 1 ? "s" : ""}.`,
    expandLabel: "Voir tous les mouvements",
    collapseLabel: "Réduire la liste",
  });
}

function renderAccountsTable() {
  const rows = state.accounts
    .slice()
    .sort((left, right) => {
      if ((left.status === "closed") !== (right.status === "closed")) {
        return left.status === "closed" ? 1 : -1;
      }
      return textValue(left.owner).localeCompare(textValue(right.owner), "fr-CA");
    });

  renderTable("accountsTable", rows, 6, renderAccountRow);
}

function renderTable(targetId, rows, colSpan, renderer) {
  const target = $(targetId);
  if (!rows.length) {
    target.innerHTML = `<tr><td colspan="${colSpan}" class="empty-state">Aucune donnée pour le moment.</td></tr>`;
    return;
  }

  target.innerHTML = rows.map(renderer).join("");
}

function renderCompactTable(config) {
  const rows = Array.isArray(config.rows) ? config.rows : [];
  const target = $(config.targetId);
  const tools = $(config.toolsId);
  const summary = $(config.summaryId);
  const toggle = $(config.toggleId);
  if (!target) {
    return;
  }

  const expanded = Boolean(compactTableState[config.key]);
  const hasOverflow = rows.length > COMPACT_TABLE_LIMIT;
  const visibleRows = expanded || !hasOverflow ? rows : rows.slice(0, COMPACT_TABLE_LIMIT);
  renderTable(config.targetId, visibleRows, config.colSpan, config.renderer);

  if (!tools || !summary || !toggle) {
    return;
  }

  tools.hidden = false;
  if (!rows.length) {
    summary.textContent = config.emptySummary || "Aucune donnée pour le moment.";
    toggle.hidden = true;
    return;
  }

  if (!hasOverflow) {
    summary.textContent = config.expandedSummary ? config.expandedSummary(rows.length) : `${rows.length} élément(s).`;
    toggle.hidden = true;
    return;
  }

  summary.textContent = expanded
    ? config.expandedSummary(rows.length)
    : config.collapsedSummary(visibleRows.length, rows.length);
  toggle.hidden = false;
  toggle.textContent = expanded ? config.collapseLabel : config.expandLabel;
  toggle.dataset.compactTable = config.key;
}

function renderAccountRow(account) {
  const statusTone = account.status === "closed" ? "neutral" : "success";
  const kindLabel = ACCOUNT_KIND_LABELS[account.kind] || account.kind;
  const holderLabel = formatAccountHolder(account.holder);
  return `
    <tr>
      <td>
        <div>${escapeHtml(account.owner)}</div>
      </td>
      <td>${escapeHtml(holderLabel)}</td>
      <td>${escapeHtml(kindLabel)}</td>
      <td><span class="status-chip ${statusTone}">${escapeHtml(ACCOUNT_STATUS_LABELS[account.status] || account.status)}</span></td>
      <td class="${account.balance < 0 ? "negative" : "positive"}">${escapeHtml(formatCurrency(account.balance || 0))}</td>
      <td>${renderAccountActions(account)}</td>
    </tr>
  `;
}

function renderPaycheckRow(item) {
  return `
    <tr>
      <td>${escapeHtml(formatOwnerLabel(item.owner))}</td>
      <td>${escapeHtml(item.label)}</td>
      <td>${escapeHtml(FREQUENCY_LABELS[item.frequency] || item.frequency)}</td>
      <td class="positive">${escapeHtml(formatCurrency(item.amount))}</td>
      <td>${escapeHtml(formatDate(item.nextDate))}</td>
      <td>${renderActions("paychecks", item.id)}</td>
    </tr>
  `;
}

function renderBillRow(item) {
  const scheduleLabel = item.endDate ? `Jusqu'au ${formatDate(item.endDate)}` : "";
  return `
    <tr>
      <td>${escapeHtml(formatOwnerLabel(item.owner))}</td>
      <td>${escapeHtml(item.label)}</td>
      <td>${escapeHtml(item.category || "-")}</td>
      <td>${escapeHtml(FREQUENCY_LABELS[item.frequency] || item.frequency)}</td>
      <td class="negative">${escapeHtml(formatCurrency(item.amount))}</td>
      <td>
        <div>${escapeHtml(formatDate(item.nextDate))}</div>
        ${scheduleLabel ? `<small>${escapeHtml(scheduleLabel)}</small>` : ""}
      </td>
      <td>${renderActions("bills", item.id)}</td>
    </tr>
  `;
}

function renderSavingsRow(item) {
  const currentAmount = getSavingsGoalCurrentAmount(item);
  const targetAmount = item.targetAmount || 0;
  const progress = targetAmount ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const sourceOwner = resolveSavingsGoalSourceOwner(item);
  const contributionLabel = item.contributionAmount
    ? `${formatCurrency(item.contributionAmount)} / ${FREQUENCY_LABELS[item.frequency] || item.frequency}`
    : "Aucune";
  const contributionDetail = sourceOwner
    ? `Depuis ${formatOwnerLabel(sourceOwner)}`
    : "Sans compte source";
  const scopeLabel = item.scope === "shared" ? "Commune" : "Personnelle";
  const scopeClass = item.scope === "shared" ? "shared" : "personal";
  const scheduleLabel = item.targetDate
    ? `Échéance ${formatDate(item.targetDate)}`
    : "Sans échéance";

  return `
    <tr>
      <td><span class="scope-pill ${escapeHtml(scopeClass)}">${escapeHtml(scopeLabel)}</span></td>
      <td>${escapeHtml(formatOwnerLabel(item.owner))}</td>
      <td>${escapeHtml(item.label)}</td>
      <td>
        <div>${escapeHtml(formatCurrency(currentAmount))} / ${escapeHtml(formatCurrency(targetAmount))}</div>
        <div class="progress-track"><div class="progress-fill" style="width: ${progress}%"></div></div>
      </td>
      <td>
        <div>${escapeHtml(contributionLabel)}</div>
        <small>${escapeHtml(contributionDetail)}</small>
      </td>
      <td>
        <div>${escapeHtml(item.nextDate ? formatDate(item.nextDate) : "-")}</div>
        <small>${escapeHtml(scheduleLabel)}</small>
      </td>
      <td>${renderActions("savingsGoals", item.id)}</td>
    </tr>
  `;
}

function renderTransactionRow(item) {
  const amount = transactionDelta(item);
  return `
    <tr>
      <td>${escapeHtml(formatDate(item.date))}</td>
      <td>${escapeHtml(formatOwnerLabel(item.owner))}</td>
      <td>${escapeHtml(TYPE_LABELS[item.type] || item.type)}</td>
      <td>${escapeHtml(item.label)}</td>
      <td class="${amount >= 0 ? "positive" : "negative"}">${escapeHtml(formatSignedCurrency(amount))}</td>
      <td>${renderActions("transactions", item.id)}</td>
    </tr>
  `;
}

function renderTransferRow(item) {
  return `
    <tr>
      <td>${escapeHtml(formatDate(item.date))}</td>
      <td>${escapeHtml(formatOwnerLabel(item.fromOwner))}</td>
      <td>${escapeHtml(formatOwnerLabel(item.toOwner))}</td>
      <td>${escapeHtml(item.label)}</td>
      <td>${escapeHtml(formatCurrency(item.amount))}</td>
      <td>${renderActions("transfers", item.id)}</td>
    </tr>
  `;
}

function renderSharedExpenseRow(item) {
  const debt = calculateSharedExpenseDebt(item);
  const shareLabel = isSharedHolder(item.payerHolder)
    ? "Compte commun"
    : `${Math.round(parseAmount(item.sharePercent))} % remboursé`;
  const debtLabel = debt
    ? `${debt.fromOwner} -> ${debt.toOwner}`
    : "Aucune dette";
  const debtAmount = debt ? formatCurrency(debt.amount) : "-";

  return `
    <tr>
      <td>${escapeHtml(formatDate(item.date))}</td>
      <td>${escapeHtml(formatOwnerLabel(item.paidBy))}</td>
      <td>${escapeHtml(shareLabel)}</td>
      <td>${escapeHtml(item.label)}</td>
      <td class="negative">${escapeHtml(formatCurrency(item.amount))}</td>
      <td>
        <div>${escapeHtml(debtLabel)}</div>
        <small>${escapeHtml(debtAmount)}</small>
      </td>
      <td>${renderActions("sharedExpenses", item.id)}</td>
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

function handleCompactTableToggle(event) {
  const button = event.target.closest("[data-compact-table]");
  if (!button) {
    return;
  }

  const key = button.dataset.compactTable;
  if (!Object.prototype.hasOwnProperty.call(compactTableState, key)) {
    return;
  }

  compactTableState[key] = !compactTableState[key];
  renderTables();
}

function renderAccountActions(account) {
  const toggleLabel = account.status === "closed" ? "Rouvrir" : "Fermer";
  return `
    <div class="table-actions">
      <button class="table-button edit" type="button" data-action="edit" data-collection="accounts" data-id="${escapeHtml(account.id)}">Modifier</button>
      <button class="table-button delete" type="button" data-action="toggle-status" data-collection="accounts" data-id="${escapeHtml(account.id)}">${escapeHtml(toggleLabel)}</button>
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

  if (collection === "accounts" && action === "toggle-status") {
    toggleAccountStatus(id);
    return;
  }

  if (action === "delete") {
    const deletedItem = state[collection].find((item) => item.id === id);
    pushUndoSnapshot(`Avant suppression ${COLLECTION_LABELS[collection] || "élément"}`);
    state[collection] = state[collection].filter((item) => item.id !== id);
    if (deletedItem) {
      recordActivity(
        `${COLLECTION_LABELS[collection] || "Entrée"} supprimée`,
        buildCollectionActivityDetail(collection, deletedItem),
        { tone: "warning" }
      );
    }
    persistState();
    renderAll();
    return;
  }

  editItem(collection, id);
}

function handleQuickActionClicks(event) {
  const button = event.target.closest("[data-quick-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.quickAction;
  const owner = button.dataset.owner || "";
  if (!action || !owner) {
    return;
  }

  if (action === "bill") {
    resetForm("billForm");
    $("billForm").elements.owner.value = owner;
    focusForm("billForm", "label", "entries");
    return;
  }

  if (action === "transfer") {
    resetForm("transferForm");
    $("transferForm").elements.fromOwner.value = owner;
    syncTransferFormOwners("fromOwner");
    focusForm("transferForm", "amount", "entries");
    return;
  }

  if (action === "saving") {
    const account = getAccountByOwner(owner);
    if (!account || account.kind !== "savings") {
      resetForm("accountForm");
      $("accountForm").elements.holder.value = account ? account.holder : ACCOUNT_HOLDERS.partnerOne;
      $("accountForm").elements.kind.value = "savings";
      focusForm("accountForm", "owner", "accounts");
      return;
    }

    resetForm("savingsForm");
    $("savingsForm").elements.scope.value = isSharedOwner(owner) ? "shared" : "personal";
    updateSavingsFormOwnership();
    $("savingsForm").elements.owner.value = owner;
    syncSavingsCurrentAmountField();
    syncSavingsSourceOwnerField();
    focusForm("savingsForm", "label", "planning");
    return;
  }

  if (action === "sharedExpense") {
    resetForm("sharedExpenseForm");
    $("sharedExpenseForm").elements.paidBy.value = owner;
    focusForm("sharedExpenseForm", "label", "entries");
  }
}

function focusForm(formId, fieldName, mobileSection) {
  const form = $(formId);
  if (!form) {
    return;
  }

  if (mobileSection) {
    mobileUiState.section = mobileSection;
    renderMobileSections();
  }
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  if (fieldName && form.elements[fieldName]) {
    form.elements[fieldName].focus();
  }
}

function editItem(collection, id) {
  const item = state[collection].find((entry) => entry.id === id);
  if (!item) {
    return;
  }

  const formIdByCollection = {
    accounts: "accountForm",
    paychecks: "paycheckForm",
    bills: "billForm",
    savingsGoals: "savingsForm",
    sharedExpenses: "sharedExpenseForm",
    transfers: "transferForm",
    transactions: "transactionForm",
  };

  const form = $(formIdByCollection[collection]);
  if (!form) {
    return;
  }
  Object.entries(item).forEach(([key, value]) => {
    if (form.elements[key]) {
      form.elements[key].value = value;
    }
  });
  if (collection === "accounts") {
    renderAccountHolderOptions();
  }
  if (collection === "savingsGoals") {
    updateSavingsFormOwnership();
  }
  if (collection === "transfers") {
    syncTransferFormOwners();
  }
  if (collection === "sharedExpenses" && form.elements.paidBy) {
    form.elements.paidBy.value = item.paidBy;
  }
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function toggleAccountStatus(id) {
  const index = state.accounts.findIndex((account) => account.id === id);
  if (index < 0) {
    return;
  }

  const account = state.accounts[index];
  if (account.status === "closed") {
  pushUndoSnapshot("Avant réouverture du compte");
    state.accounts[index] = { ...account, status: "active" };
    recordActivity("Compte rouvert", `${account.owner} est de nouveau disponible dans les formulaires et projections.`);
    persistState();
    renderAll();
    return;
  }

  if (Math.abs(account.balance || 0) > 0.009) {
    window.alert("Un compte doit être à zéro avant d'être fermé.");
    return;
  }

  if (hasPlannedActivityForAccount(account.owner)) {
    window.alert("Ce compte a encore des entrées planifiées. Déplace ou termine-les avant de le fermer.");
    return;
  }

  pushUndoSnapshot("Avant fermeture du compte");
  state.accounts[index] = { ...account, status: "closed" };
  recordActivity("Compte fermé", `${account.owner} a été retiré des sélections actives.`);
  persistState();
  renderAll();
}

function renderProjection() {
  const months = state.household.projectionMonths || 6;
  const projectionSelection = normalizeProjectionSelectionValue(
    projectionUiState.owner || $("projectionOwnerSelect")?.value || ""
  );
  const selectionMetrics = projectionSelection
    ? computeProjectionMetrics(projectionSelection)
    : { income: 0, bills: 0, savings: 0, net: 0 };
  const currentBalance = projectionSelection ? getProjectionSelectionCurrentBalance(projectionSelection) : 0;
  const projection = projectionSelection ? buildProjection(months, projectionSelection) : { events: [], points: [] };
  const futureEvents = projection.events.filter((event) => event.date >= startOfDay(new Date()));
  const lastPoint = getLast(projection.points);
  const lowestPoint = projection.points.reduce((lowest, point) => {
    if (!lowest || point.balance < lowest.balance) {
      return point;
    }
    return lowest;
  }, null);
  const nextIncome = futureEvents.find((event) => event.kind === "income");
  const nextBillSummary = getNextBillSummary(futureEvents);
  const selectionLabel = projectionSelection ? getProjectionSelectionLabel(projectionSelection) : "Aucune vue";

  $("projectionRangeChip").textContent = `${months} mois`;
  $("heroProjectionAccount").textContent = projectionSelection ? selectionLabel : "-";
  $("heroProjectionAccountCaption").textContent = projectionSelection
    ? formatProjectionSelectionCaption(projectionSelection)
    : "Choisis un compte ou un regroupement pour projeter son évolution.";

  $("heroProjected").textContent = lastPoint
    ? formatCurrency(lastPoint.balance)
    : formatCurrency(currentBalance);
  $("heroProjectedCaption").textContent = projectionSelection
    ? `${selectionLabel} • ${months} mois.`
    : "Choisis une vue pour lancer une projection.";
  $("heroNextIncome").textContent = nextIncome ? formatDate(nextIncome.date) : "Aucune";
  $("heroNextBill").textContent = nextBillSummary ? formatDaysUntilLabel(nextBillSummary.daysAway) : "Aucune";
  $("heroNextBillCaption").textContent = nextBillSummary
    ? `${formatDate(nextBillSummary.date)} • ${nextBillSummary.count} facture${nextBillSummary.count > 1 ? "s" : ""} • ${formatCurrency(nextBillSummary.totalAmount)}`
    : "Aucune facture récurrente à venir.";
  $("heroSavings").textContent = formatCurrency(selectionMetrics.savings);
  $("netMonthlyStat").textContent = formatCurrency(selectionMetrics.net);
  $("netMonthlyCaption").textContent =
    projectionSelection
      ? selectionMetrics.net >= 0
        ? `${selectionLabel} garde un rythme positif.`
        : `${selectionLabel} demande des ajustements.`
      : "Choisis une vue pour voir son rythme mensuel.";
  $("lowestBalanceStat").textContent = lowestPoint
    ? formatCurrency(lowestPoint.balance)
    : formatCurrency(currentBalance);
  $("lowestBalanceCaption").textContent = lowestPoint
    ? lowestPoint.balance < 0
      ? `Passage sous zéro le ${formatDate(lowestPoint.date)}.`
      : `Creux attendu le ${formatDate(lowestPoint.date)}.`
    : projectionSelection
      ? "Aucune alerte pour l'instant."
      : "Choisis une vue pour afficher son point bas.";
  $("projectionSummary").textContent = lastPoint
    ? `${selectionLabel} : de ${formatCurrency(currentBalance)} à ${formatCurrency(lastPoint.balance)} sur l'horizon choisi.`
    : "Ajoutez des données pour lancer une projection.";

  $("upcomingList").innerHTML = futureEvents.length
    ? futureEvents
        .slice(0, 5)
        .map(
          (event) => `
            <li>
              <div>
                <strong>${escapeHtml(event.label)}</strong>
        <small>${escapeHtml(formatOwnerLabel(event.owner))} • ${escapeHtml(formatDate(event.date))}</small>
              </div>
              <strong class="${event.delta >= 0 ? "positive" : "negative"}">${escapeHtml(formatSignedCurrency(event.delta))}</strong>
            </li>
          `
        )
        .join("")
    : `<li><div><strong>Aucun mouvement à venir</strong><small>${escapeHtml(
        projectionSelection
          ? `Ajoute des paies, factures ou virements sur ${selectionLabel}.`
          : "Choisis une vue pour voir ses mouvements."
      )}</small></div></li>`;

  drawProjectionChart(projection.points);
}

function formatProjectionSelectionCaption(selection) {
  const parsed = parseProjectionSelection(selection);
  if (!parsed) {
    return "Vue introuvable.";
  }
  if (parsed.type === "account") {
    const account = getAccountByOwner(parsed.owner);
    if (!account) {
      return "Compte introuvable.";
    }
    return `${ACCOUNT_KIND_LABELS[account.kind] || account.kind} • ${formatAccountHolder(account.holder)}`;
  }

  const accounts = getProjectionSelectionAccounts(selection);
  const holderLabel = formatAccountHolder(parsed.holder);
  return `${accounts.length} compte${accounts.length > 1 ? "s" : ""} • ${holderLabel}`;
}

function renderCalendar() {
  const grid = $("calendarGrid");
  const label = $("calendarMonthLabel");
  const summaryTarget = $("calendarSummaryCards");
  const weekTotalsTarget = $("calendarWeekTotals");
  if (!grid || !label || !summaryTarget || !weekTotalsTarget) {
    return;
  }

  const monthStart = startOfMonth(calendarUiState.monthCursor || new Date());
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfCalendarGrid(monthStart);
  const events = collectCalendarEvents(monthStart, monthEnd);
  const eventsByDate = new Map();

  events.forEach((event) => {
    const key = formatInputDate(event.date);
    if (!eventsByDate.has(key)) {
      eventsByDate.set(key, []);
    }
    eventsByDate.get(key).push(event);
  });

  label.textContent = monthStart.toLocaleDateString("fr-CA", { month: "long", year: "numeric" });

  const days = [];
  const weekTotals = [];
  let cursor = gridStart;
  for (let index = 0; index < 42; index += 1) {
    const key = formatInputDate(cursor);
    const dayEvents = eventsByDate.get(key) || [];
    const extraCount = Math.max(dayEvents.length - 3, 0);
    const dayTotal = sumBy(dayEvents, getCalendarDayDelta);
    const showDayTotal = dayEvents.some((event) => event.kind !== "transfer");
    const dayTotalTone = dayTotal > 0 ? "positive" : dayTotal < 0 ? "negative" : "neutral";
    days.push(`
      <article class="calendar-day${sameCalendarMonth(cursor, monthStart) ? "" : " is-muted"}${isSameDay(cursor, new Date()) ? " is-today" : ""}">
        <div class="calendar-day-head">
          <span>${escapeHtml(String(cursor.getDate()))}</span>
        </div>
        <div class="calendar-day-events">
          ${dayEvents.slice(0, 3).map(renderCalendarEvent).join("")}
          ${extraCount ? `<p class="calendar-more">+ ${extraCount} autre${extraCount > 1 ? "s" : ""}</p>` : ""}
        </div>
        ${showDayTotal ? `<p class="calendar-day-total ${dayTotalTone}">Total du jour ${escapeHtml(formatSignedCurrency(dayTotal))}</p>` : ""}
      </article>
    `);
    if ((index + 1) % 7 === 0) {
      const weekStart = addDays(cursor, -6);
      const weekEvents = [];
      for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
        const dayKey = formatInputDate(addDays(weekStart, dayOffset));
        weekEvents.push(...(eventsByDate.get(dayKey) || []));
      }
      weekTotals.push({
        start: weekStart,
        end: cursor,
        net: roundCurrency(sumBy(weekEvents, getCalendarDayDelta)),
      });
    }
    cursor = addDays(cursor, 1);
  }

  grid.innerHTML = days.join("");
  const monthlyIncome = roundCurrency(sumBy(events.filter((event) => (event.delta || 0) > 0), (event) => event.delta || 0));
  const monthlyOutflows = roundCurrency(
    Math.abs(sumBy(events.filter((event) => (event.delta || 0) < 0), (event) => event.delta || 0))
  );
  const monthlyNet = roundCurrency(sumBy(events, getCalendarDayDelta));
  const sharedCount = state.sharedExpenses.filter((item) => {
    const date = parseDate(item.date);
    return date >= monthStart && date <= monthEnd;
  }).length;
  summaryTarget.innerHTML = [
    { label: "Entrées du mois", value: formatCurrency(monthlyIncome) },
    { label: "Sorties du mois", value: formatCurrency(monthlyOutflows) },
    { label: "Net du mois", value: monthlyNet >= 0 ? formatSignedCurrency(monthlyNet) : formatSignedCurrency(monthlyNet) },
    { label: "Partagées visibles", value: `${sharedCount}` },
  ]
    .map(
      (card) => `
        <article class="calendar-summary-card">
          <span>${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(String(card.value))}</strong>
        </article>
      `
    )
    .join("");
  weekTotalsTarget.innerHTML = weekTotals
    .map(
      (week, index) => `
        <article class="calendar-week-card">
          <span>Semaine ${index + 1}</span>
          <strong class="${week.net < 0 ? "negative" : week.net > 0 ? "positive" : ""}">${escapeHtml(formatSignedCurrency(week.net))}</strong>
          <p>${escapeHtml(formatDate(week.start))} au ${escapeHtml(formatDate(week.end))}</p>
        </article>
      `
    )
    .join("");
}

function collectCalendarEvents(start, end) {
  const events = [];

  state.paychecks.forEach((item) => {
    events.push(...expandRecurring(item, "income", item.amount, start, end));
  });
  state.bills.forEach((item) => {
    events.push(...expandRecurring(item, "bill", -item.amount, start, end));
  });
  state.savingsGoals.forEach((item) => {
    if (item.contributionAmount > 0 && item.nextDate) {
      events.push(...expandSavingsGoalCalendarEvents(item, start, end));
    }
  });
  state.sharedExpenses.forEach((item) => {
    const date = parseDate(item.date);
    if (date >= start && date <= end) {
      const debt = calculateSharedExpenseDebt(item);
      events.push({
        id: item.id,
        label: item.label,
        owner: item.paidBy,
        date,
        delta: -Math.abs(item.amount || 0),
        kind: "shared_expense",
        meta: debt ? `${debt.fromOwner} doit ${formatCurrency(debt.amount)}` : "Dépense commune",
      });
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
  state.transfers.forEach((item) => {
    const date = parseDate(item.date);
    if (date >= start && date <= end) {
      events.push({
        id: item.id,
        label: item.label || "Virement",
        date,
        amount: item.amount,
        kind: "transfer",
        fromOwner: item.fromOwner,
        toOwner: item.toOwner,
      });
    }
  });

  return events.sort(compareEvents);
}

function renderCalendarEvent(event) {
  const tone = event.kind === "income" ? "positive" : event.kind === "transfer" ? "transfer" : "negative";
  const amountLabel = event.kind === "transfer"
    ? formatCurrency(event.amount)
    : formatSignedCurrency(event.delta);
  const metaLabel = event.kind === "transfer"
    ? `${formatOwnerLabel(event.fromOwner)} → ${formatOwnerLabel(event.toOwner)}`
    : event.meta || formatOwnerLabel(event.owner);

  return `
    <div class="calendar-event ${tone}">
      <div class="calendar-event-copy">
        <strong>${escapeHtml(event.label)}</strong>
        <small>${escapeHtml(metaLabel)}</small>
      </div>
      <span>${escapeHtml(amountLabel)}</span>
    </div>
  `;
}

function getCalendarDayDelta(event) {
  return event.kind === "transfer" ? 0 : event.delta || 0;
}

function handleMortgageFormSubmit(event) {
  event.preventDefault();
  state.mortgageTool = readMortgageForm(event.currentTarget);
  persistState();
  syncMortgageHelperText(state.mortgageTool);
  renderMortgageToolOutput(state.mortgageTool);
}

function handleMortgageFormInput(event) {
  state.mortgageTool = readMortgageForm(event.currentTarget);
  persistState({ skipCloud: true });
  syncMortgageHelperText(state.mortgageTool);
  renderMortgageToolOutput(state.mortgageTool);
}

function resetMortgageTool() {
  state.mortgageTool = { ...DEFAULT_MORTGAGE_TOOL };
  persistState();
  renderMortgageTool();
}

function loadMortgageAcfcExample() {
  state.mortgageTool = { ...DEFAULT_MORTGAGE_TOOL };
  persistState();
  renderMortgageTool();
}

function readMortgageForm(form) {
  return sanitizeMortgageTool({
    principal: form.elements.principal.value,
    interestRate: form.elements.interestRate.value,
    amortizationYears: form.elements.amortizationYears.value,
    amortizationMonths: form.elements.amortizationMonths.value,
    paymentFrequency: form.elements.paymentFrequency.value,
    termYears: form.elements.termYears.value,
    prepaymentAmount: form.elements.prepaymentAmount.value,
    prepaymentFrequency: form.elements.prepaymentFrequency.value,
    prepaymentStartPayment: form.elements.prepaymentStartPayment.value,
    propertyTaxAnnual: form.elements.propertyTaxAnnual.value,
    schoolTaxAnnual: form.elements.schoolTaxAnnual.value,
    homeInsuranceMonthly: form.elements.homeInsuranceMonthly.value,
    heatingMonthly: form.elements.heatingMonthly.value,
    electricityMonthly: form.elements.electricityMonthly.value,
    waterWasteMonthly: form.elements.waterWasteMonthly.value,
    condoFeesMonthly: form.elements.condoFeesMonthly.value,
    internetMonthly: form.elements.internetMonthly.value,
    maintenanceAnnual: form.elements.maintenanceAnnual.value,
    otherHousingMonthly: form.elements.otherHousingMonthly.value,
  });
}

function renderMortgageTool() {
  populateMortgageForm();
  syncMortgageHelperText(state.mortgageTool);
  renderMortgageToolOutput(state.mortgageTool);
}

function populateMortgageForm() {
  const form = $("mortgageForm");
  if (!form) {
    return;
  }

  const mortgage = sanitizeMortgageTool(state.mortgageTool);
  form.elements.principal.value = mortgage.principal || mortgage.principal === 0 ? String(mortgage.principal) : "";
  form.elements.interestRate.value = mortgage.interestRate || mortgage.interestRate === 0 ? String(mortgage.interestRate) : "";
  form.elements.amortizationYears.value =
    mortgage.amortizationYears || mortgage.amortizationYears === 0 ? String(mortgage.amortizationYears) : "";
  form.elements.amortizationMonths.value = String(mortgage.amortizationMonths || 0);
  form.elements.paymentFrequency.value = mortgage.paymentFrequency;
  form.elements.termYears.value = String(mortgage.termYears);
  form.elements.prepaymentAmount.value =
    mortgage.prepaymentAmount || mortgage.prepaymentAmount === 0 ? String(mortgage.prepaymentAmount) : "";
  form.elements.prepaymentFrequency.value = mortgage.prepaymentFrequency;
  form.elements.prepaymentStartPayment.value = String(mortgage.prepaymentStartPayment || 1);
  form.elements.propertyTaxAnnual.value = String(mortgage.propertyTaxAnnual || 0);
  form.elements.schoolTaxAnnual.value = String(mortgage.schoolTaxAnnual || 0);
  form.elements.homeInsuranceMonthly.value = String(mortgage.homeInsuranceMonthly || 0);
  form.elements.heatingMonthly.value = String(mortgage.heatingMonthly || 0);
  form.elements.electricityMonthly.value = String(mortgage.electricityMonthly || 0);
  form.elements.waterWasteMonthly.value = String(mortgage.waterWasteMonthly || 0);
  form.elements.condoFeesMonthly.value = String(mortgage.condoFeesMonthly || 0);
  form.elements.internetMonthly.value = String(mortgage.internetMonthly || 0);
  form.elements.maintenanceAnnual.value = String(mortgage.maintenanceAnnual || 0);
  form.elements.otherHousingMonthly.value = String(mortgage.otherHousingMonthly || 0);
}

function syncMortgageHelperText(mortgage = state.mortgageTool) {
  const target = $("mortgageHelperText");
  if (!target) {
    return;
  }

  const definition = getMortgageFrequencyDefinition(mortgage.paymentFrequency);
  const amount = parseAmount(mortgage.prepaymentAmount);
  const startPayment = Math.max(1, Math.floor(parseAmount(mortgage.prepaymentStartPayment) || 1));

  if (amount <= 0) {
    target.textContent = "Aucun remboursement anticipé n'est appliqué. Les résultats montrent seulement le plan régulier.";
    return;
  }

  if (mortgage.prepaymentFrequency === "regular") {
    target.textContent = `${formatCurrency(amount)} seront ajoutés à chaque versement à partir du versement #${startPayment}.`;
    return;
  }

  if (mortgage.prepaymentFrequency === "yearly") {
    target.textContent = `${formatCurrency(amount)} seront ajoutés une fois par année, soit tous les ${definition.periodsPerYear} versements, à partir du versement #${startPayment}.`;
    return;
  }

  target.textContent = `${formatCurrency(amount)} seront ajoutés une seule fois au versement #${startPayment}.`;
}

function renderMortgageToolOutput(mortgage = state.mortgageTool) {
  const result = calculateMortgageScenario(mortgage);
  const quickStatsTarget = $("mortgageQuickStats");
  const summaryCardsTarget = $("mortgageSummaryCards");
  const carryingCostTarget = $("mortgageCarryingCostTable");
  const overviewTarget = $("mortgageOverviewTable");
  const narrativeTarget = $("mortgageNarrative");
  const annualTarget = $("mortgageAnnualTable");
  const paymentsTarget = $("mortgagePaymentsTable");

  if (!result.isValid) {
    $("mortgageRegularPayment").textContent = "-";
    $("mortgageLead").textContent = "Entre un capital et un amortissement valides pour obtenir une estimation.";
    if (quickStatsTarget) {
      quickStatsTarget.innerHTML = "";
    }
    if (summaryCardsTarget) {
      summaryCardsTarget.innerHTML = `
        <article class="calendar-summary-card">
          <span>Calcul</span>
          <strong>En attente</strong>
        </article>
      `;
    }
    if (carryingCostTarget) {
      carryingCostTarget.innerHTML = `
        <tr>
          <td colspan="3">Ajoute des frais de logement pour afficher le coût mensuel tout inclus.</td>
        </tr>
      `;
    }
    if (overviewTarget) {
      overviewTarget.innerHTML = `
        <tr>
          <td colspan="3">Le calcul apparaîtra ici dès qu'un capital et un amortissement valides seront saisis.</td>
        </tr>
      `;
    }
    if (narrativeTarget) {
      narrativeTarget.innerHTML = `
        <li>Entre un montant de prêt, un taux et une période d'amortissement pour lancer le scénario.</li>
      `;
    }
    if (annualTarget) {
      annualTarget.innerHTML = `
        <tr>
          <td colspan="6">Aucun résumé annuel disponible pour l'instant.</td>
        </tr>
      `;
    }
    if (paymentsTarget) {
      paymentsTarget.innerHTML = `
        <tr>
          <td colspan="6">Aucun versement à afficher pour l'instant.</td>
        </tr>
      `;
    }
    return;
  }

  $("mortgageRegularPayment").textContent = formatCurrency(result.regularPayment);
  $("mortgageLead").textContent = `${formatCurrency(result.regularPayment)} ${getMortgagePaymentUnitLabel(result.settings.paymentFrequency)} sur un prêt de ${formatCurrency(result.settings.principal)}.`;

  if (quickStatsTarget) {
    quickStatsTarget.innerHTML = [
      {
        label: "Taux par versement",
        value: formatPercent(result.periodicRate * 100, 4),
      },
      {
        label: "Solde fin de terme",
        value: formatCurrency(result.endOfTermBalance),
      },
      {
        label: "Économie d'intérêts",
        value: formatCurrency(result.interestSaved),
      },
      {
        label: "Temps gagné",
        value: result.timeSavedLabel,
      },
    ]
      .map(
        (item) => `
          <div class="planner-stat">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </div>
        `
      )
      .join("");
  }

  if (summaryCardsTarget) {
    summaryCardsTarget.innerHTML = [
      {
        label: "Paiement hypothécaire",
        value: formatCurrency(result.regularPayment),
      },
      {
        label: "Autres frais / mois",
        value: formatCurrency(result.carryingCosts.monthlyExtras),
      },
      {
        label: "Maison tout inclus / mois",
        value: formatCurrency(result.carryingCosts.totalMonthlyHousingCost),
      },
      {
        label: "Maison tout inclus / an",
        value: formatCurrency(result.carryingCosts.totalAnnualHousingCost),
      },
    ]
      .map(
        (card) => `
          <article class="calendar-summary-card">
            <span>${escapeHtml(card.label)}</span>
            <strong>${escapeHtml(card.value)}</strong>
          </article>
        `
      )
      .join("");
  }

  if (carryingCostTarget) {
    carryingCostTarget.innerHTML = result.carryingCosts.breakdown
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.label)}</td>
            <td>${escapeHtml(formatCurrency(row.monthly))}</td>
            <td>${escapeHtml(formatCurrency(row.annual))}</td>
          </tr>
        `
      )
      .join("");
  }

  if (overviewTarget) {
    const overviewRows = [
      {
        label: "Nombre de versements",
        term: formatInteger(result.termTotals.paymentCount),
        amortization: formatInteger(result.totals.paymentCount),
      },
      {
        label: "Versement hypothécaire",
        term: formatCurrency(result.regularPayment),
        amortization: formatCurrency(result.regularPayment),
      },
      {
        label: "Remboursement anticipé",
        term: formatCurrency(result.termTotals.prepayment),
        amortization: formatCurrency(result.totals.prepayment),
      },
      {
        label: "Paiement de capital",
        term: formatCurrency(result.termTotals.principal),
        amortization: formatCurrency(result.totals.principal),
      },
      {
        label: "Paiement de frais d'intérêt",
        term: formatCurrency(result.termTotals.interest),
        amortization: formatCurrency(result.totals.interest),
      },
      {
        label: "Coût total",
        term: formatCurrency(result.termTotals.totalPaid),
        amortization: formatCurrency(result.totals.totalPaid),
      },
    ];

    overviewTarget.innerHTML = overviewRows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.label)}</td>
            <td>${escapeHtml(row.term)}</td>
            <td>${escapeHtml(row.amortization)}</td>
          </tr>
        `
      )
      .join("");
  }

  if (narrativeTarget) {
    const narrativeItems = [
      `Au cours de la période d'amortissement de ${result.requestedDurationLabel}, vous auriez ${result.totals.paymentCount} versement${result.totals.paymentCount > 1 ? "s" : ""} ${getMortgageFrequencyLabelForSentence(result.settings.paymentFrequency)} de ${formatCurrency(result.regularPayment)}.`,
      `Sur l'amortissement complet, vous paieriez ${formatCurrency(result.totals.principal)} en capital et ${formatCurrency(result.totals.interest)} en intérêts, pour un coût total de ${formatCurrency(result.totals.totalPaid)}.`,
      `Au cours du terme de ${formatInteger(result.settings.termYears)} an${result.settings.termYears > 1 ? "s" : ""}, vous effectueriez ${result.termTotals.paymentCount} versement${result.termTotals.paymentCount > 1 ? "s" : ""} pour ${formatCurrency(result.termTotals.totalPaid)} au total.`,
      `À la fin du terme, le solde estimé serait de ${formatCurrency(result.endOfTermBalance)}.`,
      `Avec les frais ajoutés, la maison reviendrait à environ ${formatCurrency(result.carryingCosts.totalMonthlyHousingCost)} par mois, soit ${formatCurrency(result.carryingCosts.totalAnnualHousingCost)} par année.`,
      result.totals.prepayment > 0
        ? `Avec les remboursements anticipés, vous économiseriez ${formatCurrency(result.interestSaved)} d'intérêts et environ ${result.timeSavedLabel.toLowerCase()}.`
        : "Aucun remboursement anticipé n'est appliqué dans ce scénario.",
    ];

    narrativeTarget.innerHTML = narrativeItems
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
  }

  if (annualTarget) {
    annualTarget.innerHTML = result.annualSummary
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(`Année ${row.year}`)}</td>
            <td>${escapeHtml(formatInteger(row.paymentCount))}</td>
            <td>${escapeHtml(formatCurrency(row.principal))}</td>
            <td>${escapeHtml(formatCurrency(row.interest))}</td>
            <td>${escapeHtml(formatCurrency(row.prepayment))}</td>
            <td>${escapeHtml(formatCurrency(row.endingBalance))}</td>
          </tr>
        `
      )
      .join("");
  }

  if (paymentsTarget) {
    paymentsTarget.innerHTML = result.schedule.slice(0, 12)
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(formatInteger(row.number))}</td>
            <td>${escapeHtml(formatCurrency(row.payment))}</td>
            <td>${escapeHtml(formatCurrency(row.principal))}</td>
            <td>${escapeHtml(formatCurrency(row.interest))}</td>
            <td>${escapeHtml(formatCurrency(row.prepayment))}</td>
            <td>${escapeHtml(formatCurrency(row.balance))}</td>
          </tr>
        `
      )
      .join("");
  }
}

function calculateMortgageScenario(rawSettings) {
  const settings = sanitizeMortgageTool(rawSettings);
  const totalMonths = settings.amortizationYears * 12 + settings.amortizationMonths;
  if (settings.principal <= 0 || totalMonths <= 0) {
    return { isValid: false, settings };
  }

  const frequency = getMortgageFrequencyDefinition(settings.paymentFrequency);
  const periodicRate = getMortgagePeriodicRate(settings.interestRate / 100, frequency.periodsPerYear);
  const regularPayment = calculateMortgageRegularPayment(
    settings.principal,
    settings.interestRate / 100,
    totalMonths,
    settings.paymentFrequency
  );
  const schedule = buildMortgageSchedule(settings);
  const baselineSchedule = buildMortgageSchedule({
    ...settings,
    prepaymentAmount: 0,
    prepaymentFrequency: "once",
    prepaymentStartPayment: 1,
  });
  const termPaymentLimit = settings.termYears * frequency.periodsPerYear;
  const termSchedule = schedule.slice(0, termPaymentLimit);
  const totals = summarizeMortgageSchedule(schedule);
  const termTotals = summarizeMortgageSchedule(termSchedule);
  const baselineTotals = summarizeMortgageSchedule(baselineSchedule);
  const annualSummary = buildMortgageAnnualSummary(schedule, frequency.periodsPerYear);
  const endOfTermBalance = termSchedule.length ? getLast(termSchedule).balance : settings.principal;
  const interestSaved = Math.max(0, roundCurrency(baselineTotals.interest - totals.interest));
  const savedPayments = Math.max(0, baselineTotals.paymentCount - totals.paymentCount);
  const timeSavedLabel = formatMortgageDurationFromPayments(savedPayments, frequency.periodsPerYear);
  const carryingCosts = buildMortgageCarryingCosts(settings, regularPayment);

  return {
    isValid: true,
    settings,
    periodicRate,
    regularPayment,
    schedule,
    totals,
    termTotals,
    annualSummary,
    endOfTermBalance: roundCurrency(endOfTermBalance),
    interestSaved,
    timeSavedLabel,
    actualDurationLabel: formatMortgageDurationFromPayments(totals.paymentCount, frequency.periodsPerYear),
    requestedDurationLabel: formatMortgageDurationFromMonths(totalMonths),
    carryingCosts,
  };
}

function buildMortgageSchedule(settings) {
  const principal = Math.max(0, parseAmount(settings.principal));
  const totalMonths = settings.amortizationYears * 12 + settings.amortizationMonths;
  const frequency = getMortgageFrequencyDefinition(settings.paymentFrequency);
  const ratePerPayment = getMortgagePeriodicRate(settings.interestRate / 100, frequency.periodsPerYear);
  const regularPayment = calculateMortgageRegularPayment(
    principal,
    settings.interestRate / 100,
    totalMonths,
    settings.paymentFrequency
  );
  const plannedPrepayment = Math.max(0, parseAmount(settings.prepaymentAmount));
  const schedule = [];
  let balance = principal;
  let guard = 0;

  while (balance > 0.005 && guard < 4000) {
    guard += 1;
    const interest = roundCurrency(balance * ratePerPayment);
    const desiredPrepayment = getMortgagePrepaymentForNumber(
      guard,
      plannedPrepayment,
      settings.prepaymentFrequency,
      settings.prepaymentStartPayment,
      frequency.periodsPerYear
    );
    const scheduledPrincipal = Math.max(0, regularPayment - interest);
    const regularPrincipal = Math.min(balance, scheduledPrincipal);
    const actualRegularPayment = roundCurrency(interest + regularPrincipal);
    const remainingAfterRegular = Math.max(0, balance - regularPrincipal);
    const prepayment = roundCurrency(Math.min(desiredPrepayment, remainingAfterRegular));
    const totalPrincipal = roundCurrency(regularPrincipal + prepayment);
    balance = roundCurrency(Math.max(0, balance - totalPrincipal));

    schedule.push({
      number: guard,
      payment: roundCurrency(actualRegularPayment + prepayment),
      scheduledPayment: roundCurrency(regularPayment),
      principal: totalPrincipal,
      interest,
      prepayment,
      balance,
    });
  }

  return schedule;
}

function summarizeMortgageSchedule(schedule) {
  return {
    paymentCount: schedule.length,
    principal: roundCurrency(sumBy(schedule, (row) => row.principal)),
    interest: roundCurrency(sumBy(schedule, (row) => row.interest)),
    prepayment: roundCurrency(sumBy(schedule, (row) => row.prepayment)),
    totalPaid: roundCurrency(sumBy(schedule, (row) => row.payment)),
  };
}

function buildMortgageAnnualSummary(schedule, periodsPerYear) {
  return schedule.reduce((years, row) => {
    const year = Math.floor((row.number - 1) / periodsPerYear) + 1;
    let current = years.find((item) => item.year === year);
    if (!current) {
      current = {
        year,
        paymentCount: 0,
        principal: 0,
        interest: 0,
        prepayment: 0,
        endingBalance: 0,
      };
      years.push(current);
    }

    current.paymentCount += 1;
    current.principal = roundCurrency(current.principal + row.principal);
    current.interest = roundCurrency(current.interest + row.interest);
    current.prepayment = roundCurrency(current.prepayment + row.prepayment);
    current.endingBalance = row.balance;
    return years;
  }, []);
}

function buildMortgageCarryingCosts(settings, regularPayment) {
  const breakdown = [
    {
      label: "Versement hypothécaire",
      monthly: roundCurrency(regularPayment),
      annual: annualizeMonthly(regularPayment),
    },
    {
      label: "Taxes municipales",
      monthly: monthlyFromAnnual(settings.propertyTaxAnnual),
      annual: roundCurrency(settings.propertyTaxAnnual),
    },
    {
      label: "Taxes scolaires",
      monthly: monthlyFromAnnual(settings.schoolTaxAnnual),
      annual: roundCurrency(settings.schoolTaxAnnual),
    },
    {
      label: "Assurance habitation",
      monthly: roundCurrency(settings.homeInsuranceMonthly),
      annual: annualizeMonthly(settings.homeInsuranceMonthly),
    },
    {
      label: "Chauffage",
      monthly: roundCurrency(settings.heatingMonthly),
      annual: annualizeMonthly(settings.heatingMonthly),
    },
    {
      label: "Électricité",
      monthly: roundCurrency(settings.electricityMonthly),
      annual: annualizeMonthly(settings.electricityMonthly),
    },
    {
      label: "Eau / déchets",
      monthly: roundCurrency(settings.waterWasteMonthly),
      annual: annualizeMonthly(settings.waterWasteMonthly),
    },
    {
      label: "Frais de condo",
      monthly: roundCurrency(settings.condoFeesMonthly),
      annual: annualizeMonthly(settings.condoFeesMonthly),
    },
    {
      label: "Internet / télé",
      monthly: roundCurrency(settings.internetMonthly),
      annual: annualizeMonthly(settings.internetMonthly),
    },
    {
      label: "Entretien / fonds de réserve",
      monthly: monthlyFromAnnual(settings.maintenanceAnnual),
      annual: roundCurrency(settings.maintenanceAnnual),
    },
    {
      label: "Autres frais",
      monthly: roundCurrency(settings.otherHousingMonthly),
      annual: annualizeMonthly(settings.otherHousingMonthly),
    },
  ];

  const monthlyExtras = roundCurrency(
    sumBy(breakdown.slice(1), (item) => item.monthly)
  );
  const totalMonthlyHousingCost = roundCurrency(sumBy(breakdown, (item) => item.monthly));
  const totalAnnualHousingCost = roundCurrency(sumBy(breakdown, (item) => item.annual));
  return {
    breakdown,
    monthlyExtras,
    totalMonthlyHousingCost,
    totalAnnualHousingCost,
  };
}

function calculateMortgageRegularPayment(principal, nominalRate, totalMonths, paymentFrequency) {
  const frequency = getMortgageFrequencyDefinition(paymentFrequency);
  if (principal <= 0 || totalMonths <= 0) {
    return 0;
  }

  if (frequency.mode === "accelerated") {
    const monthlyPayment = calculateMortgageRegularPayment(principal, nominalRate, totalMonths, "monthly");
    return roundCurrency(monthlyPayment / frequency.divisor);
  }

  const exactPeriods = (totalMonths / 12) * frequency.periodsPerYear;
  const ratePerPayment = getMortgagePeriodicRate(nominalRate, frequency.periodsPerYear);
  if (!ratePerPayment) {
    return roundCurrency(principal / exactPeriods);
  }

  const payment =
    (principal * ratePerPayment) / (1 - Math.pow(1 + ratePerPayment, -exactPeriods));
  return roundCurrency(payment);
}

function getMortgagePeriodicRate(nominalRate, periodsPerYear) {
  if (!nominalRate || nominalRate <= 0) {
    return 0;
  }
  return Math.pow(1 + nominalRate / 2, 2 / periodsPerYear) - 1;
}

function getMortgagePrepaymentForNumber(number, amount, frequency, startPayment, periodsPerYear) {
  const effectiveStart = Math.max(1, Math.floor(parseAmount(startPayment) || 1));
  if (amount <= 0 || number < effectiveStart) {
    return 0;
  }
  if (frequency === "regular") {
    return amount;
  }
  if (frequency === "yearly") {
    return (number - effectiveStart) % periodsPerYear === 0 ? amount : 0;
  }
  return number === effectiveStart ? amount : 0;
}

function getMortgageFrequencyDefinition(frequencyKey) {
  return MORTGAGE_PAYMENT_FREQUENCIES[frequencyKey] || MORTGAGE_PAYMENT_FREQUENCIES.monthly;
}

function getMortgagePaymentUnitLabel(frequencyKey) {
  if (frequencyKey === "weekly" || frequencyKey === "accelerated_weekly") {
    return "par semaine";
  }
  if (frequencyKey === "biweekly" || frequencyKey === "accelerated_biweekly") {
    return "aux deux semaines";
  }
  if (frequencyKey === "semimonthly") {
    return "deux fois par mois";
  }
  return "par mois";
}

function getMortgageFrequencyLabelForSentence(frequencyKey) {
  if (frequencyKey === "weekly" || frequencyKey === "accelerated_weekly") {
    return "par semaine";
  }
  if (frequencyKey === "biweekly" || frequencyKey === "accelerated_biweekly") {
    return "aux deux semaines";
  }
  if (frequencyKey === "semimonthly") {
    return "deux fois par mois";
  }
  return "par mois";
}

function sanitizeMortgageTool(input) {
  if (!input || typeof input !== "object") {
    return { ...DEFAULT_MORTGAGE_TOOL };
  }

  const paymentFrequency = textValue(input.paymentFrequency);
  const prepaymentFrequency = textValue(input.prepaymentFrequency);
  return {
    principal: Math.max(0, parseAmount(input.principal ?? DEFAULT_MORTGAGE_TOOL.principal)),
    interestRate: Math.max(0, parseAmount(input.interestRate ?? DEFAULT_MORTGAGE_TOOL.interestRate)),
    amortizationYears: clampInteger(
      input.amortizationYears ?? DEFAULT_MORTGAGE_TOOL.amortizationYears,
      0,
      30
    ),
    amortizationMonths: clampInteger(
      input.amortizationMonths ?? DEFAULT_MORTGAGE_TOOL.amortizationMonths,
      0,
      11
    ),
    paymentFrequency: MORTGAGE_PAYMENT_FREQUENCIES[paymentFrequency] ? paymentFrequency : DEFAULT_MORTGAGE_TOOL.paymentFrequency,
    termYears: clampInteger(input.termYears ?? DEFAULT_MORTGAGE_TOOL.termYears, 1, 10),
    prepaymentAmount: Math.max(0, parseAmount(input.prepaymentAmount ?? DEFAULT_MORTGAGE_TOOL.prepaymentAmount)),
    prepaymentFrequency: MORTGAGE_PREPAYMENT_FREQUENCY_LABELS[prepaymentFrequency]
      ? prepaymentFrequency
      : DEFAULT_MORTGAGE_TOOL.prepaymentFrequency,
    prepaymentStartPayment: Math.max(
      1,
      clampInteger(input.prepaymentStartPayment ?? DEFAULT_MORTGAGE_TOOL.prepaymentStartPayment, 1, 10000)
    ),
    propertyTaxAnnual: Math.max(0, parseAmount(input.propertyTaxAnnual ?? DEFAULT_MORTGAGE_TOOL.propertyTaxAnnual)),
    schoolTaxAnnual: Math.max(0, parseAmount(input.schoolTaxAnnual ?? DEFAULT_MORTGAGE_TOOL.schoolTaxAnnual)),
    homeInsuranceMonthly: Math.max(
      0,
      parseAmount(input.homeInsuranceMonthly ?? DEFAULT_MORTGAGE_TOOL.homeInsuranceMonthly)
    ),
    heatingMonthly: Math.max(0, parseAmount(input.heatingMonthly ?? DEFAULT_MORTGAGE_TOOL.heatingMonthly)),
    electricityMonthly: Math.max(
      0,
      parseAmount(input.electricityMonthly ?? DEFAULT_MORTGAGE_TOOL.electricityMonthly)
    ),
    waterWasteMonthly: Math.max(
      0,
      parseAmount(input.waterWasteMonthly ?? DEFAULT_MORTGAGE_TOOL.waterWasteMonthly)
    ),
    condoFeesMonthly: Math.max(0, parseAmount(input.condoFeesMonthly ?? DEFAULT_MORTGAGE_TOOL.condoFeesMonthly)),
    internetMonthly: Math.max(0, parseAmount(input.internetMonthly ?? DEFAULT_MORTGAGE_TOOL.internetMonthly)),
    maintenanceAnnual: Math.max(0, parseAmount(input.maintenanceAnnual ?? DEFAULT_MORTGAGE_TOOL.maintenanceAnnual)),
    otherHousingMonthly: Math.max(
      0,
      parseAmount(input.otherHousingMonthly ?? DEFAULT_MORTGAGE_TOOL.otherHousingMonthly)
    ),
  };
}

function clampInteger(value, min, max) {
  const numeric = Math.floor(parseAmount(value));
  if (!Number.isFinite(numeric)) {
    return min;
  }
  return Math.min(max, Math.max(min, numeric));
}

function formatMortgageDurationFromPayments(paymentCount, periodsPerYear) {
  if (!paymentCount) {
    return "0 mois";
  }
  return formatMortgageDurationFromMonths(Math.round((paymentCount * 12) / periodsPerYear));
}

function formatMortgageDurationFromMonths(totalMonths) {
  const months = Math.max(0, Math.round(totalMonths));
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (!years) {
    return `${remainder} mois`;
  }
  if (!remainder) {
    return `${years} an${years > 1 ? "s" : ""}`;
  }
  return `${years} an${years > 1 ? "s" : ""} et ${remainder} mois`;
}

function formatPercent(value, decimals = 2) {
  return `${new Intl.NumberFormat("fr-CA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0)} %`;
}

function formatInteger(value) {
  return new Intl.NumberFormat("fr-CA", {
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function monthlyFromAnnual(value) {
  return roundCurrency((parseAmount(value) || 0) / 12);
}

function annualizeMonthly(value) {
  return roundCurrency((parseAmount(value) || 0) * 12);
}

function normalizeProjectionSelectionValue(value) {
  const text = textValue(value);
  if (!text) {
    return "";
  }
  if (text.startsWith("holder:") || text.startsWith("account:")) {
    return text;
  }
  if (
    text === ACCOUNT_HOLDERS.partnerOne ||
    text === ACCOUNT_HOLDERS.partnerTwo ||
    text === ACCOUNT_HOLDERS.shared
  ) {
    return `holder:${text}`;
  }
  if (getAccountByOwner(text)) {
    return `account:${text}`;
  }
  return text;
}

function parseProjectionSelection(selection) {
  const value = normalizeProjectionSelectionValue(selection);
  if (!value) {
    return { type: "all" };
  }
  if (value.startsWith("holder:")) {
    return {
      type: "holder",
      holder: value.slice("holder:".length),
    };
  }
  if (value.startsWith("account:")) {
    return {
      type: "account",
      owner: value.slice("account:".length),
    };
  }
  return {
    type: "account",
    owner: value,
  };
}

function getProjectionSelectionOptions() {
  const activeAccounts = getActiveAccounts();
  const options = [];

  [ACCOUNT_HOLDERS.partnerOne, ACCOUNT_HOLDERS.partnerTwo, ACCOUNT_HOLDERS.shared].forEach((holder) => {
    if (activeAccounts.some((account) => account.holder === holder)) {
      options.push({
        value: `holder:${holder}`,
        label: isSharedHolder(holder)
          ? "Tous les comptes communs"
          : `Tous les comptes de ${formatAccountHolder(holder)}`,
      });
    }
  });

  activeAccounts.forEach((account) => {
    options.push({
      value: `account:${account.owner}`,
      label: `${account.owner} • ${ACCOUNT_KIND_LABELS[account.kind] || account.kind} • ${formatAccountHolder(
        account.holder
      )}`,
    });
  });

  return options;
}

function getProjectionSelectionAccounts(selection, accounts = state.accounts) {
  const parsed = parseProjectionSelection(selection);
  const activeAccounts = (accounts || []).filter((account) => account.status !== "closed");
  if (parsed.type === "holder") {
    return activeAccounts.filter((account) => account.holder === parsed.holder);
  }
  if (parsed.type === "account") {
    return activeAccounts.filter((account) => account.owner === parsed.owner);
  }
  return activeAccounts;
}

function getProjectionSelectionCurrentBalance(selection, accounts = state.accounts) {
  return getTotalCurrentBalance(getProjectionSelectionAccounts(selection, accounts));
}

function projectionSelectionMatchesOwner(selection, owner, accounts = state.accounts) {
  const parsed = parseProjectionSelection(selection);
  if (parsed.type === "all") {
    return Boolean(getAccountByOwner(owner, accounts));
  }
  if (parsed.type === "holder") {
    return getProjectionSelectionAccounts(selection, accounts).some((account) => account.owner === owner);
  }
  return parsed.owner === owner;
}

function getProjectionSelectionLabel(selection) {
  const parsed = parseProjectionSelection(selection);
  if (parsed.type === "holder") {
    return isSharedHolder(parsed.holder)
      ? "Tous les comptes communs"
      : `Tous les comptes de ${formatAccountHolder(parsed.holder)}`;
  }
  if (parsed.type === "account") {
    return formatOwnerLabel(parsed.owner);
  }
  return "Tous les comptes";
}

function renderContributors() {
  const cards = computeOwnerMetrics();
  $("contributorsGrid").innerHTML = cards.length
    ? cards
        .map(
          (card) => `
            <article class="contributor-card fade-in">
              <span>${escapeHtml(card.displayName)}</span>
              <strong class="${card.projectedBalance >= 0 ? "positive" : "negative"}">${escapeHtml(formatCurrency(card.projectedBalance))}</strong>
              <p>${escapeHtml(card.note)}</p>
              <div class="badge-row">
                <span class="badge">Actuel ${escapeHtml(formatCurrency(card.currentBalance))}</span>
                <span class="badge">Net ${escapeHtml(formatCurrency(card.net))}</span>
                <span class="badge">Point bas ${escapeHtml(formatCurrency(card.lowestBalance))}</span>
              </div>
              <div class="quick-actions">
                <button class="table-button edit" type="button" data-quick-action="bill" data-owner="${escapeHtml(card.owner)}">+ Facture</button>
                <button class="table-button edit" type="button" data-quick-action="transfer" data-owner="${escapeHtml(card.owner)}">+ Virement</button>
                <button class="table-button edit" type="button" data-quick-action="saving" data-owner="${escapeHtml(card.owner)}">+ Épargne</button>
                ${isSharedOwner(card.owner) ? "" : `<button class="table-button edit" type="button" data-quick-action="sharedExpense" data-owner="${escapeHtml(card.owner)}">+ Partagée</button>`}
              </div>
            </article>
          `
        )
        .join("")
    : `<article class="empty-state">Ajoute au moins un compte actif pour suivre les projections par compte.</article>`;
}

function renderSharedDebtCards() {
  const target = $("sharedDebtCards");
  if (!target) {
    return;
  }

  const summary = computeSharedDebtSummary();
  const partnerOne = state.household.partnerOne || "Moi";
  const partnerTwo = state.household.partnerTwo || "Geneviève";
  const card = {
    label: "Solde net entre vous",
    value: formatCurrency(Math.abs(summary.net)),
    note:
      summary.net > 0
        ? `${partnerOne} doit ${partnerTwo}.`
        : summary.net < 0
          ? `${partnerTwo} doit ${partnerOne}.`
          : "Vous êtes à jour.",
  };

  target.innerHTML = `
    <article class="debt-card fade-in">
      <span>${escapeHtml(card.label)}</span>
      <strong>${escapeHtml(card.value)}</strong>
      <p>${escapeHtml(card.note)}</p>
    </article>
  `;
}

function computeAccountMetrics(owner) {
  return computeProjectionMetrics(owner);
}

function computeProjectionMetrics(selection) {
  const income = sumBy(
    state.paychecks.filter((item) => projectionSelectionMatchesOwner(selection, item.owner)),
    (item) => monthlyAmount(item.amount, item.frequency)
  );
  const bills = sumBy(
    state.bills.filter((item) => projectionSelectionMatchesOwner(selection, item.owner)),
    (item) => monthlyAmount(item.amount, item.frequency)
  );
  const savings = sumBy(state.savingsGoals, (item) =>
    getSavingsGoalMonthlyContributionForSelection(item, selection)
  );
  const savingsFlow = sumBy(state.savingsGoals, (item) =>
    getSavingsGoalMonthlyNetForSelection(item, selection)
  );

  return {
    income,
    bills,
    savings,
    net: income - bills + savingsFlow,
  };
}

function computeMetrics() {
  const monthlyIncome = sumBy(state.paychecks, (item) => monthlyAmount(item.amount, item.frequency));
  const monthlyBills = sumBy(state.bills, (item) => monthlyAmount(item.amount, item.frequency));
  const monthlyPersonalSavings = sumBy(
    state.savingsGoals.filter((item) => item.scope !== "shared"),
    (item) => monthlyAmount(item.contributionAmount, item.frequency)
  );
  const monthlySharedSavings = sumBy(
    state.savingsGoals.filter((item) => item.scope === "shared"),
    (item) => monthlyAmount(item.contributionAmount, item.frequency)
  );
  const monthlySavings = sumBy(state.savingsGoals, (item) =>
    monthlyAmount(item.contributionAmount, item.frequency)
  );
  const monthlySavingsFlow = sumBy(state.savingsGoals, (item) =>
    getSavingsGoalMonthlyNetForSelection(item, null)
  );

  return {
    monthlyIncome,
    monthlyBills,
    monthlySavings,
    monthlyPersonalSavings,
    monthlySharedSavings,
    monthlyNet: monthlyIncome - monthlyBills + monthlySavingsFlow,
  };
}

function computeOwnerMetrics() {
  return getActiveAccounts().map((account) => {
    const owner = account.owner;
    const metrics = computeProjectionMetrics(owner);
    const shared = isSharedHolder(account.holder);
    const projection = buildProjection(state.household.projectionMonths || 6, owner);
    const lowestPoint = projection.points.reduce((lowest, point) => {
      if (!lowest || point.balance < lowest.balance) {
        return point;
      }
      return lowest;
    }, null);
    const projectedBalance = getLast(projection.points)
      ? getLast(projection.points).balance
      : getAccountBalance(owner);
    return {
      owner,
      displayName: formatOwnerLabel(owner),
      currentBalance: getAccountBalance(owner),
      projectedBalance,
      lowestBalance: lowestPoint ? lowestPoint.balance : getAccountBalance(owner),
      income: metrics.income,
      bills: metrics.bills,
      savings: metrics.savings,
      net: metrics.net,
      note: shared
        ? `${ACCOUNT_KIND_LABELS[account.kind] || account.kind} commun projeté sur ${state.household.projectionMonths || 6} mois.`
        : `${ACCOUNT_KIND_LABELS[account.kind] || account.kind} de ${formatAccountHolder(account.holder)} projeté sur ${state.household.projectionMonths || 6} mois.`,
    };
  });
}

function buildProjection(months, selection = null) {
  const start = startOfDay(new Date());
  const end = addMonthsClamped(start, months);
  const events = [];
  const matchesOwner = (item) => projectionSelectionMatchesOwner(selection, item.owner);

  state.paychecks.filter(matchesOwner).forEach((item) => {
    events.push(...expandRecurring(item, "income", item.amount, start, end));
  });
  state.bills.filter(matchesOwner).forEach((item) => {
    events.push(...expandRecurring(item, "bill", -item.amount, start, end));
  });
  state.savingsGoals.forEach((item) => {
    events.push(...buildSavingsGoalProjectionEvents(item, selection, start, end));
  });
  state.sharedExpenses.forEach((item) => {
    const date = parseDate(item.date);
    if (date < start || date > end) {
      return;
    }
    if (!matchesOwner(item)) {
      return;
    }
    const debt = calculateSharedExpenseDebt(item);
    events.push({
      id: item.id,
      label: item.label,
      owner: item.paidBy,
      date,
      delta: -Math.abs(item.amount || 0),
      kind: "shared_expense",
      meta: debt ? `${debt.fromOwner} doit ${formatCurrency(debt.amount)}` : "Dépense commune",
    });
  });
  state.transactions.filter(matchesOwner).forEach((item) => {
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
  state.transfers.forEach((item) => {
    const date = parseDate(item.date);
    if (date < start || date > end) {
      return;
    }
    const fromIncluded = projectionSelectionMatchesOwner(selection, item.fromOwner);
    const toIncluded = projectionSelectionMatchesOwner(selection, item.toOwner);
    if (!fromIncluded && !toIncluded) {
      return;
    }
    if (fromIncluded && !toIncluded) {
      events.push({
        id: item.id,
        label: item.label || `Virement vers ${formatOwnerLabel(item.toOwner)}`,
        owner: item.fromOwner,
        date,
        delta: -Math.abs(item.amount || 0),
        kind: "transfer",
      });
    }
    if (toIncluded && !fromIncluded) {
      events.push({
        id: item.id,
        label: item.label || `Virement de ${formatOwnerLabel(item.fromOwner)}`,
        owner: item.toOwner,
        date,
        delta: Math.abs(item.amount || 0),
        kind: "transfer",
      });
    }
  });

  events.sort(compareEvents);

  let runningBalance = getProjectionSelectionCurrentBalance(selection);
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
  };
}

function expandRecurring(item, kind, delta, start, end) {
  let cursor = parseDate(item.nextDate);
  const events = [];
  let guard = 0;
  const recurringEnd = item.endDate ? parseDate(item.endDate) : end;
  const effectiveEnd = recurringEnd < end ? recurringEnd : end;
  if (Number.isNaN(cursor.getTime())) {
    return events;
  }
  if (Number.isNaN(effectiveEnd.getTime()) || effectiveEnd < cursor) {
    return events;
  }

  while (cursor < start && cursor <= effectiveEnd && guard < 200) {
    cursor = advanceDate(cursor, item.frequency);
    guard += 1;
  }
  while (cursor <= effectiveEnd && guard < 600) {
    events.push({ id: item.id, label: item.label, owner: item.owner, date: cursor, delta, kind });
    cursor = advanceDate(cursor, item.frequency);
    guard += 1;
  }
  return events;
}

function compareEvents(a, b) {
  if (a.date.getTime() !== b.date.getTime()) {
    return a.date - b.date;
  }
  const order = { income: 0, transfer: 1, saving: 2, shared_expense: 3, bill: 4 };
  return (order[a.kind] ?? 9) - (order[b.kind] ?? 9);
}

function drawProjectionChart(points) {
  const svg = $("projectionChart");
  if (!points.length) {
    svg.innerHTML = "";
    return;
  }

  const width = 760;
  const height = 340;
  const balances = points.map((point) => point.balance);
  const minBalance = Math.min(...balances);
  const maxBalance = Math.max(...balances, minBalance + 1);
  const span = maxBalance - minBalance || 1;
  const yAxisValues = Array.from({ length: 5 }, (_, index) => maxBalance - (index / 4) * span);
  const yAxisLabelWidth = Math.max(...yAxisValues.map((value) => formatCurrency(value).length)) * 8.1;
  const padding = {
    top: 24,
    right: 24,
    bottom: 38,
    left: Math.max(88, Math.ceil(yAxisLabelWidth + 20)),
  };
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

  const grid = yAxisValues.map((value, index) => {
    const ratio = index / 4;
    const y = padding.top + ratio * usableHeight;
    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(19,35,29,0.09)" stroke-width="1" />
      <text x="${padding.left - 14}" y="${y + 4}" fill="#5c6e63" font-size="12" text-anchor="end">${escapeHtml(formatCurrency(value))}</text>
    `;
  }).join("");

  const labels = [points[0], getLast(points)]
    .map(
      (point) => `
        <text x="${scaleX(point.date)}" y="${height - 12}" fill="#5c6e63" font-size="12" text-anchor="middle">${escapeHtml(formatDate(point.date))}</text>
      `
    )
    .join("");

  svg.innerHTML = `
    <defs>
      <linearGradient id="balanceFill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="rgba(21, 94, 99, 0.35)" />
        <stop offset="100%" stop-color="rgba(21, 94, 99, 0.02)" />
      </linearGradient>
    </defs>
    ${grid}
    <path d="${area}" fill="url(#balanceFill)" />
    <path d="${path}" fill="none" stroke="#155e63" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    ${points.map((point) => `<circle cx="${scaleX(point.date)}" cy="${scaleY(point.balance)}" r="4.5" fill="#155e63" />`).join("")}
    ${labels}
  `;
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
      pushUndoSnapshot(`Avant import JSON (${file.name})`);
      state = sanitizeState(JSON.parse(reader.result));
      recordActivity("Import JSON", `Le budget local a été remplacé depuis ${file.name}.`);
      persistState();
      renderAll();
    } catch (error) {
      window.alert("Le fichier JSON n'est pas valide.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function buildGoalPlannerResult(formData) {
  const label = textValue(formData.get("label")) || "Nouveau but";
  const owner = textValue(formData.get("owner")) || (getSavingsGoalOwnerOptions("")[0] || {}).value || "";
  const ownerAccount = getAccountByOwner(owner);
  const targetAmount = parseAmount(formData.get("targetAmount"));
  const currentAmount = ownerAccount && ownerAccount.kind === "savings" ? parseAmount(ownerAccount.balance) : parseAmount(formData.get("currentAmount"));
  const startDate = textValue(formData.get("startDate"));
  const targetDate = textValue(formData.get("targetDate"));
  const frequency = textValue(formData.get("frequency")) || "monthly";

  if (!targetAmount || !startDate || !targetDate) {
    window.alert("Ajoutez au minimum le montant visé, la date de début et la date cible.");
    return null;
  }

  if (!owner || !ownerAccount || ownerAccount.kind !== "savings") {
    window.alert("Choisissez un compte d'épargne pour planifier un objectif.");
    return null;
  }

  const start = parseDate(startDate);
  const end = parseDate(targetDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    window.alert("Les dates du but ne sont pas valides.");
    return null;
  }

  if (end < start) {
    window.alert("La date cible doit être égale ou postérieure au début des versements.");
    return null;
  }

  const periods = countContributionSlots(startDate, targetDate, frequency);
  if (!periods) {
    window.alert("Impossible de calculer des versements avec ces dates.");
    return null;
  }

  const remainingAmount = Math.max(targetAmount - currentAmount, 0);
  const contributionAmount = remainingAmount > 0 ? roundUpCurrency(remainingAmount / periods) : 0;
  const matchedGoal = findSavingsGoal(label, owner);
  const currentPlan = matchedGoal
    ? evaluateGoalPlan({
        ...matchedGoal,
        currentAmount,
        targetAmount,
        targetDate,
        frequency,
        nextDate: startDate,
      })
    : null;
  const planStatus = currentPlan
    ? currentPlan.contributionGap > 0
      ? { label: "À renforcer", tone: "warning" }
      : { label: "Sur la bonne voie", tone: "success" }
    : { label: "Nouveau", tone: "neutral" };
  const planInsight = currentPlan
    ? currentPlan.contributionGap > 0
      ? `Le plan actuel manque ${formatCurrency(currentPlan.contributionGap)} par ${FREQUENCY_LABELS[frequency].toLowerCase()}.`
      : currentPlan.projectedFinishDate
        ? `Au rythme actuel, l'objectif serait atteint vers ${formatDate(currentPlan.projectedFinishDate)}.`
        : "Le plan actuel couvre déjà la cible."
    : "Aucun objectif existant trouvé pour ce compte, le calcul sert de point de départ.";

  return {
    label,
    owner,
    targetAmount,
    currentAmount,
    remainingAmount,
    startDate,
    targetDate,
    frequency,
    periods,
    contributionAmount,
    monthlyEquivalent: monthlyAmount(contributionAmount, frequency),
    matchedGoal,
    planStatus,
    planInsight,
  };
}

function findSavingsGoal(label, owner) {
  const normalizedLabel = textValue(label).toLowerCase();
  return (
    state.savingsGoals.find(
      (goal) => goal.owner === owner && textValue(goal.label).toLowerCase() === normalizedLabel
    ) || null
  );
}

function evaluateGoalPlan(goal) {
  const startDate = textValue(goal.nextDate) || formatInputDate(new Date());
  const targetDate = textValue(goal.targetDate);
  if (!targetDate) {
    return null;
  }

  const periods = countContributionSlots(startDate, targetDate, goal.frequency || "monthly");
  if (!periods) {
    return null;
  }

  const remainingAmount = Math.max(parseAmount(goal.targetAmount) - getSavingsGoalCurrentAmount(goal), 0);
  const requiredContribution = remainingAmount > 0 ? roundUpCurrency(remainingAmount / periods) : 0;
  const currentContribution = parseAmount(goal.contributionAmount);

  return {
    requiredContribution,
    currentContribution,
    contributionGap: Math.max(requiredContribution - currentContribution, 0),
    projectedFinishDate: estimateGoalCompletionDate(goal),
  };
}

function estimateGoalCompletionDate(goal) {
  const contributionAmount = parseAmount(goal.contributionAmount);
  const targetAmount = parseAmount(goal.targetAmount);
  let currentAmount = getSavingsGoalCurrentAmount(goal);
  if (currentAmount >= targetAmount) {
    return textValue(goal.targetDate) || formatInputDate(new Date());
  }
  if (!contributionAmount) {
    return "";
  }

  let cursor = parseDate(textValue(goal.nextDate) || formatInputDate(new Date()));
  let guard = 0;
  while (currentAmount < targetAmount && guard < 600) {
    currentAmount += contributionAmount;
    if (currentAmount >= targetAmount) {
      return formatInputDate(cursor);
    }
    cursor = advanceDate(cursor, goal.frequency || "monthly");
    guard += 1;
  }
  return "";
}

function countContributionSlots(startDate, targetDate, frequency) {
  const start = parseDate(startDate);
  const end = parseDate(targetDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  let cursor = start;
  let count = 0;
  let guard = 0;
  while (cursor <= end && guard < 600) {
    count += 1;
    cursor = advanceDate(cursor, frequency);
    guard += 1;
  }
  return count;
}

function monthlyAmount(amount, frequency) {
  if (frequency === "weekly") {
    return (amount * 52) / 12;
  }
  if (frequency === "biweekly") {
    return (amount * 26) / 12;
  }
  if (frequency === "yearly") {
    return amount / 12;
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

function roundUpCurrency(value) {
  return Math.ceil((value || 0) * 100) / 100;
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
  if (frequency === "yearly") {
    return addMonthsClamped(next, 12);
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

function startOfMonth(date) {
  const value = startOfDay(date);
  value.setDate(1);
  return value;
}

function endOfMonth(date) {
  const value = startOfMonth(date);
  value.setMonth(value.getMonth() + 1);
  value.setDate(0);
  return startOfDay(value);
}

function sameCalendarMonth(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function isSameDay(left, right) {
  return formatInputDate(left) === formatInputDate(right);
}

function startOfCalendarGrid(date) {
  const start = startOfMonth(date);
  const day = start.getDay();
  const delta = -day;
  return addDays(start, delta);
}

function differenceInCalendarDays(fromDate, toDate) {
  const start = parseDate(fromDate);
  const end = parseDate(toDate);
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86400000);
}

function formatDaysUntilLabel(days) {
  if (days <= 0) {
    return "Aujourd'hui";
  }
  return `Dans ${days} jour${days > 1 ? "s" : ""}`;
}

function getNextBillSummary(events) {
  const bills = events.filter((event) => event.kind === "bill");
  if (!bills.length) {
    return null;
  }

  const nextDate = bills[0].date;
  const sameDayBills = bills.filter((event) => isSameDay(event.date, nextDate));
  return {
    date: nextDate,
    daysAway: differenceInCalendarDays(new Date(), nextDate),
    count: sameDayBills.length,
    totalAmount: roundCurrency(sumBy(sameDayBills, (event) => Math.abs(event.delta))),
  };
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
    currency: "CAD",
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

function buildOwnedLabelKey(owner, label) {
  return `${textValue(owner).toLowerCase()}::${textValue(label).toLowerCase()}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function collectReferencedAccountSeeds(input, household) {
  const seeds = [];
  const hasExplicitSharedAccount = (input.accounts || []).some((account) => {
    if (textValue(account.id) === "account_shared") {
      return false;
    }
    return sanitizeAccountHolder(account.holder, household, account.id, account.kind, account.owner) === ACCOUNT_HOLDERS.shared;
  });
  const pushSeed = (owner, holder, kind = "checking") => {
    const label = textValue(owner);
    if (!label) {
      return;
    }
    if (
      holder === ACCOUNT_HOLDERS.shared &&
      label === getSharedOwnerValueFromHousehold(household) &&
      !hasExplicitSharedAccount
    ) {
      return;
    }
    seeds.push({
      id: "",
      owner: label,
      holder,
      kind,
      status: "active",
      balance: 0,
    });
  };

  (input.paychecks || []).forEach((item) => {
    pushSeed(item.owner, inferHolderFromOwner(item.owner, household));
  });
  (input.bills || []).forEach((item) => {
    pushSeed(item.owner, inferHolderFromOwner(item.owner, household));
  });
  (input.transactions || []).forEach((item) => {
    pushSeed(item.owner, inferHolderFromOwner(item.owner, household));
  });
  (input.sharedExpenses || []).forEach((item) => {
    pushSeed(item.paidBy || item.owner, inferHolderFromOwner(item.paidBy || item.owner, household));
  });
  (input.savingsGoals || []).forEach((item) => {
    const shared = textValue(item.scope) === "shared" || textValue(item.owner) === getSharedOwnerValueFromHousehold(household);
    pushSeed(item.owner, shared ? ACCOUNT_HOLDERS.shared : inferHolderFromOwner(item.owner, household), "savings");
    pushSeed(item.sourceOwner, inferHolderFromOwner(item.sourceOwner, household));
  });
  (input.transfers || []).forEach((item) => {
    pushSeed(item.fromOwner, inferHolderFromOwner(item.fromOwner, household));
    pushSeed(item.toOwner, inferHolderFromOwner(item.toOwner, household));
  });

  return seeds;
}

function sanitizeAccounts(inputAccounts, household, legacyCurrentBalance, referencedSeeds = []) {
  const defaults = createAccountsForHousehold(household, legacyCurrentBalance);
  const rawAccounts = Array.isArray(inputAccounts) ? inputAccounts : [];
  const sanitized = rawAccounts
    .map((account) => sanitizeAccount(account, household))
    .filter((account) => textValue(account.owner))
    .filter((account) => textValue(account.id) !== "account_shared");
  const merged = defaults.map((defaultAccount) => {
    const existingIndex = sanitized.findIndex(
      (account) => account.id === defaultAccount.id || textValue(account.owner) === defaultAccount.owner
    );
    if (existingIndex < 0) {
      return defaultAccount;
    }

    const existing = sanitized.splice(existingIndex, 1)[0];
    return {
      ...defaultAccount,
      ...existing,
      holder: sanitizeAccountHolder(existing.holder, household, existing.id, existing.kind, existing.owner),
      kind: sanitizeAccountKind(existing.kind),
      status: existing.status === "closed" ? "closed" : "active",
      balance: parseAmount(existing.balance),
    };
  });

  const extras = [...sanitized, ...referencedSeeds.map((seed) => sanitizeAccount(seed, household))];
  return extras.reduce((accounts, account) => {
    const ownerKey = textValue(account.owner).toLowerCase();
    if (!ownerKey) {
      return accounts;
    }
    if (
      accounts.some(
        (existing) => textValue(existing.owner).toLowerCase() === ownerKey || textValue(existing.id) === textValue(account.id)
      )
    ) {
      return accounts;
    }
    accounts.push({
      ...account,
      id: textValue(account.id) || createId(),
      balance: parseAmount(account.balance),
      status: account.status === "closed" ? "closed" : "active",
    });
    return accounts;
  }, merged.slice());
}

function sanitizeAccount(account, household) {
  const holder = sanitizeAccountHolder(account.holder, household, account.id, account.kind, account.owner);
  const fallbackOwner =
    holder === ACCOUNT_HOLDERS.shared
      ? getSharedOwnerValueFromHousehold(household)
      : holder === ACCOUNT_HOLDERS.partnerTwo
        ? household.partnerTwo || "Geneviève"
        : household.partnerOne || "Moi";

  return {
    id: textValue(account.id) || createId(),
    owner: textValue(account.owner) || fallbackOwner,
    holder,
    kind: sanitizeAccountKind(account.kind),
    status: textValue(account.status) === "closed" ? "closed" : "active",
    balance: parseAmount(account.balance),
  };
}

function sanitizeOwnedItem(item, household, accounts) {
  return {
    ...item,
    id: textValue(item.id) || createId(),
    owner: sanitizeOwnerLabel(item.owner, household, accounts, ACCOUNT_HOLDERS.partnerOne),
    label: textValue(item.label),
    frequency: textValue(item.frequency) || "monthly",
    nextDate: textValue(item.nextDate),
    date: textValue(item.date),
    endDate: textValue(item.endDate),
    category: textValue(item.category),
    notes: textValue(item.notes),
    amount: parseAmount(item.amount),
  };
}

function sanitizeSavingsGoal(item, household, accounts) {
  const requestedShared = textValue(item.scope) === "shared";
  const requestedOwner = sanitizeOwnerLabel(
    item.owner,
    household,
    accounts,
    requestedShared ? ACCOUNT_HOLDERS.shared : ACCOUNT_HOLDERS.partnerOne
  );
  const fallbackLabelAccount = getAccountByOwner(textValue(item.label), accounts);
  const requestedOwnerAccount = getAccountByOwner(requestedOwner, accounts);
  const ownerAccount =
    requestedOwnerAccount && requestedOwnerAccount.kind === "savings"
      ? requestedOwnerAccount
      : fallbackLabelAccount && fallbackLabelAccount.kind === "savings"
        ? fallbackLabelAccount
        : null;
  const owner = ownerAccount
    ? ownerAccount.owner
    : requestedOwner ||
      (requestedShared
        ? getDefaultOwnerForHolder(ACCOUNT_HOLDERS.shared, accounts, { includeClosed: true })
        : getDefaultOwnerForHolder(ACCOUNT_HOLDERS.partnerOne, accounts, { includeClosed: true })) ||
      household.partnerOne ||
      "Moi";
  const scope = requestedShared || isSharedOwner(owner, accounts) ? "shared" : "personal";
  const sourceOwner = sanitizeSavingsGoalSourceOwner(item, owner, household, accounts);
  const currentAmount = ownerAccount ? parseAmount(ownerAccount.balance) : parseAmount(item.currentAmount);

  return {
    id: textValue(item.id) || createId(),
    scope,
    owner,
    label: textValue(item.label),
    targetAmount: parseAmount(item.targetAmount),
    currentAmount,
    contributionAmount: parseAmount(item.contributionAmount),
    frequency: textValue(item.frequency) || "monthly",
    nextDate: textValue(item.nextDate),
    targetDate: textValue(item.targetDate),
    sourceOwner,
    endDate: textValue(item.endDate),
  };
}

function sanitizeTransfer(item, household, accounts) {
  return {
    id: textValue(item.id) || createId(),
    fromOwner: sanitizeOwnerLabel(item.fromOwner, household, accounts, ACCOUNT_HOLDERS.partnerOne),
    toOwner: sanitizeOwnerLabel(item.toOwner, household, accounts, ACCOUNT_HOLDERS.shared),
    label: textValue(item.label) || "Virement",
    amount: parseAmount(item.amount),
    date: textValue(item.date),
    notes: textValue(item.notes),
    settlesDebt: item.settlesDebt === true,
    source: textValue(item.source),
    externalId: textValue(item.externalId),
  };
}

function sanitizeSharedExpense(item, household, accounts) {
  const paidBy = sanitizeOwnerLabel(item.paidBy || item.owner, household, accounts, ACCOUNT_HOLDERS.partnerOne);
  const payerAccount = getAccountByOwner(paidBy, accounts);
  const payerHolder = payerAccount ? payerAccount.holder : sanitizeAccountHolder(item.payerHolder, household, "", "", paidBy);
  const defaultShare = isSharedHolder(payerHolder) ? 0 : 50;

  return {
    id: textValue(item.id) || createId(),
    label: textValue(item.label),
    amount: parseAmount(item.amount),
    date: textValue(item.date),
    paidBy,
    payerHolder,
    sharePercent: Math.max(0, Math.min(parseAmount(item.sharePercent) || defaultShare, 100)),
    notes: textValue(item.notes),
  };
}

function sanitizeActivityLogEntry(entry) {
  const title = textValue(entry && entry.title);
  if (!title) {
    return null;
  }

  const tone = textValue(entry.tone) || "neutral";
  return {
    id: textValue(entry.id) || createId(),
    title,
    detail: textValue(entry.detail),
    createdAt: textValue(entry.createdAt) || new Date().toISOString(),
    tone: tone === "warning" || tone === "critical" || tone === "success" ? tone : "neutral",
  };
}

function buildSavingsGoalAccountSeeds(goals, household, accounts) {
  return (goals || []).reduce((seeds, goal) => {
    const label = textValue(goal.label);
    if (!label) {
      return seeds;
    }

    const requestedOwner = textValue(goal.owner);
    const existingOwnerAccount = getAccountByOwner(requestedOwner, accounts);
    const sameLabelAccount = getAccountByOwner(label, accounts);
    if ((existingOwnerAccount && existingOwnerAccount.kind === "savings") || sameLabelAccount) {
      return seeds;
    }

    seeds.push({
      id: "",
      owner: label,
      holder: textValue(goal.scope) === "shared" ? ACCOUNT_HOLDERS.shared : inferHolderFromOwner(requestedOwner, household),
      kind: "savings",
      status: "active",
      balance: parseAmount(goal.currentAmount),
    });
    return seeds;
  }, []);
}

function createAccountsForHousehold(household, legacyCurrentBalance = 0) {
  return [
    {
      id: ACCOUNT_IDS.partnerOne,
      owner: household.partnerOne || "Moi",
      holder: ACCOUNT_HOLDERS.partnerOne,
      kind: "checking",
      status: "active",
      balance: parseAmount(legacyCurrentBalance),
    },
    {
      id: ACCOUNT_IDS.partnerTwo,
      owner: household.partnerTwo || "Geneviève",
      holder: ACCOUNT_HOLDERS.partnerTwo,
      kind: "checking",
      status: "active",
      balance: 0,
    },
  ];
}

function sanitizeAccountHolder(holder, household, accountId = "", legacyKind = "", owner = "") {
  const value = textValue(holder);
  if (value === ACCOUNT_HOLDERS.partnerOne || value === ACCOUNT_HOLDERS.partnerTwo || value === ACCOUNT_HOLDERS.shared) {
    return value;
  }
  if (accountId === ACCOUNT_IDS.partnerOne) {
    return ACCOUNT_HOLDERS.partnerOne;
  }
  if (accountId === ACCOUNT_IDS.partnerTwo) {
    return ACCOUNT_HOLDERS.partnerTwo;
  }
  if (textValue(legacyKind) === "shared" || textValue(owner) === "Compte commun") {
    return ACCOUNT_HOLDERS.shared;
  }
  return inferHolderFromOwner(owner, household);
}

function sanitizeAccountKind(kind) {
  const value = textValue(kind);
  if (value === "checking" || value === "savings" || value === "other") {
    return value;
  }
  return "checking";
}

function inferHolderFromOwner(owner, household) {
  const value = textValue(owner);
  const partnerOne = textValue(household.partnerOne);
  const partnerTwo = textValue(household.partnerTwo);
  const shared = textValue(household.householdName);
  if (!value) {
    return ACCOUNT_HOLDERS.partnerOne;
  }
  if (value === "Compte commun" || value === shared) {
    return ACCOUNT_HOLDERS.shared;
  }
  if (value === partnerTwo) {
    return ACCOUNT_HOLDERS.partnerTwo;
  }
  if (value === partnerOne) {
    return ACCOUNT_HOLDERS.partnerOne;
  }
  if (partnerTwo && value.toLowerCase().includes(partnerTwo.toLowerCase())) {
    return ACCOUNT_HOLDERS.partnerTwo;
  }
  if (partnerOne && value.toLowerCase().includes(partnerOne.toLowerCase())) {
    return ACCOUNT_HOLDERS.partnerOne;
  }
  return ACCOUNT_HOLDERS.partnerOne;
}

function sanitizeOwnerLabel(owner, household, accounts, fallbackHolder = ACCOUNT_HOLDERS.partnerOne) {
  const value = textValue(owner);
  const sharedOwner = getDefaultOwnerForHolder(ACCOUNT_HOLDERS.shared, accounts, { includeClosed: true });
  const fallbackOwner =
    getDefaultOwnerForHolder(fallbackHolder, accounts, { includeClosed: true }) ||
    getDefaultOwnerForHolder(ACCOUNT_HOLDERS.partnerOne, accounts, { includeClosed: true }) ||
    household.partnerOne ||
    "Moi";
  if (value === "Compte commun") {
    return sharedOwner || fallbackOwner;
  }
  if (!value) {
    return fallbackOwner;
  }

  const existing = getAccountByOwner(value, accounts);
  if (existing) {
    return existing.owner;
  }
  if (value === household.householdName) {
    return sharedOwner || fallbackOwner;
  }
  return value;
}

function getSharedOwnerValueFromHousehold(household) {
  return household.householdName || "Budget du foyer";
}

function getSharedOwnerValue() {
  return getDefaultOwnerForHolder(ACCOUNT_HOLDERS.shared, state.accounts, { includeClosed: true }) || "";
}

function formatAccountHolder(holder) {
  if (holder === ACCOUNT_HOLDERS.shared) {
    return "Commun";
  }
  if (holder === ACCOUNT_HOLDERS.partnerTwo) {
    return state.household.partnerTwo || "Geneviève";
  }
  return state.household.partnerOne || "Moi";
}

function isSharedHolder(holder) {
  return holder === ACCOUNT_HOLDERS.shared;
}

function isSharedOwner(owner, accounts = state.accounts) {
  return isSharedHolder(getAccountByOwner(owner, accounts)?.holder);
}

function formatOwnerLabel(owner) {
  return textValue(owner) || "-";
}

function getAccountByOwner(owner, accounts = state.accounts) {
  return (accounts || []).find((account) => account.owner === owner) || null;
}

function getAccountBalance(owner, accounts = state.accounts) {
  const account = getAccountByOwner(owner, accounts);
  return account ? account.balance || 0 : 0;
}

function getTotalCurrentBalance(accounts = state.accounts) {
  return sumBy(accounts || [], (account) => account.balance || 0);
}

function syncCurrentBalance() {
  state.household.currentBalance = getTotalCurrentBalance();
}

function roundCurrency(value) {
  return Math.round((value || 0) * 100) / 100;
}

function getSavingsGoalCurrentAmount(goal) {
  const account = getAccountByOwner(goal.owner);
  return account && account.kind === "savings" ? parseAmount(account.balance) : parseAmount(goal.currentAmount);
}

function isSavingsGoalAccount(goal, accounts = state.accounts) {
  const account = getAccountByOwner(goal.owner, accounts);
  return Boolean(account && account.kind === "savings");
}

function resolveSavingsGoalSourceOwner(goal, accounts = state.accounts) {
  const explicitSource = textValue(goal.sourceOwner);
  if (explicitSource && explicitSource !== goal.owner && getAccountByOwner(explicitSource, accounts)) {
    return explicitSource;
  }
  return getDefaultSavingsSourceOwner(goal.owner, accounts, { includeClosed: true });
}

function sanitizeSavingsGoalSourceOwner(item, owner, household, accounts) {
  const targetAccount = getAccountByOwner(owner, accounts);
  const fallbackHolder =
    targetAccount?.holder ||
    (textValue(item.scope) === "shared" ? ACCOUNT_HOLDERS.shared : inferHolderFromOwner(owner, household));
  const requestedSource = textValue(item.sourceOwner)
    ? sanitizeOwnerLabel(item.sourceOwner, household, accounts, fallbackHolder)
    : "";
  if (requestedSource && requestedSource !== owner) {
    return requestedSource;
  }
  return getDefaultSavingsSourceOwner(owner, accounts, { includeClosed: true });
}

function getSavingsGoalMonthlyContributionForSelection(goal, selection) {
  const contributionAmount = parseAmount(goal.contributionAmount);
  if (!contributionAmount) {
    return 0;
  }

  if (!isSavingsGoalAccount(goal)) {
    return projectionSelectionMatchesOwner(selection, goal.owner)
      ? monthlyAmount(contributionAmount, goal.frequency)
      : 0;
  }

  const sourceOwner = resolveSavingsGoalSourceOwner(goal);
  if (
    !projectionSelectionMatchesOwner(selection, goal.owner) &&
    !projectionSelectionMatchesOwner(selection, sourceOwner)
  ) {
    return 0;
  }

  return monthlyAmount(contributionAmount, goal.frequency);
}

function getSavingsGoalMonthlyNetForSelection(goal, selection) {
  const contributionAmount = parseAmount(goal.contributionAmount);
  if (!contributionAmount) {
    return 0;
  }

  const monthlyContribution = monthlyAmount(contributionAmount, goal.frequency);
  if (!isSavingsGoalAccount(goal)) {
    return projectionSelectionMatchesOwner(selection, goal.owner) ? -monthlyContribution : 0;
  }

  const sourceOwner = resolveSavingsGoalSourceOwner(goal);
  const sourceIncluded = sourceOwner ? projectionSelectionMatchesOwner(selection, sourceOwner) : false;
  const targetIncluded = projectionSelectionMatchesOwner(selection, goal.owner);
  if (sourceIncluded === targetIncluded) {
    return 0;
  }
  return targetIncluded ? monthlyContribution : -monthlyContribution;
}

function buildSavingsGoalProjectionEvents(goal, selection, start, end) {
  const contributionAmount = parseAmount(goal.contributionAmount);
  if (!contributionAmount || !goal.nextDate) {
    return [];
  }

  if (!isSavingsGoalAccount(goal)) {
    return projectionSelectionMatchesOwner(selection, goal.owner)
      ? expandRecurring(goal, "saving", -contributionAmount, start, end)
      : [];
  }

  const sourceOwner = resolveSavingsGoalSourceOwner(goal);
  const sourceIncluded = sourceOwner ? projectionSelectionMatchesOwner(selection, sourceOwner) : false;
  const targetIncluded = projectionSelectionMatchesOwner(selection, goal.owner);
  if (sourceIncluded === targetIncluded) {
    return [];
  }
  if (targetIncluded) {
    return expandRecurring(goal, "saving", contributionAmount, start, end);
  }
  return expandRecurring({ ...goal, owner: sourceOwner }, "saving", -contributionAmount, start, end);
}

function expandSavingsGoalCalendarEvents(goal, start, end) {
  const contributionAmount = parseAmount(goal.contributionAmount);
  if (!contributionAmount || !goal.nextDate) {
    return [];
  }

  if (!isSavingsGoalAccount(goal)) {
    return expandRecurring(goal, "saving", -contributionAmount, start, end);
  }

  const sourceOwner = resolveSavingsGoalSourceOwner(goal);
  if (!sourceOwner || sourceOwner === goal.owner) {
    return expandRecurring(goal, "saving", -contributionAmount, start, end);
  }

  return expandRecurring({ ...goal, owner: sourceOwner }, "saving", 0, start, end).map((event) => ({
    id: event.id,
    label: goal.label || "Épargne planifiée",
    date: event.date,
    amount: contributionAmount,
    kind: "transfer",
    fromOwner: sourceOwner,
    toOwner: goal.owner,
  }));
}

function calculateSharedExpenseDebt(item) {
  const payerAccount = getAccountByOwner(item.paidBy);
  const payerHolder = item.payerHolder || payerAccount?.holder || ACCOUNT_HOLDERS.partnerOne;
  if (isSharedHolder(payerHolder)) {
    return null;
  }

  const debtAmount = roundCurrency((parseAmount(item.amount) * parseAmount(item.sharePercent)) / 100);
  if (debtAmount <= 0) {
    return null;
  }

  if (payerHolder === ACCOUNT_HOLDERS.partnerOne) {
    return {
      fromHolder: ACCOUNT_HOLDERS.partnerTwo,
      toHolder: ACCOUNT_HOLDERS.partnerOne,
    fromOwner: getDefaultOwnerForHolder(ACCOUNT_HOLDERS.partnerTwo) || state.household.partnerTwo || "Geneviève",
      toOwner: getDefaultOwnerForHolder(ACCOUNT_HOLDERS.partnerOne) || state.household.partnerOne || "Moi",
      amount: debtAmount,
    };
  }

  return {
    fromHolder: ACCOUNT_HOLDERS.partnerOne,
    toHolder: ACCOUNT_HOLDERS.partnerTwo,
    fromOwner: getDefaultOwnerForHolder(ACCOUNT_HOLDERS.partnerOne) || state.household.partnerOne || "Moi",
    toOwner: getDefaultOwnerForHolder(ACCOUNT_HOLDERS.partnerTwo) || state.household.partnerTwo || "Geneviève",
    amount: debtAmount,
  };
}

function computeSharedDebtSummary() {
  let net = 0;

  state.sharedExpenses.forEach((item) => {
    const debt = calculateSharedExpenseDebt(item);
    if (!debt) {
      return;
    }
    if (debt.fromHolder === ACCOUNT_HOLDERS.partnerOne) {
      net += debt.amount;
      return;
    }
    net -= debt.amount;
  });

  state.transfers.forEach((item) => {
    if (!item.settlesDebt) {
      return;
    }

    const amount = Math.abs(parseAmount(item.amount));
    if (!amount) {
      return;
    }

    const fromAccount = getAccountByOwner(item.fromOwner);
    const toAccount = getAccountByOwner(item.toOwner);
    const fromHolder = fromAccount?.holder || inferHolderFromOwner(item.fromOwner, state.household);
    const toHolder = toAccount?.holder || inferHolderFromOwner(item.toOwner, state.household);
    if (isSharedHolder(fromHolder) || isSharedHolder(toHolder) || fromHolder === toHolder) {
      return;
    }

    if (fromHolder === ACCOUNT_HOLDERS.partnerOne && toHolder === ACCOUNT_HOLDERS.partnerTwo) {
      net -= amount;
      return;
    }

    if (fromHolder === ACCOUNT_HOLDERS.partnerTwo && toHolder === ACCOUNT_HOLDERS.partnerOne) {
      net += amount;
    }
  });

  net = roundCurrency(net);
  return {
    partnerOneOwes: net > 0 ? net : 0,
    partnerTwoOwes: net < 0 ? Math.abs(net) : 0,
    net,
  };
}

function getAccountsByHolder(holder, options = {}) {
  const includeClosed = options.includeClosed === true;
  return (state.accounts || []).filter((account) => {
    if (!includeClosed && account.status === "closed") {
      return false;
    }
    if (holder === "personal") {
      return !isSharedHolder(account.holder);
    }
    return !holder || account.holder === holder;
  });
}

function getActiveAccounts() {
  return getAccountsByHolder("", { includeClosed: false });
}

function getDefaultOwnerForHolder(holder, accounts = state.accounts, options = {}) {
  const includeClosed = options.includeClosed === true;
  const list = (accounts || []).filter((account) => {
    if (!includeClosed && account.status === "closed") {
      return false;
    }
    if (holder === "personal") {
      return !isSharedHolder(account.holder);
    }
    return account.holder === holder;
  });
  const preferredId =
    holder === ACCOUNT_HOLDERS.partnerOne
      ? ACCOUNT_IDS.partnerOne
      : holder === ACCOUNT_HOLDERS.partnerTwo
        ? ACCOUNT_IDS.partnerTwo
        : "";
  return (list.find((account) => account.id === preferredId) || list[0] || {}).owner || "";
}

function getFirstActiveOwner(accounts = state.accounts) {
  return ((accounts || []).find((account) => account.status !== "closed") || {}).owner || "";
}

function getAlternativeOwner(owner) {
  return (getActiveAccounts().find((account) => account.owner !== owner) || {}).owner || "";
}

function getOwnerOptions(options = {}) {
  const includeClosed = options.includeClosed === true;
  const holder = options.holder || "";
  const accounts = (includeClosed ? state.accounts : getActiveAccounts()).filter((account) => {
    if (holder === "personal") {
      return !isSharedHolder(account.holder);
    }
    return !holder || account.holder === holder;
  });

  return accounts.map((account) => ({
    value: account.owner,
    label: account.owner,
  }));
}

function readOwnerWithFallback(value, fallbackHolder) {
  return (
    textValue(value) ||
    getDefaultOwnerForHolder(fallbackHolder) ||
    getFirstActiveOwner() ||
    state.household.partnerOne ||
    "Moi"
  );
}

function hasPlannedActivityForAccount(owner) {
  const today = startOfDay(new Date());
  const recurringStillActive = (item) => {
    const nextDate = parseDate(item.nextDate);
    if (Number.isNaN(nextDate.getTime())) {
      return false;
    }
    if (!item.endDate) {
      return true;
    }
    return parseDate(item.endDate) >= today;
  };

  return (
    state.paychecks.some((item) => item.owner === owner && recurringStillActive(item)) ||
    state.bills.some((item) => item.owner === owner && recurringStillActive(item)) ||
    state.savingsGoals.some(
      (item) =>
        item.owner === owner &&
        (parseAmount(item.currentAmount) > 0 ||
          parseAmount(item.targetAmount) > 0 ||
          (parseAmount(item.contributionAmount) > 0 && recurringStillActive(item)))
    ) ||
    state.sharedExpenses.some((item) => item.paidBy === owner && parseDate(item.date) >= today) ||
    state.transactions.some((item) => item.owner === owner && parseDate(item.date) >= today) ||
    state.transfers.some(
      (item) => (item.fromOwner === owner || item.toOwner === owner) && parseDate(item.date) >= today
    )
  );
}

function renderSelectOptions(select, options, preferredValue) {
  if (!select) {
    return;
  }

  const nextOptions = options.slice();
  if (preferredValue && !nextOptions.some((option) => option.value === preferredValue)) {
    const account = getAccountByOwner(preferredValue, state.accounts);
    nextOptions.push({
      value: preferredValue,
      label: account && account.status === "closed" ? `${preferredValue} (fermé)` : preferredValue,
    });
  }

  select.innerHTML = nextOptions
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");

  const fallbackValue = nextOptions[0] ? nextOptions[0].value : "";
  const nextValue = nextOptions.some((option) => option.value === preferredValue) ? preferredValue : fallbackValue;
  if (nextValue) {
    select.value = nextValue;
  }
}

function getOwners() {
  return getActiveAccounts().map((account) => account.owner);
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
  return cloneDefaults();
}



