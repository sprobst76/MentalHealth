import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { localApi } from "./api.local";
import { runMigrations } from "./lib/migrations";
import { getModule, modules } from "./modules/registry";

const isLocal = import.meta.env.VITE_STORAGE === "local";

function exportJSON() {
  const data = localApi.exportAll();
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
  reader.onload = (e) => {
    try {
      const dump = JSON.parse(e.target?.result as string);
      localApi.importAll(dump);
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

  const loadModule = useCallback(async (id: string) => {
    const mod = getModule(id);
    if (!mod) return;
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

  const active = getModule(activeId);
  const state = store[activeId];
  const allData = Object.fromEntries(modules.map((m) => [m.id, store[m.id]?.data]));

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

        {isLocal && (
          <div className="mt-auto pt-8 border-t border-line-soft space-y-2">
            <button
              type="button"
              onClick={exportJSON}
              className="w-full text-left px-3 py-2 text-sm text-ink-soft hover:bg-paper-3 rounded-sm transition-colors"
            >
              Daten exportieren
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
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
        )}
      </aside>

      <main className="flex-1 bg-paper">
        {active?.Component && state?.loaded ? (
          <active.Component
            data={state.data}
            onChange={handleChange(active.id)}
            allData={allData}
          />
        ) : (
          <div className="p-12 text-ink-faint">Lade…</div>
        )}
        {state?.error ? (
          <div className="max-w-3xl mx-auto px-6 pb-6 text-accent text-sm">
            {state.error}
          </div>
        ) : null}
      </main>
    </div>
  );
}
