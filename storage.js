(function () {
  const DB_NAME = "infotec-diagnostic-totem";
  const DB_VERSION = 1;
  const STORE_NAME = "diagnostics";

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Falha no armazenamento local"));
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Falha no armazenamento local"));
      transaction.onabort = () => reject(transaction.error || new Error("Operação local cancelada"));
    });
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        const store = database.createObjectStore(STORE_NAME, { keyPath: "diagnostic_id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("created_at", "created_at", { unique: false });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Não foi possível abrir o backup local"));
    });
  }

  async function getRecord(diagnosticId) {
    const database = await openDatabase();
    try {
      return await requestResult(database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(diagnosticId));
    } finally {
      database.close();
    }
  }

  async function putPayload(payload, status = "pending", extra = {}) {
    const previous = await getRecord(payload.diagnostic_id);
    const now = new Date().toISOString();
    const record = {
      diagnostic_id: payload.diagnostic_id,
      created_at: payload.created_at || previous?.created_at || now,
      saved_at: previous?.saved_at || now,
      updated_at: now,
      status,
      attempts: previous?.attempts || 0,
      synced_at: previous?.synced_at || null,
      last_error: previous?.last_error || "",
      payload,
      ...extra
    };
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(record);
      await transactionDone(transaction);
      return record;
    } finally {
      database.close();
    }
  }

  async function patchRecord(diagnosticId, patch) {
    const previous = await getRecord(diagnosticId);
    if (!previous) return null;
    const record = { ...previous, ...patch, updated_at: new Date().toISOString() };
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(record);
      await transactionDone(transaction);
      return record;
    } finally {
      database.close();
    }
  }

  async function removeRecord(diagnosticId) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(diagnosticId);
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  }

  async function markSynced(diagnosticId) {
    return patchRecord(diagnosticId, {
      status: "synced",
      synced_at: new Date().toISOString(),
      last_error: ""
    });
  }

  async function markPending(diagnosticId, error) {
    const previous = await getRecord(diagnosticId);
    return patchRecord(diagnosticId, {
      status: "pending",
      attempts: (previous?.attempts || 0) + 1,
      last_error: String(error?.message || error || "Falha de conexão").slice(0, 300)
    });
  }

  async function listAll() {
    const database = await openDatabase();
    try {
      const records = await requestResult(database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll());
      return records.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    } finally {
      database.close();
    }
  }

  async function listPending() {
    const records = await listAll();
    return records.filter((record) => record.status !== "synced");
  }

  async function stats() {
    const records = await listAll();
    return {
      total: records.length,
      pending: records.filter((record) => record.status !== "synced").length,
      synced: records.filter((record) => record.status === "synced").length
    };
  }

  async function importLegacyQueue() {
    let legacy = [];
    try {
      legacy = JSON.parse(localStorage.getItem("infotec_pending") || "[]");
    } catch (error) {
      legacy = [];
    }
    for (const payload of legacy) {
      if (payload?.diagnostic_id && !(await getRecord(payload.diagnostic_id))) {
        await putPayload(payload, "pending", { last_error: "Importado da fila anterior" });
      }
    }
    if (legacy.length) localStorage.removeItem("infotec_pending");
  }

  window.InfotecStore = {
    getRecord,
    putPayload,
    removeRecord,
    markSynced,
    markPending,
    listAll,
    listPending,
    stats,
    importLegacyQueue
  };
})();
