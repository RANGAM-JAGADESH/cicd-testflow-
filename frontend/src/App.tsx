import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Activity, CheckCircle2, XCircle, FlaskConical, GitBranch, Rocket, Boxes,
  LayoutDashboard, Terminal, Plus, Search, RefreshCw, Container, PackageCheck,
} from "lucide-react";
import { call, type ApiResult, type Item, type Pipeline } from "./api";

type Tab = "dashboard" | "explorer" | "tests" | "pipeline";
type Entry = { time: string; text: string };

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "explorer", label: "API Explorer", icon: <Terminal size={16} /> },
  { id: "tests", label: "Test Status", icon: <FlaskConical size={16} /> },
  { id: "pipeline", label: "CI/CD Pipeline", icon: <GitBranch size={16} /> },
];

const TESTS = [
  ["test_health_endpoint", "GET /health returns healthy"],
  ["test_get_items_returns_list", "GET /items returns a list"],
  ["test_create_item", "POST /items creates an item (201)"],
  ["test_create_item_rejects_empty_name", "POST /items validates input (422)"],
  ["test_get_item_by_id", "GET /items/{id} returns the item"],
  ["test_get_item_invalid_id_returns_404", "GET /items/{id} unknown id returns 404"],
  ["test_pipeline_status", "GET /pipeline/status returns CI/CD info"],
];

const STAGES = [
  ["Checkout", "actions/checkout fetches the repository"],
  ["Setup Python", "Python 3.12 with pip caching"],
  ["Install dependencies", "pip install -r backend/requirements-dev.txt"],
  ["Run Pytest", "A failing test fails the whole workflow"],
  ["Build Docker image", "Multi-stage build: React + FastAPI"],
  ["Publish to GHCR", "Runs on main only, using GITHUB_TOKEN"],
];

const card = "rounded-2xl border border-amber-100 bg-white shadow-sm shadow-amber-100/60";
const btn =
  "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:from-amber-400 hover:to-yellow-500 hover:shadow disabled:opacity-50";
const input =
  "w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200";

function StatusCard({ icon, title, value, ok }: { icon: ReactNode; title: string; value: string; ok: boolean }) {
  return (
    <div className={`${card} p-5 transition hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
        <span className="rounded-lg bg-gradient-to-br from-amber-100 to-yellow-200 p-1.5 text-amber-700">{icon}</span>
        {title}
      </div>
      <div className="flex items-center gap-2 text-lg font-semibold">
        {ok ? <CheckCircle2 size={18} className="text-amber-500" /> : <XCircle size={18} className="text-red-500" />}
        {value}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [health, setHealth] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [activity, setActivity] = useState<Entry[]>([]);
  const [last, setLast] = useState<{ label: string; result: ApiResult } | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lookupId, setLookupId] = useState("1");

  const log = (text: string) =>
    setActivity((a) => [{ time: new Date().toLocaleTimeString(), text }, ...a].slice(0, 6));

  const refresh = useCallback(async () => {
    const [h, i, p] = await Promise.allSettled([
      call<{ status: string }>("/health"),
      call<Item[]>("/items"),
      call<Pipeline>("/pipeline/status"),
    ]);
    setHealth(h.status === "fulfilled" ? h.value.data.status : "unreachable");
    if (i.status === "fulfilled") setItems(i.value.data);
    if (p.status === "fulfilled") setPipeline(p.value.data);
    log("Refreshed health, items and pipeline status");
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const run = async (label: string, path: string, init?: RequestInit) => {
    try {
      const result = await call(path, init);
      setLast({ label, result });
      log(`${label} → ${result.status}`);
      return result;
    } catch {
      log(`${label} → network error`);
    }
  };

  const createItem = async () => {
    if (!name.trim()) return;
    const r = await run("POST /items", "/items", { method: "POST", body: JSON.stringify({ name, description }) });
    if (r && r.status === 201) {
      setName(""); setDescription("");
      const list = await call<Item[]>("/items");
      setItems(list.data);
    }
  };

  const healthy = health === "healthy";
  const passing = pipeline?.status === "passing";

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="rounded-xl bg-gradient-to-br from-amber-300 to-yellow-400 p-2"><Boxes size={18} /></span>
          CI/CD TestFlow
        </div>
        <nav className="flex flex-wrap gap-1 rounded-2xl border border-amber-100 bg-white p-1 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                tab === t.id ? "bg-gradient-to-r from-amber-200 to-yellow-300 text-slate-900" : "text-slate-500 hover:bg-amber-50"
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="mb-8 rounded-3xl border border-amber-100 bg-gradient-to-br from-white via-[#FFFDF2] to-[#FFE566]/60 p-8 md:p-12">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Build. Test. Deploy.</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Automated software delivery powered by Python, Pytest and GitHub Actions.
        </p>
      </section>

      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatusCard icon={<Activity size={16} />} title="Application" value={healthy ? "Healthy" : "Unreachable"} ok={healthy} />
            <StatusCard icon={<Terminal size={16} />} title="API" value={healthy ? "Operational" : "Down"} ok={healthy} />
            <StatusCard icon={<FlaskConical size={16} />} title="Tests" value={passing ? "Passing" : "Unknown"} ok={passing} />
            <StatusCard icon={<Rocket size={16} />} title="Pipeline" value={pipeline ? `Last build: ${pipeline.last_build}` : "Unknown"} ok={pipeline?.last_build === "success"} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className={`${card} p-5`}>
              <div className="text-sm text-slate-500">Available items</div>
              <div className="mt-1 bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-5xl font-extrabold text-transparent">{items.length}</div>
              <button className={`${btn} mt-4`} onClick={refresh}><RefreshCw size={14} />Refresh</button>
            </div>
            <div className={`${card} p-5 md:col-span-2`}>
              <div className="mb-3 text-sm font-medium text-slate-500">Recent activity</div>
              <ul className="space-y-2 text-sm">
                {activity.map((a, i) => (
                  <li key={i} className="flex gap-3 border-b border-amber-50 pb-2 last:border-0">
                    <span className="text-slate-400">{a.time}</span><span>{a.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === "explorer" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className={`${card} p-5`}>
              <h2 className="mb-3 font-semibold">Create item <span className="text-xs font-normal text-slate-400">POST /items</span></h2>
              <div className="space-y-2">
                <input className={input} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <input className={input} placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                <button className={btn} onClick={createItem}><Plus size={14} />Create</button>
              </div>
            </div>
            <div className={`${card} p-5`}>
              <h2 className="mb-3 font-semibold">Get item by ID <span className="text-xs font-normal text-slate-400">GET /items/{"{id}"}</span></h2>
              <div className="flex gap-2">
                <input className={input} value={lookupId} onChange={(e) => setLookupId(e.target.value)} />
                <button className={btn} onClick={() => run(`GET /items/${lookupId}`, `/items/${encodeURIComponent(lookupId)}`)}><Search size={14} />Fetch</button>
              </div>
            </div>
            <div className={`${card} p-5`}>
              <h2 className="mb-3 flex items-center justify-between font-semibold">
                Items <button className={btn} onClick={() => run("GET /items", "/items")}>GET /items</button>
              </h2>
              <ul className="space-y-2 text-sm">
                {items.map((i) => (
                  <li key={i.id} className="rounded-xl bg-gradient-to-r from-white to-[#FFF7CC] px-3 py-2">
                    <span className="font-semibold">#{i.id} {i.name}</span>
                    {i.description && <span className="text-slate-500"> — {i.description}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className={`${card} p-5`}>
            <h2 className="mb-3 font-semibold">Last response</h2>
            {last ? (
              <>
                <div className="mb-2 text-sm">
                  <code className="rounded bg-amber-50 px-2 py-0.5">{last.label}</code>{" "}
                  <span className={last.result.status < 400 ? "font-semibold text-amber-600" : "font-semibold text-red-600"}>{last.result.status}</span>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-[#FFFDF2] p-4 text-xs">{JSON.stringify(last.result.data, null, 2)}</pre>
              </>
            ) : (
              <p className="text-sm text-slate-400">Send a request to see the live response here.</p>
            )}
          </div>
        </div>
      )}

      {tab === "tests" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className={`${card} p-5 lg:col-span-2`}>
            <h2 className="mb-1 font-semibold">Pytest coverage</h2>
            <p className="mb-4 text-sm text-slate-500">Tests in <code>backend/tests/test_api.py</code>, run with FastAPI TestClient.</p>
            <ul className="space-y-2 text-sm">
              {TESTS.map(([fn, desc]) => (
                <li key={fn} className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-white to-[#FFF7CC] px-3 py-2">
                  <FlaskConical size={16} className="mt-0.5 shrink-0 text-amber-600" />
                  <div><code className="font-semibold">{fn}</code><div className="text-slate-500">{desc}</div></div>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <StatusCard icon={<FlaskConical size={16} />} title="Reported by API" value={pipeline?.status ?? "Unknown"} ok={passing} />
            <div className={`${card} p-5 text-sm`}>
              <div className="mb-2 font-semibold">Run locally</div>
              <pre className="overflow-x-auto rounded-xl bg-[#FFFDF2] p-3 text-xs">{`cd backend\npytest -v`}</pre>
              <p className="mt-3 text-slate-500">Real results appear in the GitHub Actions run for every push and pull request.</p>
            </div>
          </div>
        </div>
      )}

      {tab === "pipeline" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className={`${card} p-5 lg:col-span-2`}>
            <h2 className="mb-4 font-semibold">Workflow: .github/workflows/ci-cd.yml</h2>
            <ol className="space-y-3">
              {STAGES.map(([title, desc], i) => (
                <li key={title} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-yellow-300 text-sm font-bold">{i + 1}</span>
                  <div><div className="text-sm font-semibold">{title}</div><div className="text-sm text-slate-500">{desc}</div></div>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-4">
            <StatusCard icon={<PackageCheck size={16} />} title="Pipeline status" value={pipeline?.status ?? "Unknown"} ok={passing} />
            <div className={`${card} space-y-2 p-5 text-sm`}>
              <div><span className="text-slate-500">Environment:</span> <b>{pipeline?.environment ?? "—"}</b></div>
              <div><span className="text-slate-500">Last build:</span> <b>{pipeline?.last_build ?? "—"}</b></div>
              <div className="flex items-center gap-2"><Container size={14} className="text-amber-600" />Triggers: push, pull request, manual</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
