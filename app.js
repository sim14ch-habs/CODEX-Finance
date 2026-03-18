const STORAGE_KEY = "budget-duo-v2";
const ACCOUNT_IDS = {
  partnerOne: "account_partner_one",
  partnerTwo: "account_partner_two",
  shared: "account_shared",
};

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
  accounts: [
    {
      id: ACCOUNT_IDS.partnerOne,
      owner: "Simon",
      kind: "personal",
      balance: 998,
    },
    {
      id: ACCOUNT_IDS.partnerTwo,
      owner: "Ma conjointe",
      kind: "personal",
      balance: 0,
    },
    {
      id: ACCOUNT_IDS.shared,
      owner: "Budget Simon",
      kind: "shared",
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
  const accounts = sanitizeAccounts(input.accounts, household, household.currentBalance);
  return {
    household: {
      ...household,
      currentBalance: sumBy(accounts, (account) => account.balance || 0),
    },
    accounts,
    paychecks: Array.isArray(input.paychecks)
      ? input.paychecks.map((item) => sanitizeOwnedItem(item, household))
      : [],
    bills: Array.isArray(input.bills)
      ? input.bills.map((item) => sanitizeOwnedItem(item, household))
      : [],
    savingsGoals: Array.isArray(input.savingsGoals)
      ? input.savingsGoals.map((item) => sanitizeSavingsGoal(item, household))
      : [],
    transactions: Array.isArray(input.transactions)
      ? input.transactions.map((item) => sanitizeOwnedItem(item, household))
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
}

function saveHousehold(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const previousPartnerOne = state.household.partnerOne || "Moi";
  const previousPartnerTwo = state.household.partnerTwo || "Ma conjointe";
  const previousSharedOwner = getSharedOwnerValue();
  state.household = {
    householdName: textValue(formData.get("householdName")) || "Budget du foyer",
    partnerOne: textValue(formData.get("partnerOne")) || "Moi",
    partnerTwo: textValue(formData.get("partnerTwo")) || "Ma conjointe",
    currency: textValue(formData.get("currency")) || "CAD",
    currentBalance: 0,
    projectionMonths: parseInt(formData.get("projectionMonths"), 10) || 6,
    safetyBuffer: parseAmount(formData.get("safetyBuffer")),
  };
  const nextPartnerOne = state.household.partnerOne || "Moi";
  const nextPartnerTwo = state.household.partnerTwo || "Ma conjointe";
  const nextSharedOwner = getSharedOwnerValue();
  const renameOwner = (owner) => {
    if (owner === previousPartnerOne) {
      return nextPartnerOne;
    }
    if (owner === previousPartnerTwo) {
      return nextPartnerTwo;
    }
    if (owner === previousSharedOwner) {
      return nextSharedOwner;
    }
    return owner;
  };

  ["paychecks", "bills", "transactions"].forEach((collection) => {
    state[collection] = state[collection].map((item) => ({ ...item, owner: renameOwner(item.owner) }));
  });
  state.savingsGoals = state.savingsGoals.map((item) => {
    if (item.scope === "shared" || item.owner === previousSharedOwner) {
      return { ...item, scope: "shared", owner: nextSharedOwner };
    }
    return { ...item, owner: renameOwner(item.owner) };
  });
  state.accounts = [
    {
      id: ACCOUNT_IDS.partnerOne,
      owner: nextPartnerOne,
      kind: "personal",
      balance: parseAmount(formData.get("partnerOneBalance")),
    },
    {
      id: ACCOUNT_IDS.partnerTwo,
      owner: nextPartnerTwo,
      kind: "personal",
      balance: parseAmount(formData.get("partnerTwoBalance")),
    },
    {
      id: ACCOUNT_IDS.shared,
      owner: nextSharedOwner,
      kind: "shared",
      balance: parseAmount(formData.get("sharedBalance")),
    },
  ];
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
  };
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
    owner: scope === "shared" ? getSharedOwnerValue() : readOwner(formData),
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

function readOwner(formData) {
  return textValue(formData.get("owner")) || state.household.partnerOne || "Moi";
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

        state = nextBudget;
        cloudState.lastSerializedBudget = nextSerialized;
        persistState({ skipCloud: true });
        setCloudStatus(
          "connected",
          `Foyer ${cloudState.household.household_name} synchronisé.`,
          "Une mise à jour distante vient d'être appliquée."
        );
        renderAll();
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
  state = sanitizeState(nextBudget);
  cloudState.lastSerializedBudget = JSON.stringify(state);
  cloudState.lastSyncAt = updatedAt || new Date().toISOString();
  persistState({ skipCloud: true });
  setCloudStatus(
    "connected",
    `Foyer ${cloudState.household.household_name} synchronisé.`,
    "Le budget affiché provient du cloud partagé."
  );
  renderAll();
}

function renderCloudPanel() {
  const configured = Boolean(cloudState.config);
  const connected = Boolean(cloudState.user);
  const linkedHousehold = Boolean(cloudState.household);
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

function renderAll() {
  populateHouseholdForm();
  renderBalanceLabels();
  renderOwnerSelects();
  seedFormDefaults();
  updateSavingsFormOwnership();
  renderCloudPanel();
  renderGoalPlanner();
  renderStats();
  renderAlerts();
  renderProjection();
  renderContributors();
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
  form.elements.partnerOneBalance.value = getAccountBalance(state.household.partnerOne);
  form.elements.partnerTwoBalance.value = getAccountBalance(state.household.partnerTwo);
  form.elements.sharedBalance.value = getAccountBalance(getSharedOwnerValue());
}

function renderOwnerSelects() {
  document.querySelectorAll(".owner-select").forEach((select) => {
    const previous = select.value;
    renderSelectOptions(select, getOwnerOptions(select.id === "savingsOwnerSelect" ? false : true), previous);
  });
}

function seedFormDefaults() {
  const fallbackOwner = state.household.partnerOne || "Moi";
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

  $("projectionRangeChip").textContent = `${state.household.projectionMonths || 6} mois`;
}

function renderBalanceLabels() {
  const partnerOne = state.household.partnerOne || "Moi";
  const partnerTwo = state.household.partnerTwo || "Ma conjointe";
  $("partnerOneBalanceLabel").textContent = `Solde de ${partnerOne}`;
  $("partnerTwoBalanceLabel").textContent = `Solde de ${partnerTwo}`;
  $("sharedBalanceLabel").textContent = "Solde du compte commun";
  $("householdBalanceSummary").textContent = `Total actuel: ${formatCurrency(getTotalCurrentBalance())}`;
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
    renderSelectOptions(ownerField, getOwnerOptions(true).filter((option) => option.value === getSharedOwnerValue()));
    ownerField.disabled = true;
    if (hint) {
      hint.textContent = "Cette épargne sera visible comme un compte commun, distinct de vos comptes personnels.";
    }
    return;
  }

  renderSelectOptions(ownerField, getOwnerOptions(false), previousOwner);
  ownerField.disabled = false;

  if (!ownerField.value) {
    ownerField.value = state.household.partnerOne || "Moi";
  }

  if (hint) {
    hint.textContent = "Choisissez la personne qui possède cette épargne. Les objectifs communs utilisent le type Commune.";
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
  form.elements.scope.value = result.owner === getSharedOwnerValue() ? "shared" : "personal";
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

  getOwners().forEach((owner) => {
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
  const sharedBalance = getAccountBalance(getSharedOwnerValue());
  const alerts = collectAlerts();
  const cards = [
    {
      label: "Solde total",
      value: formatCurrency(totalBalance),
      note: "Addition de tous les comptes actuels.",
      tone: totalBalance < 0 ? "negative" : "positive",
    },
    {
      label: "Compte commun",
      value: formatCurrency(sharedBalance),
      note: "Solde disponible pour le foyer partagé.",
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
  renderTable("transactionsTable", state.transactions.slice().sort(sortByDateDesc), 6, renderTransactionRow);
}

function renderTable(targetId, rows, colSpan, renderer) {
  const target = $(targetId);
  if (!rows.length) {
    target.innerHTML = `<tr><td colspan="${colSpan}" class="empty-state">Aucune donnée pour le moment.</td></tr>`;
    return;
  }

  target.innerHTML = rows.map(renderer).join("");
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
  return `
    <tr>
      <td>${escapeHtml(formatOwnerLabel(item.owner))}</td>
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
  if (collection === "savingsGoals") {
    updateSavingsFormOwnership();
  }
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

function renderContributors() {
  $("contributorsGrid").innerHTML = computeOwnerMetrics()
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
    .join("");
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
    const shared = isSharedOwner(owner);
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
        ? "Projection du compte commun et de l'épargne partagée."
        : `Solde projeté à ${state.household.projectionMonths || 6} mois.`,
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
  const owner = textValue(formData.get("owner")) || state.household.partnerOne || "Moi";
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

function sanitizeAccounts(inputAccounts, household, legacyCurrentBalance) {
  const defaults = createAccountsForHousehold(household, legacyCurrentBalance);
  if (!Array.isArray(inputAccounts) || !inputAccounts.length) {
    return defaults;
  }

  return defaults.map((defaultAccount) => {
    const existing = inputAccounts.find(
      (account) =>
        account.id === defaultAccount.id ||
        textValue(account.owner) === defaultAccount.owner ||
        (defaultAccount.kind === "shared" && textValue(account.kind) === "shared")
    );

    return {
      ...defaultAccount,
      balance: parseAmount(existing ? existing.balance : defaultAccount.balance),
    };
  });
}

function sanitizeOwnedItem(item, household) {
  return {
    ...item,
    id: textValue(item.id) || createId(),
    owner: sanitizeOwnerLabel(item.owner, household),
    label: textValue(item.label),
    frequency: textValue(item.frequency) || "monthly",
    nextDate: textValue(item.nextDate),
    date: textValue(item.date),
    category: textValue(item.category),
    notes: textValue(item.notes),
    amount: parseAmount(item.amount),
  };
}

function sanitizeSavingsGoal(item, household) {
  const owner = sanitizeOwnerLabel(item.owner, household);
  const scope = textValue(item.scope) === "shared" || owner === getSharedOwnerValueFromHousehold(household) ? "shared" : "personal";

  return {
    id: textValue(item.id) || createId(),
    scope,
    owner: scope === "shared" ? getSharedOwnerValueFromHousehold(household) : owner || household.partnerOne || "Moi",
    label: textValue(item.label),
    targetAmount: parseAmount(item.targetAmount),
    currentAmount: parseAmount(item.currentAmount),
    contributionAmount: parseAmount(item.contributionAmount),
    frequency: textValue(item.frequency) || "monthly",
    nextDate: textValue(item.nextDate),
    targetDate: textValue(item.targetDate),
  };
}

function createAccountsForHousehold(household, legacyCurrentBalance = 0) {
  return [
    {
      id: ACCOUNT_IDS.partnerOne,
      owner: household.partnerOne || "Moi",
      kind: "personal",
      balance: parseAmount(legacyCurrentBalance),
    },
    {
      id: ACCOUNT_IDS.partnerTwo,
      owner: household.partnerTwo || "Ma conjointe",
      kind: "personal",
      balance: 0,
    },
    {
      id: ACCOUNT_IDS.shared,
      owner: getSharedOwnerValueFromHousehold(household),
      kind: "shared",
      balance: 0,
    },
  ];
}

function sanitizeOwnerLabel(owner, household) {
  const value = textValue(owner);
  if (!value) {
    return household.partnerOne || "Moi";
  }
  if (value === household.partnerOne || value === household.partnerTwo || value === household.householdName) {
    return value;
  }
  if (value === "Compte commun") {
    return getSharedOwnerValueFromHousehold(household);
  }
  return value;
}

function getSharedOwnerValueFromHousehold(household) {
  return household.householdName || "Budget du foyer";
}

function getSharedOwnerValue() {
  return getSharedOwnerValueFromHousehold(state.household);
}

function isSharedOwner(owner) {
  return textValue(owner) === getSharedOwnerValue();
}

function formatOwnerLabel(owner) {
  return isSharedOwner(owner) ? "Compte commun" : textValue(owner) || "-";
}

function getAccountByOwner(owner) {
  return state.accounts.find((account) => account.owner === owner) || null;
}

function getAccountBalance(owner) {
  const account = getAccountByOwner(owner);
  return account ? account.balance || 0 : 0;
}

function getTotalCurrentBalance() {
  return sumBy(state.accounts, (account) => account.balance || 0);
}

function syncCurrentBalance() {
  state.household.currentBalance = getTotalCurrentBalance();
}

function getPersonOwners() {
  return [state.household.partnerOne || "Moi", state.household.partnerTwo || "Ma conjointe"].filter(
    (value, index, array) => value && array.indexOf(value) === index
  );
}

function getOwnerOptions(includeShared) {
  const options = getPersonOwners().map((owner) => ({ value: owner, label: owner }));
  if (includeShared) {
    options.push({ value: getSharedOwnerValue(), label: "Compte commun" });
  }
  return options;
}

function renderSelectOptions(select, options, preferredValue) {
  if (!select) {
    return;
  }

  select.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");

  const fallbackValue = options[0] ? options[0].value : "";
  const nextValue = options.some((option) => option.value === preferredValue) ? preferredValue : fallbackValue;
  if (nextValue) {
    select.value = nextValue;
  }
}

function getOwners() {
  return [...getPersonOwners(), getSharedOwnerValue()].filter(
    (value, index, array) => value && array.indexOf(value) === index
  );
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
    accounts: [
      {
        id: ACCOUNT_IDS.partnerOne,
        owner: "Simon",
        kind: "personal",
        balance: 998,
      },
      {
        id: ACCOUNT_IDS.partnerTwo,
        owner: "Ma conjointe",
        kind: "personal",
        balance: 0,
      },
      {
        id: ACCOUNT_IDS.shared,
        owner: "Budget Simon",
        kind: "shared",
        balance: 0,
      },
    ],
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
  };
}
