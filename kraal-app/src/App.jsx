import { useState, useEffect } from "react";

const JSONBIN_URL = "https://api.jsonbin.io/v3/b";
const JSONBIN_KEY = "$2a$10$IolJct3HVvkOwfm3wQQlcespvobsKsdaw6E0tCnQi1eYeGOaGMdBm";
const BIN_ID_KEY = "kraal_bin_id";

const QUESTIONS = [
  { id: "nombre", section: null, label: "¿Cuál es tu nombre?", type: "text", placeholder: "Tu nombre..." },
  { id: "cargo", section: null, label: "¿Tienes algún cargo en el grupo?", type: "select", options: ["Sí", "No"] },
  { id: "cual_cargo", section: null, label: "¿Cuál o cuáles son tus cargos?", type: "text", placeholder: "Ej: Tesorería, Secretaría...", conditional: (r) => r.cargo === "Sí" },
  { id: "responsabilidad", section: "Evaluación del cargo", label: "¿Has tomado responsabilidades en tu cargo este período?", type: "select", options: ["Sí", "No", "Parcialmente"] },
  { id: "visto_cargo", section: null, label: "¿Cómo te has visto en tu cargo?", type: "scale", labels: ["Muy mal", "Mal", "Regular", "Bien", "Muy bien"] },
  { id: "com_cargo", section: null, label: "¿Cómo ha sido la comunicación con el resto de tu cargo?", type: "scale", labels: ["Muy mala", "Mala", "Regular", "Buena", "Muy buena"] },
  {
    id: "carga_trabajo", section: "Bienestar y carga", label: "¿Cómo sientes tu carga de trabajo este período?", type: "cards",
    options: [
      { value: "tranquilo", emoji: "😌", label: "Tranquilo/a", desc: "La carga es asumible" },
      { value: "ajustado", emoji: "😅", label: "Ajustado/a", desc: "Voy al límite" },
      { value: "desbordado", emoji: "😵", label: "Desbordado/a", desc: "Es demasiado" },
    ],
  },
  { id: "animo", section: null, label: "¿Cómo está tu ánimo general con el grupo?", type: "scale", labels: ["Muy bajo", "Bajo", "Normal", "Bueno", "Muy bueno"] },
  { id: "com_rama", section: "Evaluación personal", label: "¿Cómo ha sido la comunicación con tu kraal de rama?", type: "scale", labels: ["Muy mala", "Mala", "Regular", "Buena", "Muy buena"] },
  { id: "com_kraal", section: null, label: "¿Cómo ha sido la comunicación con el resto del kraal?", type: "scale", labels: ["Muy mala", "Mala", "Regular", "Buena", "Muy buena"] },
  { id: "sobrecarga_cargo", section: null, label: "¿Sientes que algún cargo del grupo está sobrecargado respecto al resto?", type: "select", options: ["Sí", "No", "No lo sé"] },
  { id: "observaciones", section: null, label: "Observaciones, propuestas o inquietudes sobre otros cargos", type: "textarea", placeholder: "Opcional...", optional: true },
  { id: "privado", section: null, label: "¿Tienes algo que no te atrevas a decir en el kraal? Solo lo verá Animación.", type: "textarea", placeholder: "Opcional...", optional: true },
];

const PERIODS = ["Navidad 2024", "Mayo 2025", "Julio 2025", "Navidad 2025", "Mayo 2026", "Julio 2026"];
const DASHBOARD_PASSWORD = "animacion2025";

const C = {
  green: "#1a6b4a", greenLight: "#e8f5ee", greenMid: "#2d9464",
  amber: "#b85c00", amberLight: "#fff3e0",
  red: "#b91c1c", redLight: "#fef2f2",
  gray: "#6b7280", grayLight: "#f9fafb",
  border: "#e5e7eb", text: "#111827", textMuted: "#6b7280",
};

async function loadEntries() {
  const binId = localStorage.getItem(BIN_ID_KEY);
  if (!binId) return [];
  try {
    const res = await fetch(`${JSONBIN_URL}/${binId}/latest`, {
      headers: { "X-Master-Key": JSONBIN_KEY },
    });
    const data = await res.json();
    return data.record?.entries || [];
  } catch { return []; }
}

async function saveEntries(entries) {
  let binId = localStorage.getItem(BIN_ID_KEY);
  if (!binId) {
    const res = await fetch(JSONBIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Master-Key": JSONBIN_KEY, "X-Bin-Name": "kraal-animacion" },
      body: JSON.stringify({ entries }),
    });
    const data = await res.json();
    binId = data.metadata?.id;
    if (binId) localStorage.setItem(BIN_ID_KEY, binId);
  } else {
    await fetch(`${JSONBIN_URL}/${binId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Master-Key": JSONBIN_KEY },
      body: JSON.stringify({ entries }),
    });
  }
}

function ScaleInput({ labels, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {labels.map((label, i) => {
        const val = i + 1;
        const selected = value === val;
        return (
          <button key={i} onClick={() => onChange(val)} style={{ flex: 1, minWidth: 60, padding: "10px 4px", borderRadius: 10, border: selected ? `2px solid ${C.green}` : `1.5px solid ${C.border}`, background: selected ? C.greenLight : "#fff", color: selected ? C.green : C.text, fontFamily: "inherit", fontSize: 12, fontWeight: selected ? 600 : 400, cursor: "pointer", transition: "all 0.15s", lineHeight: 1.3 }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{val}</div>
            <div>{label}</div>
          </button>
        );
      })}
    </div>
  );
}

function CardInput({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {options.map((opt) => {
        const selected = value === opt.value;
        const bg = opt.value === "tranquilo" ? C.greenLight : opt.value === "ajustado" ? C.amberLight : C.redLight;
        const border = opt.value === "tranquilo" ? C.green : opt.value === "ajustado" ? C.amber : C.red;
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{ flex: 1, minWidth: 100, padding: "16px 12px", borderRadius: 12, border: selected ? `2px solid ${border}` : `1.5px solid ${C.border}`, background: selected ? bg : "#fff", cursor: "pointer", transition: "all 0.15s", textAlign: "center", fontFamily: "inherit" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{opt.emoji}</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: selected ? border : C.text, marginBottom: 3 }}>{opt.label}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{opt.desc}</div>
          </button>
        );
      })}
    </div>
  );
}

function FormView({ onSubmit }) {
  const [responses, setResponses] = useState({});
  const [period, setPeriod] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (id, val) => setResponses((r) => ({ ...r, [id]: val }));
  const visible = QUESTIONS.filter((q) => !q.conditional || q.conditional(responses));

  const validate = () => {
    const errs = {};
    if (!period) errs.period = true;
    visible.forEach((q) => { if (!q.optional && !responses[q.id]) errs[q.id] = true; });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSubmit({ ...responses, period, timestamp: new Date().toISOString() });
    setSaving(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ textAlign: "center", padding: "60px 24px" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🌿</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.green, marginBottom: 8 }}>¡Gracias, {responses.nombre || "explorador/a"}!</h2>
      <p style={{ color: C.textMuted, fontSize: 15 }}>Tu respuesta ha quedado registrada. El equipo de Animación la revisará pronto.</p>
    </div>
  );

  let lastSection = null;
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 0 40px" }}>
      <div style={{ background: C.greenLight, borderRadius: 14, padding: "20px 24px", marginBottom: 28 }}>
        <p style={{ margin: 0, fontSize: 14, color: C.green, lineHeight: 1.6 }}>
          Desde <strong>Animación de Kraal</strong> queremos contribuir a una mejora del funcionamiento del grupo. Tómate un momento para responder con tranquilidad y sinceridad. 🤝
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Período que estás evaluando *</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: errors.period ? `1.5px solid ${C.red}` : `1.5px solid ${C.border}`, fontFamily: "inherit", fontSize: 15, background: "#fff", color: period ? C.text : C.textMuted }}>
          <option value="">Selecciona el período...</option>
          {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {visible.map((q) => {
        const showSection = q.section && q.section !== lastSection;
        if (q.section) lastSection = q.section;
        return (
          <div key={q.id}>
            {showSection && (
              <div style={{ borderTop: `1.5px solid ${C.border}`, margin: "28px 0 20px", paddingTop: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "0.08em" }}>{q.section}</span>
              </div>
            )}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", fontSize: 15, fontWeight: 500, color: C.text, marginBottom: 10 }}>
                {q.label} {!q.optional && <span style={{ color: C.red }}>*</span>}
              </label>
              {q.type === "text" && <input value={responses[q.id] || ""} onChange={(e) => set(q.id, e.target.value)} placeholder={q.placeholder} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: errors[q.id] ? `1.5px solid ${C.red}` : `1.5px solid ${C.border}`, fontFamily: "inherit", fontSize: 15, boxSizing: "border-box" }} />}
              {q.type === "select" && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {q.options.map((opt) => (
                    <button key={opt} onClick={() => set(q.id, opt)} style={{ padding: "9px 20px", borderRadius: 24, border: responses[q.id] === opt ? `2px solid ${C.green}` : `1.5px solid ${C.border}`, background: responses[q.id] === opt ? C.greenLight : "#fff", color: responses[q.id] === opt ? C.green : C.text, fontFamily: "inherit", fontSize: 14, fontWeight: responses[q.id] === opt ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>{opt}</button>
                  ))}
                </div>
              )}
              {q.type === "scale" && <ScaleInput labels={q.labels} value={responses[q.id]} onChange={(v) => set(q.id, v)} />}
              {q.type === "cards" && <CardInput options={q.options} value={responses[q.id]} onChange={(v) => set(q.id, v)} />}
              {q.type === "textarea" && <textarea value={responses[q.id] || ""} onChange={(e) => set(q.id, e.target.value)} placeholder={q.placeholder} rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontFamily: "inherit", fontSize: 15, resize: "vertical", boxSizing: "border-box" }} />}
              {errors[q.id] && <p style={{ margin: "6px 0 0", fontSize: 12, color: C.red }}>Este campo es obligatorio</p>}
            </div>
          </div>
        );
      })}

      <button onClick={handleSubmit} disabled={saving} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: saving ? C.gray : C.green, color: "#fff", fontSize: 16, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 8 }}>
        {saving ? "Guardando..." : "Enviar evaluación 🌿"}
      </button>
    </div>
  );
}

function StatBar({ label, value, max, color }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: C.text }}>{label}</span>
        <span style={{ color: C.textMuted, fontWeight: 600 }}>{value} ({pct}%)</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: C.border, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }} />
      </div>
    </div>
  );
}

function avg(arr) {
  if (!arr.length) return "—";
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
}

function DashboardView({ entries }) {
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState("");
  const [passErr, setPassErr] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState("all");

  if (!auth) return (
    <div style={{ maxWidth: 340, margin: "60px auto", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.green, marginBottom: 8 }}>Acceso solo para Animación</h2>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>Introduce la contraseña del cargo para ver el dashboard.</p>
      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { if (pass === DASHBOARD_PASSWORD) setAuth(true); else setPassErr(true); } }} placeholder="Contraseña..." style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: passErr ? `1.5px solid ${C.red}` : `1.5px solid ${C.border}`, fontFamily: "inherit", fontSize: 15, boxSizing: "border-box", marginBottom: 8 }} />
      {passErr && <p style={{ color: C.red, fontSize: 13, marginBottom: 8 }}>Contraseña incorrecta</p>}
      <button onClick={() => { if (pass === DASHBOARD_PASSWORD) setAuth(true); else setPassErr(true); }} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: C.green, color: "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Entrar</button>
    </div>
  );

  const filtered = filterPeriod === "all" ? entries : entries.filter((e) => e.period === filterPeriod);
  const periods = [...new Set(entries.map((e) => e.period))].sort();
  const count = filtered.length;
  const avgAnimo = avg(filtered.map((e) => e.animo).filter(Boolean));
  const avgCargo = avg(filtered.map((e) => e.visto_cargo).filter(Boolean));
  const avgComKraal = avg(filtered.map((e) => e.com_kraal).filter(Boolean));
  const cargaCounts = { tranquilo: 0, ajustado: 0, desbordado: 0 };
  filtered.forEach((e) => { if (e.carga_trabajo) cargaCounts[e.carga_trabajo]++; });
  const comKraalCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  filtered.forEach((e) => { if (e.com_kraal) comKraalCounts[e.com_kraal]++; });
  const privadas = filtered.filter((e) => e.privado?.trim());
  const observaciones = filtered.filter((e) => e.observaciones?.trim());

  if (count === 0) return (
    <div style={{ textAlign: "center", padding: "60px 24px", color: C.textMuted }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
      <p>Todavía no hay respuestas para este período.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 0 40px" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        <button onClick={() => setFilterPeriod("all")} style={{ padding: "6px 14px", borderRadius: 20, border: filterPeriod === "all" ? `2px solid ${C.green}` : `1.5px solid ${C.border}`, background: filterPeriod === "all" ? C.greenLight : "#fff", color: filterPeriod === "all" ? C.green : C.text, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Todos</button>
        {periods.map((p) => <button key={p} onClick={() => setFilterPeriod(p)} style={{ padding: "6px 14px", borderRadius: 20, border: filterPeriod === p ? `2px solid ${C.green}` : `1.5px solid ${C.border}`, background: filterPeriod === p ? C.greenLight : "#fff", color: filterPeriod === p ? C.green : C.text, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>{p}</button>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[{ label: "Respuestas", value: count }, { label: "Ánimo medio", value: `${avgAnimo}/5` }, { label: "Cargo medio", value: `${avgCargo}/5` }, { label: "Com. kraal", value: `${avgComKraal}/5` }].map((m) => (
          <div key={m.label} style={{ background: C.greenLight, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: C.green, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.green }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>Carga de trabajo</h3>
        <StatBar label="😌 Tranquilo/a" value={cargaCounts.tranquilo} max={count} color={C.greenMid} />
        <StatBar label="😅 Ajustado/a" value={cargaCounts.ajustado} max={count} color={C.amber} />
        <StatBar label="😵 Desbordado/a" value={cargaCounts.desbordado} max={count} color={C.red} />
      </div>

      <div style={{ background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>Comunicación con el kraal</h3>
        {[5, 4, 3, 2, 1].map((v) => <StatBar key={v} label={["", "Muy mala", "Mala", "Regular", "Buena", "Muy buena"][v]} value={comKraalCounts[v]} max={count} color={v >= 4 ? C.greenMid : v === 3 ? C.amber : C.red} />)}
      </div>

      {observaciones.length > 0 && (
        <div style={{ background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>Observaciones ({observaciones.length})</h3>
          {observaciones.map((e, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${C.greenMid}`, paddingLeft: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>{e.nombre} · {e.period}</div>
              <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>{e.observaciones}</div>
            </div>
          ))}
        </div>
      )}

      {privadas.length > 0 && (
        <div style={{ background: C.amberLight, border: `1.5px solid #f6d28a`, borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.amber, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>🔒 Mensajes privados ({privadas.length})</h3>
          <p style={{ fontSize: 12, color: C.amber, margin: "0 0 16px" }}>Solo visibles para Animación</p>
          {privadas.map((e, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${C.amber}`, paddingLeft: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: C.amber, marginBottom: 4 }}>{e.nombre} · {e.period}</div>
              <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>{e.privado}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("form");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries().then((e) => { setEntries(e); setLoading(false); });
  }, []);

  const handleSubmit = async (entry) => {
    const updated = [...entries, entry];
    setEntries(updated);
    await saveEntries(updated);
  };

  return (
    <div style={{ fontFamily: "Georgia, serif", minHeight: "100vh", background: "#fafaf8" }}>
      <div style={{ background: C.green, padding: "0 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🏕️</span>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Animación de Kraal</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Evaluación del grupo</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {["form", "dashboard"].map((v) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", borderRadius: 20, border: "none", fontFamily: "inherit", fontSize: 13, cursor: "pointer", background: view === v ? "rgba(255,255,255,0.25)" : "transparent", color: view === v ? "#fff" : "rgba(255,255,255,0.7)", fontWeight: view === v ? 600 : 400 }}>
                {v === "form" ? "Formulario" : `Dashboard (${entries.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: C.textMuted }}>Cargando...</div>
        ) : view === "form" ? (
          <FormView onSubmit={handleSubmit} />
        ) : (
          <DashboardView entries={entries} />
        )}
      </div>
    </div>
  );
}
