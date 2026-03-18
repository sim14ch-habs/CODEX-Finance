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
  expense: "Depense",
  saving: "Epargne",
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
  message: "Vos donnees restent sur cet appareil.",
  detail: "Ajoutez la configuration Supabase pour activer la synchro.",
  lastSyncAt: "",
};

const goalPlannerState = {
  result: null,
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
  return {
    household,
    paychecks: Array.isArray(input.paychecks) ? input.paychecks : [],
    bills: Array.isArray(input.bills) ? input.bills : [],
    savingsGoals: Array.isArray(input.savingsGoals)
      ? input.savingsGoals.map((item) => sanitizeSavingsGoal(item, household))
      : [],
    transactions: Array.isArray(input.transactions) ? input.transactions : [],
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
    currentBalance: parseAmount(formData.get("currentBalance")),
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
  const scope = readSavingsScope(formData);

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
    scope,
    owner: scope === "shared" ? getSharedOwnerValue() : readOwner(formData),
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
      "Vos donnees restent sur cet appareil.",
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
        `Connecte comme ${cloudState.user.email || "utilisateur"}.`,
        "Creez votre foyer cloud ou rejoignez celui de votre conjointe avec le code d'invitation."
      );
      renderAll();
      return;
    }

    setCloudStatus(
      "syncing",
      `Foyer ${household.household_name} connecte.`,
      "Lecture des donnees cloud..."
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
    `Ouvrez l'email envoye a ${email} sur votre appareil pour terminer la connexion.`
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
    window.alert("Ajoutez le code d'invitation recu.");
    return;
  }

  setCloudStatus("syncing", "Connexion au foyer cloud...", "Import des donnees partagees en cours.");
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
    "Vos donnees locales restent disponibles sur cet appareil."
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
          `Foyer ${cloudState.household.household_name} synchronise.`,
          "Une mise a jour distante vient d'etre appliquee."
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
    `Foyer ${cloudState.household.household_name} synchronise.`,
    "Les changements sont maintenant partages avec les autres appareils connectes."
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
    `Foyer ${cloudState.household.household_name} synchronise.`,
    "Le budget affiche provient du cloud partage."
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
    ? "Le budget peut etre partage et synchronise entre vos appareils."
    : "Activez Supabase pour partager le budget entre vos appareils en temps reel.";
  $("cloudFootnote").textContent = cloudState.lastSyncAt
    ? `Derniere synchro: ${formatCloudDateTime(cloudState.lastSyncAt)}`
    : "Le budget local reste disponible meme sans cloud.";

  $("cloudConfigBox").hidden = configured;
  $("cloudAuthForm").hidden = !configured || connected;
  $("cloudHouseholdBox").hidden = !configured || !connected || linkedHousehold;
  $("cloudConnectedBox").hidden = !configured || !connected || !linkedHousehold;

  if ($("cloudHouseholdNameInput") && !$("cloudHouseholdNameInput").value) {
    $("cloudHouseholdNameInput").value = state.household.householdName || "Budget du foyer";
  }

  if (configured && connected) {
    $("cloudUserEmail").textContent = cloudState.user.email || "Connecte";
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
  renderOwnerSelects();
  seedFormDefaults();
  updateSavingsFormOwnership();
  renderCloudPanel();
  renderGoalPlanner();
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
      hint.textContent = "Cette epargne sera visible comme un compte commun, distinct de vos comptes personnels.";
    }
    return;
  }

  renderSelectOptions(ownerField, getOwnerOptions(false), previousOwner);
  ownerField.disabled = false;

  if (!ownerField.value) {
    ownerField.value = state.household.partnerOne || "Moi";
  }

  if (hint) {
    hint.textContent = "Choisissez la personne qui possede cette epargne. Les objectifs communs utilisent le type Commune.";
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
    $("goalPlannerHeadline").textContent = "A calculer";
    $("goalPlannerSummary").textContent =
      "Remplissez le but, l'echeance et la frequence pour voir l'effort a fournir.";
    $("goalPlannerRemaining").textContent = "-";
    $("goalPlannerPeriods").textContent = "-";
    $("goalPlannerMonthly").textContent = "-";
    $("goalPlannerBreakdown").textContent =
      "Le calcul pourra ensuite pre-remplir un objectif d'epargne.";
    useButton.disabled = true;
    return;
  }

  const frequencyLabel = FREQUENCY_LABELS[result.frequency] || result.frequency;
  $("goalPlannerHeadline").textContent =
    result.remainingAmount > 0
      ? `${formatCurrency(result.contributionAmount)} / ${frequencyLabel.toLowerCase()}`
      : "Objectif deja finance";
  $("goalPlannerSummary").textContent =
    result.remainingAmount > 0
      ? `${result.periods} ${result.periods > 1 ? "versements" : "versement"} du ${formatDate(result.startDate)} au ${formatDate(result.targetDate)}.`
      : `${result.label} atteint deja la cible indiquee avec le montant actuel.`;
  $("goalPlannerRemaining").textContent = formatCurrency(result.remainingAmount);
  $("goalPlannerPeriods").textContent = String(result.periods);
  $("goalPlannerMonthly").textContent = formatCurrency(result.monthlyEquivalent);
  $("goalPlannerBreakdown").textContent =
    result.remainingAmount > 0
      ? `${result.label} : cible ${formatCurrency(result.targetAmount)}, deja ${formatCurrency(result.currentAmount)}.`
      : `Tu peux quand meme reutiliser ce but pour garder une trace dans la section epargne.`;
  useButton.disabled = false;
}

function applyGoalPlannerToSavings() {
  if (!goalPlannerState.result) {
    return;
  }

  const result = goalPlannerState.result;
  const form = $("savingsForm");
  form.elements.label.value = result.label;
  form.elements.targetAmount.value = String(result.targetAmount);
  form.elements.currentAmount.value = String(result.currentAmount);
  form.elements.contributionAmount.value = String(result.contributionAmount);
  form.elements.frequency.value = result.frequency;
  form.elements.nextDate.value = result.startDate;
  updateSavingsFormOwnership();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
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
      note: `Perso ${formatCurrency(metrics.monthlyPersonalSavings)} • Commune ${formatCurrency(metrics.monthlySharedSavings)}.`,
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
  renderTable("savingsTable", state.savingsGoals, 7, renderSavingsRow);
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
                <small>${escapeHtml(formatOwnerLabel(event.owner))} • ${escapeHtml(formatDate(event.date))}</small>
              </div>
              <strong class="${event.delta >= 0 ? "positive" : "negative"}">${escapeHtml(formatSignedCurrency(event.delta))}</strong>
            </li>
          `
        )
        .join("")
    : "<li><div><strong>Aucun mouvement a venir</strong><small>Ajoutez des paies, factures ou virements.</small></div></li>";

  drawProjectionChart(projection.points, state.household.safetyBuffer);
}

function renderContributors() {
  $("contributorsGrid").innerHTML = computeOwnerMetrics()
    .map(
      (card) => `
        <article class="contributor-card fade-in">
          <span>${escapeHtml(card.displayName)}</span>
          <strong class="${card.net >= 0 ? "positive" : "negative"}">${escapeHtml(formatCurrency(card.net))}</strong>
          <p>${escapeHtml(card.note)}</p>
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
    return {
      owner,
      displayName: formatOwnerLabel(owner),
      income,
      bills,
      savings,
      net: income - bills - savings,
      note: shared ? "Vue du compte commun et des objectifs partages." : "Net mensuel estime.",
    };
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
  const targetAmount = parseAmount(formData.get("targetAmount"));
  const currentAmount = parseAmount(formData.get("currentAmount"));
  const startDate = textValue(formData.get("startDate"));
  const targetDate = textValue(formData.get("targetDate"));
  const frequency = textValue(formData.get("frequency")) || "monthly";

  if (!targetAmount || !startDate || !targetDate) {
    window.alert("Ajoutez au minimum le montant vise, la date de debut et la date cible.");
    return null;
  }

  const start = parseDate(startDate);
  const end = parseDate(targetDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    window.alert("Les dates du but ne sont pas valides.");
    return null;
  }

  if (end < start) {
    window.alert("La date cible doit etre egale ou posterieure au debut des versements.");
    return null;
  }

  const periods = countContributionSlots(startDate, targetDate, frequency);
  if (!periods) {
    window.alert("Impossible de calculer des versements avec ces dates.");
    return null;
  }

  const remainingAmount = Math.max(targetAmount - currentAmount, 0);
  const contributionAmount = remainingAmount > 0 ? roundUpCurrency(remainingAmount / periods) : 0;

  return {
    label,
    targetAmount,
    currentAmount,
    remainingAmount,
    startDate,
    targetDate,
    frequency,
    periods,
    contributionAmount,
    monthlyEquivalent: monthlyAmount(contributionAmount, frequency),
  };
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

function sanitizeSavingsGoal(item, household) {
  const sharedOwner = household.householdName || "Budget du foyer";
  const owner = textValue(item.owner);
  const scope = textValue(item.scope) === "shared" || owner === sharedOwner ? "shared" : "personal";

  return {
    id: textValue(item.id) || createId(),
    scope,
    owner: scope === "shared" ? sharedOwner : owner || household.partnerOne || "Moi",
    label: textValue(item.label),
    targetAmount: parseAmount(item.targetAmount),
    currentAmount: parseAmount(item.currentAmount),
    contributionAmount: parseAmount(item.contributionAmount),
    frequency: textValue(item.frequency) || "monthly",
    nextDate: textValue(item.nextDate),
  };
}

function getSharedOwnerValue() {
  return state.household.householdName || "Budget du foyer";
}

function isSharedOwner(owner) {
  return textValue(owner) === getSharedOwnerValue();
}

function formatOwnerLabel(owner) {
  return isSharedOwner(owner) ? "Compte commun" : textValue(owner) || "-";
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
      },
    ],
    transactions: [],
  };
}
