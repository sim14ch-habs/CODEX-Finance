const STORAGE_KEY = "budget-duo-v2";
const LOCAL_BACKUP_STORAGE_KEY = "budget-duo-v2-local-backup";
const ACCOUNT_IDS = {
  partnerOne: "account_partner_one",
  partnerTwo: "account_partner_two",
  shared: "account_shared",
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

const DEFAULT_STATE = {
  household: {
    householdName: "Budget Simon",
    partnerOne: "Simon",
    partnerTwo: "Geneviève",
    currency: "CAD",
    currentBalance: 998,
    projectionMonths: 6,
    safetyBuffer: 1500,
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
      id: ACCOUNT_IDS.shared,
      owner: "Budget Simon",
      holder: ACCOUNT_HOLDERS.shared,
      kind: "checking",
      status: "active",
      balance: 0,
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
      owner: "Simon",
      label: "Fonds d'urgence",
      targetAmount: 1500,
      currentAmount: 300,
      contributionAmount: 300,
      frequency: "monthly",
      nextDate: "2026-04-09",
      targetDate: "2026-09-01",
    },
  ],
  transactions: [],
  transfers: [],
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

const CLOUD_SYNC_DELAY_MS = 500;

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
  const accounts = sanitizeAccounts(input.accounts, household, household.currentBalance, referencedAccountSeeds);
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
    transactions: Array.isArray(input.transactions)
      ? input.transactions.map((item) => sanitizeOwnedItem(item, household, accounts))
      : [],
    transfers: Array.isArray(input.transfers)
      ? input.transfers.map((item) => sanitizeTransfer(item, household, accounts))
      : [],
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
  $("transactionForm").addEventListener("submit", (event) =>
    upsertCollection(event, "transactions", readTransactionForm)
  );
  $("transferForm").addEventListener("submit", (event) =>
    upsertCollection(event, "transfers", readTransferForm)
  );
  $("goalPlannerForm").addEventListener("submit", handleGoalPlannerSubmit);

  document.querySelectorAll(".form-reset").forEach((button) => {
    button.addEventListener("click", () => resetForm(button.dataset.form));
  });

  $("loadDemoBtn").addEventListener("click", () => {
    state = createDemoState();
    persistState();
    renderAll();
  });

  $("resetBtn").addEventListener("click", () => {
    if (!window.confirm("Supprimer toutes les données locales de ce tableau de bord ?")) {
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
  $("goalPlannerUseBtn").addEventListener("click", applyGoalPlannerToSavings);
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
    {
      id: ACCOUNT_IDS.shared,
      nextOwner: textValue(formData.get("householdName")) || "Budget du foyer",
      holder: ACCOUNT_HOLDERS.shared,
      previousOwner:
        state.accounts.find((account) => account.id === ACCOUNT_IDS.shared)?.owner ||
        getSharedOwnerValueFromHousehold(state.household),
    },
  ];
  state.household = {
    householdName: textValue(formData.get("householdName")) || "Budget du foyer",
    partnerOne: textValue(formData.get("partnerOne")) || "Moi",
    partnerTwo: textValue(formData.get("partnerTwo")) || "Geneviève",
    currency: textValue(formData.get("currency")) || "CAD",
    currentBalance: getTotalCurrentBalance(),
    projectionMonths: parseInt(formData.get("projectionMonths"), 10) || 6,
    safetyBuffer: parseAmount(formData.get("safetyBuffer")),
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
  updateSavingsFormOwnership();
}

function saveAccount(event) {
  event.preventDefault();
  const account = readAccountForm(new FormData(event.currentTarget));
  if (!account) {
    return;
  }

  const index = state.accounts.findIndex((entry) => entry.id === account.id);
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

  state.bills = [...state.bills, ...missingBills];
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

  if (!label) {
    window.alert("Merci de donner un nom à votre objectif d'épargne.");
    return null;
  }

  if (contributionAmount > 0 && !nextDate) {
    window.alert("Ajoutez une prochaine date pour projeter cette contribution.");
    return null;
  }

  return {
    id: textValue(formData.get("id")) || createId(),
    scope,
    owner: readOwner(formData, scope === "shared" ? ACCOUNT_HOLDERS.shared : "personal"),
    label,
    targetAmount: parseAmount(formData.get("targetAmount")),
    currentAmount: parseAmount(formData.get("currentAmount")),
    contributionAmount,
    frequency: textValue(formData.get("frequency")) || "monthly",
    nextDate,
    targetDate,
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
  };
}

function readOwner(formData, fallbackHolder = ACCOUNT_HOLDERS.partnerOne) {
  return readOwnerWithFallback(textValue(formData.get("owner")), fallbackHolder);
}

function readSavingsScope(formData) {
  return textValue(formData.get("scope")) === "shared" ? "shared" : "personal";
}

function getCloudConfig() {
  const rawConfig = window.BUDGET_DUO_SUPABASE || {};
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
      "Un lien magique sera envoye par email."
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
    setCloudStatus("error", "Le lien magique n'a pas pu etre envoye.", error.message || "");
    renderAll();
    return;
  }

  setCloudStatus(
    "auth",
    "Lien magique envoye.",
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
    setCloudStatus("error", "Le foyer cloud n'a pas pu etre cree.", error.message || "");
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
    auth: "Cloud pret",
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

  state = sanitizeState(snapshot.budgetState);
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

function renderAll() {
  populateHouseholdForm();
  renderBalanceLabels();
  renderAccountHolderOptions();
  renderOwnerSelects();
  seedFormDefaults();
  updateSavingsFormOwnership();
  renderCloudPanel();
  renderGoalPlanner();
  renderStats();
  renderAlerts();
  renderProjection();
  renderCalendar();
  renderContributors();
  renderAccountsTable();
  renderTables();
  renderMobileSections();
}

function populateHouseholdForm() {
  const form = $("householdForm");
  form.elements.householdName.value = state.household.householdName || "";
  form.elements.partnerOne.value = state.household.partnerOne || "";
  form.elements.partnerTwo.value = state.household.partnerTwo || "";
  form.elements.currency.value = state.household.currency || "CAD";
  form.elements.projectionMonths.value = String(state.household.projectionMonths || 6);
  form.elements.safetyBuffer.value = state.household.safetyBuffer || "";
}

function renderOwnerSelects() {
  document.querySelectorAll(".owner-select").forEach((select) => {
    const previous = select.value;
    if (select.id === "savingsOwnerSelect") {
      return;
    }
    renderSelectOptions(select, getOwnerOptions(), previous);
  });
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
    renderSelectOptions(ownerField, getOwnerOptions({ holder: ACCOUNT_HOLDERS.shared }), previousOwner);
    ownerField.disabled = false;
    if (hint) {
      hint.textContent = "Choisissez le compte commun à utiliser pour cette épargne, même si vous en avez plusieurs.";
    }
    return;
  }

  renderSelectOptions(ownerField, getOwnerOptions({ holder: "personal" }), previousOwner);
  ownerField.disabled = false;

  if (!ownerField.value) {
    ownerField.value = getDefaultOwnerForHolder(ACCOUNT_HOLDERS.partnerOne) || getFirstActiveOwner() || "";
  }

  if (hint) {
    hint.textContent = "Choisissez le compte personnel qui porte cette épargne. Les comptes communs passent par le type Commune.";
  }
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

  if (lowestCombined && state.household.safetyBuffer && lowestCombined.balance < state.household.safetyBuffer) {
    alerts.push({
      tone: lowestCombined.balance < 0 ? "critical" : "warning",
      label: lowestCombined.balance < 0 ? "Critique" : "Surveillance",
      title: lowestCombined.balance < 0 ? "Le total passe sous zéro" : "Le coussin de sécurité est entamé",
      message:
        lowestCombined.balance < 0
          ? `Le total projeté tomberait à ${formatCurrency(lowestCombined.balance)} le ${formatDate(lowestCombined.date)}.`
          : `Le total toucherait ${formatCurrency(lowestCombined.balance)} le ${formatDate(lowestCombined.date)}, sous le coussin cible.`,
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

  return alerts.slice(0, 6);
}

function renderStats() {
  const metrics = computeMetrics();
  const totalBalance = getTotalCurrentBalance();
  const sharedAccounts = getAccountsByHolder(ACCOUNT_HOLDERS.shared);
  const sharedBalance = sumBy(sharedAccounts, (account) => account.balance || 0);
  const alerts = collectAlerts();
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
  renderTable("savingsTable", state.savingsGoals, 7, renderSavingsRow);
  renderTable("transfersTable", state.transfers.slice().sort(sortByDateDesc), 6, renderTransferRow);
  renderTable("transactionsTable", state.transactions.slice().sort(sortByDateDesc), 6, renderTransactionRow);
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

function renderAccountRow(account) {
  const statusTone = account.status === "closed" ? "neutral" : "success";
  const kindLabel = ACCOUNT_KIND_LABELS[account.kind] || account.kind;
  const holderLabel = formatAccountHolder(account.holder);
  const ownerNote = account.id === ACCOUNT_IDS.shared ? "Compte principal du foyer" : "";
  return `
    <tr>
      <td>
        <div>${escapeHtml(account.owner)}</div>
        ${ownerNote ? `<small>${escapeHtml(ownerNote)}</small>` : ""}
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
  const currentAmount = item.currentAmount || 0;
  const targetAmount = item.targetAmount || 0;
  const progress = targetAmount ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const contributionLabel = item.contributionAmount
    ? `${formatCurrency(item.contributionAmount)} / ${FREQUENCY_LABELS[item.frequency] || item.frequency}`
    : "Aucune";
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
      <td>${escapeHtml(contributionLabel)}</td>
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

function renderActions(collection, id) {
  return `
    <div class="table-actions">
      <button class="table-button edit" type="button" data-action="edit" data-collection="${escapeHtml(collection)}" data-id="${escapeHtml(id)}">Modifier</button>
      <button class="table-button delete" type="button" data-action="delete" data-collection="${escapeHtml(collection)}" data-id="${escapeHtml(id)}">Supprimer</button>
    </div>
  `;
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
    accounts: "accountForm",
    paychecks: "paycheckForm",
    bills: "billForm",
    savingsGoals: "savingsForm",
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
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function toggleAccountStatus(id) {
  const index = state.accounts.findIndex((account) => account.id === id);
  if (index < 0) {
    return;
  }

  const account = state.accounts[index];
  if (account.status === "closed") {
    state.accounts[index] = { ...account, status: "active" };
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

  state.accounts[index] = { ...account, status: "closed" };
  persistState();
  renderAll();
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
    : formatCurrency(getTotalCurrentBalance());
  $("heroProjectedCaption").textContent = `A ${state.household.projectionMonths || 6} mois.`;
  $("heroNextIncome").textContent = nextIncome ? formatDate(nextIncome.date) : "Aucune";
  $("heroNextBill").textContent = nextBill ? formatDate(nextBill.date) : "Aucune";
  $("netMonthlyStat").textContent = formatCurrency(metrics.monthlyNet);
  $("netMonthlyCaption").textContent =
    metrics.monthlyNet >= 0 ? "Les récurrents vont dans le bon sens." : "Le rythme doit être ajusté.";
  $("lowestBalanceStat").textContent = lowestPoint
    ? formatCurrency(lowestPoint.balance)
    : formatCurrency(getTotalCurrentBalance());
  $("lowestBalanceCaption").textContent = lowestPoint
    ? lowestPoint.balance < 0
      ? `Passage sous zéro le ${formatDate(lowestPoint.date)}.`
      : `Creux attendu le ${formatDate(lowestPoint.date)}.`
    : "Aucune alerte pour l'instant.";
  $("projectionSummary").textContent = lastPoint
    ? `De ${formatCurrency(getTotalCurrentBalance())} à ${formatCurrency(lastPoint.balance)} sur l'horizon choisi.`
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
    : "<li><div><strong>Aucun mouvement à venir</strong><small>Ajoutez des paies, factures ou virements.</small></div></li>";

  drawProjectionChart(projection.points, state.household.safetyBuffer);
}

function renderCalendar() {
  const grid = $("calendarGrid");
  const label = $("calendarMonthLabel");
  if (!grid || !label) {
    return;
  }

  const monthStart = startOfMonth(calendarUiState.monthCursor || new Date());
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfCalendarGrid(monthStart);
  const eventsByDate = new Map();

  collectCalendarEvents(monthStart, monthEnd).forEach((event) => {
    const key = formatInputDate(event.date);
    if (!eventsByDate.has(key)) {
      eventsByDate.set(key, []);
    }
    eventsByDate.get(key).push(event);
  });

  label.textContent = monthStart.toLocaleDateString("fr-CA", { month: "long", year: "numeric" });

  const days = [];
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
    cursor = addDays(cursor, 1);
  }

  grid.innerHTML = days.join("");
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
    : formatOwnerLabel(event.owner);

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
            </article>
          `
        )
        .join("")
    : `<article class="empty-state">Ajoute au moins un compte actif pour suivre les projections par compte.</article>`;
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

  return {
    monthlyIncome,
    monthlyBills,
    monthlySavings,
    monthlyPersonalSavings,
    monthlySharedSavings,
    monthlyNet: monthlyIncome - monthlyBills - monthlySavings,
  };
}

function computeOwnerMetrics() {
  return getActiveAccounts().map((account) => {
    const owner = account.owner;
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
      income,
      bills,
      savings,
      net: income - bills - savings,
      note: shared
        ? `${ACCOUNT_KIND_LABELS[account.kind] || account.kind} commun projeté sur ${state.household.projectionMonths || 6} mois.`
        : `${ACCOUNT_KIND_LABELS[account.kind] || account.kind} de ${formatAccountHolder(account.holder)} projeté sur ${state.household.projectionMonths || 6} mois.`,
    };
  });
}

function buildProjection(months, ownerFilter = null) {
  const start = startOfDay(new Date());
  const end = addMonthsClamped(start, months);
  const events = [];
  const matchesOwner = (item) => !ownerFilter || item.owner === ownerFilter;

  state.paychecks.filter(matchesOwner).forEach((item) => {
    events.push(...expandRecurring(item, "income", item.amount, start, end));
  });
  state.bills.filter(matchesOwner).forEach((item) => {
    events.push(...expandRecurring(item, "bill", -item.amount, start, end));
  });
  state.savingsGoals.filter(matchesOwner).forEach((item) => {
    if (item.contributionAmount > 0 && item.nextDate) {
      events.push(...expandRecurring(item, "saving", -item.contributionAmount, start, end));
    }
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
    if (!ownerFilter) {
      return;
    }
    if (item.fromOwner === ownerFilter) {
      events.push({
        id: item.id,
        label: item.label || `Virement vers ${formatOwnerLabel(item.toOwner)}`,
        owner: item.fromOwner,
        date,
        delta: -Math.abs(item.amount || 0),
        kind: "transfer",
      });
    }
    if (item.toOwner === ownerFilter) {
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

  let runningBalance = ownerFilter ? getAccountBalance(ownerFilter) : getTotalCurrentBalance();
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
  const order = { income: 0, transfer: 1, saving: 2, bill: 3 };
  return (order[a.kind] ?? 9) - (order[b.kind] ?? 9);
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

function buildGoalPlannerResult(formData) {
  const label = textValue(formData.get("label")) || "Nouveau but";
  const owner = textValue(formData.get("owner")) || getDefaultOwnerForHolder(ACCOUNT_HOLDERS.partnerOne) || getFirstActiveOwner() || "Moi";
  const targetAmount = parseAmount(formData.get("targetAmount"));
  const currentAmount = parseAmount(formData.get("currentAmount"));
  const startDate = textValue(formData.get("startDate"));
  const targetDate = textValue(formData.get("targetDate"));
  const frequency = textValue(formData.get("frequency")) || "monthly";

  if (!targetAmount || !startDate || !targetDate) {
    window.alert("Ajoutez au minimum le montant visé, la date de début et la date cible.");
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

  const remainingAmount = Math.max(parseAmount(goal.targetAmount) - parseAmount(goal.currentAmount), 0);
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
  let currentAmount = parseAmount(goal.currentAmount);
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
  const pushSeed = (owner, holder, kind = "checking") => {
    const label = textValue(owner);
    if (!label) {
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
  (input.savingsGoals || []).forEach((item) => {
    const shared = textValue(item.scope) === "shared" || textValue(item.owner) === getSharedOwnerValueFromHousehold(household);
    pushSeed(item.owner, shared ? ACCOUNT_HOLDERS.shared : inferHolderFromOwner(item.owner, household), "savings");
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
  const sanitized = rawAccounts.map((account) => sanitizeAccount(account, household)).filter((account) => textValue(account.owner));
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
  const owner = sanitizeOwnerLabel(
    item.owner,
    household,
    accounts,
    requestedShared ? ACCOUNT_HOLDERS.shared : ACCOUNT_HOLDERS.partnerOne
  );
  const scope = requestedShared || isSharedOwner(owner, accounts) ? "shared" : "personal";

  return {
    id: textValue(item.id) || createId(),
    scope,
    owner:
      owner ||
      (scope === "shared"
        ? getDefaultOwnerForHolder(ACCOUNT_HOLDERS.shared, accounts, { includeClosed: true })
        : getDefaultOwnerForHolder(ACCOUNT_HOLDERS.partnerOne, accounts, { includeClosed: true })) ||
      household.partnerOne ||
      "Moi",
    label: textValue(item.label),
    targetAmount: parseAmount(item.targetAmount),
    currentAmount: parseAmount(item.currentAmount),
    contributionAmount: parseAmount(item.contributionAmount),
    frequency: textValue(item.frequency) || "monthly",
    nextDate: textValue(item.nextDate),
    targetDate: textValue(item.targetDate),
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
  };
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
    {
      id: ACCOUNT_IDS.shared,
      owner: getSharedOwnerValueFromHousehold(household),
      holder: ACCOUNT_HOLDERS.shared,
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
  if (accountId === ACCOUNT_IDS.shared) {
    return ACCOUNT_HOLDERS.shared;
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
  if (value === "Compte commun") {
    return getDefaultOwnerForHolder(ACCOUNT_HOLDERS.shared, accounts, { includeClosed: true }) || getSharedOwnerValueFromHousehold(household);
  }
  if (!value) {
    return (
      getDefaultOwnerForHolder(fallbackHolder, accounts, { includeClosed: true }) ||
      getDefaultOwnerForHolder(ACCOUNT_HOLDERS.partnerOne, accounts, { includeClosed: true }) ||
      household.partnerOne ||
      "Moi"
    );
  }

  const existing = getAccountByOwner(value, accounts);
  if (existing) {
    return existing.owner;
  }
  if (value === household.householdName) {
    return getDefaultOwnerForHolder(ACCOUNT_HOLDERS.shared, accounts, { includeClosed: true }) || value;
  }
  return value;
}

function getSharedOwnerValueFromHousehold(household) {
  return household.householdName || "Budget du foyer";
}

function getSharedOwnerValue() {
  return getDefaultOwnerForHolder(ACCOUNT_HOLDERS.shared, state.accounts, { includeClosed: true }) || getSharedOwnerValueFromHousehold(state.household);
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
        : holder === ACCOUNT_HOLDERS.shared
          ? ACCOUNT_IDS.shared
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
