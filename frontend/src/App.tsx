import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { CrisisBanner } from "./components/CrisisBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { runMigrations } from "./lib/migrations";
import { PHQ9_SUICIDE_ITEM_INDEX } from "./modules/checkin/constants";
import type { CheckinData } from "./modules/checkin/types";
import { getModule, modules } from "./modules/registry";
import type { AllData } from "./types";

const isLocal = import.meta.env.VITE_STORAGE === "local";

async function exportJSON() {
  const data = await api.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kompass-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file: File, onDone: () => void) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const raw = e.target?.result;
      if (typeof raw !== "string" || !raw.trim()) {
        alert("Die Datei ist leer oder konnte nicht gelesen werden.");
        return;
      }
      const dump = JSON.parse(raw);
      if (!dump || typeof dump !== "object" || Array.isArray(dump)) {
        alert("Ungültiges Format: kein JSON-Objekt.");
        return;
      }
      await api.importAll(dump);
      onDone();
    } catch {
      alert("Datei konnte nicht gelesen werden.");
    }
  };
  reader.readAsText(file);
}

interface ModuleState {
  data: any;
  loaded: boolean;
  error: string | null;
}

type Store = Record<string, ModuleState>;

function emptyStore(): Store {
  return Object.fromEntries(
    modules.map((m) => [m.id, { data: m.defaultData(), loaded: false, error: null }]),
  );
}

export default function App() {
  const [activeId, setActiveId] = useState(modules[0]?.id ?? "");
  const [store, setStore] = useState<Store>(() => emptyStore());
  const [importKey, setImportKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [goalPrefill, setGoalPrefill] = useState<{
    title: string;
    description: string;
  } | null>(null);

  // Refs let loadModule read latest values without stale-closure deps.
  const prefillNavRef = useRef(false);
  const storeRef = useRef(store);
  storeRef.current = store;

  const loadModule = useCallback(async (id: string) => {
    const mod = getModule(id);
    if (!mod) return;
    // If navigating to Goals with an active prefill and Goals is already loaded, skip
    // the GET — GoalsModule's mount-effect applies the prefill without a race where the
    // GET response returns stale data and overwrites the optimistically-added goal.
    if (id === "goals" && prefillNavRef.current) {
      prefillNavRef.current = false;
      if (storeRef.current["goals"]?.loaded) return;
    }
    if (mod.kind === "special") {
      setStore((s) => ({ ...s, [id]: { data: mod.defaultData(), loaded: true, error: null } }));
      return;
    }
    try {
      const record = await api.getModule<any>(id);
      const data =
        record.schema_version < mod.schemaVersion
          ? runMigrations(record.data, record.schema_version, mod.schemaVersion, mod.migrations)
          : record.data;
      setStore((s) => ({ ...s, [id]: { data, loaded: true, error: null } }));
    } catch (err) {
      setStore((s) => ({
        ...s,
        [id]: { data: mod.defaultData(), loaded: true, error: (err as Error).message },
      }));
    }
  }, []);

  useEffect(() => {
    if (activeId) void loadModule(activeId);
  }, [activeId, loadModule, importKey]);

  const handleChange = useCallback(
    (id: string) => (next: any) => {
      setStore((s) => ({ ...s, [id]: { ...s[id], data: next } }));
      void api.putModule(id, next).catch((err) => {
        setStore((s) => ({ ...s, [id]: { ...s[id], error: (err as Error).message } }));
      });
    },
    [],
  );

  // Clear goalPrefill whenever user navigates away from Goals — ensures one-shot
  // behaviour without racing against the async loadModule call.
  useEffect(() => {
    if (activeId !== "goals") setGoalPrefill(null);
  }, [activeId]);

  function handleNavigateToGoals(prefill: { title: string; description: string }) {
    prefillNavRef.current = true;
    setGoalPrefill(prefill);
    setActiveId("goals");
  }

  const [helpOpen, setHelpOpen] = useState(false);

  const active = getModule(activeId);
  const state = store[activeId];
  const allData: AllData = {
    ...Object.fromEntries(modules.map((m) => [m.id, store[m.id]?.data])),
    ...(activeId === "goals" && goalPrefill ? { __goalPrefill: goalPrefill } : {}),
  };

  const checkinData = allData?.checkin as CheckinData | undefined;
  const latestEntry = checkinData?.entries?.[0];
  const crisisDetected = Boolean(
    latestEntry && (latestEntry.phq9?.[PHQ9_SUICIDE_ITEM_INDEX] ?? 0) > 0,
  );

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-line-soft bg-paper-2 p-6 flex flex-col">
        <div className="display text-2xl text-ink mb-8">Kompass</div>
        <nav className="space-y-1">
          {modules.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveId(m.id)}
              className={`w-full text-left px-3 py-2 rounded-sm transition-colors ${
                m.id === activeId
                  ? "bg-ink text-paper"
                  : "text-ink-soft hover:bg-paper-3"
              }`}
            >
              <span className="text-xs text-ink-faint tracking-wider mr-2">
                {m.phaseNum}
              </span>
              {m.title}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-line-soft space-y-2">
          <button
            type="button"
            onClick={() => setHelpOpen((v) => !v)}
            className={`w-full text-left px-3 py-2 text-sm rounded-sm transition-colors ${
              crisisDetected
                ? "text-accent hover:bg-paper-3 font-medium"
                : "text-ink-faint hover:bg-paper-3 hover:text-ink-soft"
            }`}
          >
            {crisisDetected ? "⚠ Hilfe in der Krise" : "Hilfe in der Krise"}
          </button>

          <button
            type="button"
            onClick={() => void exportJSON()}
            className="w-full text-left px-3 py-2 text-sm text-ink-soft hover:bg-paper-3 rounded-sm transition-colors"
          >
            Daten exportieren
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title={isLocal ? undefined : "Import via Backend-Endpoint (POST /api/import)"}
            className="w-full text-left px-3 py-2 text-sm text-ink-soft hover:bg-paper-3 rounded-sm transition-colors"
          >
            Daten importieren
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importJSON(file, () => {
                setStore(emptyStore());
                setImportKey((k) => k + 1);
              });
              e.target.value = "";
            }}
          />
        </div>
      </aside>

      <main className="flex-1 bg-paper">
        {(helpOpen || crisisDetected) && (
          <div className="max-w-3xl mx-auto px-6 pt-6">
            <CrisisBanner />
          </div>
        )}
        <ErrorBoundary key={activeId}>
          {active?.Component && state?.loaded ? (
            <active.Component
              data={state.data}
              onChange={handleChange(active.id)}
              allData={allData}
              onNavigateToGoals={handleNavigateToGoals}
            />
          ) : (
            <div className="p-12 text-ink-faint">Lade…</div>
          )}
        </ErrorBoundary>
        {state?.error ? (
          <div className="max-w-3xl mx-auto px-6 pb-6 text-accent text-sm">
            {state.error}
          </div>
        ) : null}
      </main>
    </div>
  );
}
