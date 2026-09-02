import { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, Coins, CalendarDays, ArrowRightLeft, ChevronDown, ChevronUp,
  Archive, ArrowLeft, FolderClock, Wallet, PiggyBank, HandCoins, Check, X, RefreshCw,
  DatabaseBackup, Download, Upload, ClipboardCopy, ShieldCheck, TriangleAlert, Pencil, ArrowDownCircle, ArrowUpCircle
} from "lucide-react";

// window.storage lo conecta main.jsx (usando Supabase) antes de mostrar esta app,
// una vez que el usuario inició sesión. Aquí no se toca.


const CATEGORIAS = ["Comida", "Transporte", "Antojos/Gustos", "Servicios", "Renta", "Salud", "Ropa", "Otros"];

const CAT_COLORS = {
  "Comida": "#C99A3E",
  "Transporte": "#6B9080",
  "Antojos/Gustos": "#A83E3E",
  "Servicios": "#3E6B8A",
  "Renta": "#7A5C9E",
  "Salud": "#3E8A6B",
  "Ropa": "#8A6B3E",
  "Otros": "#5C5C5C",
};

const BILLETES = [1000, 500, 200, 100, 50, 20];
const MONEDAS = [10, 5, 2, 1, 0.5];

const fmtMoney = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDenom = (d) => (d % 1 !== 0 ? `$${d.toFixed(2)}` : `$${d}`);

const todayISO = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
// build marker

function formatFechaCorta(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function formatFechaLarga(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${meses[m - 1]} ${y}`;
}

const emptyQuincena = () => ({
  id: `q-${Date.now()}`,
  fechaInicio: todayISO(),
  saldoInicial: 0,
  gastos: [],
  ingresos: [],
  folioContador: 1,
  dineroReal: null,
});

function getTimestampDeId(idStr) {
  if (!idStr) return 0;
  const partes = String(idStr).split("-");
  const n = Number(partes[partes.length - 1]);
  return isNaN(n) ? 0 : n;
}

function asignarFoliosSiFaltan(q) {
  // Ya migrado con el criterio correcto (orden real de captura) — no se vuelve a tocar.
  if (q.folioMigrado === 2) return q;

  const gastos = q.gastos || [];
  const ingresos = q.ingresos || [];
  const combined = [
    ...gastos.map((g) => ({ ...g, __tipo: "gasto" })),
    ...ingresos.map((i) => ({ ...i, __tipo: "ingreso" })),
  ];

  if (combined.length === 0) {
    return { ...q, folioMigrado: 2 };
  }

  // Ordena por el momento real en que se capturó cada uno (no por la fecha que el usuario escribió),
  // así se respeta tal cual el orden en que se fue anotando.
  combined.sort((a, b) => getTimestampDeId(a.id) - getTimestampDeId(b.id));
  combined.forEach((m, idx) => {
    m.folio = idx + 1;
  });

  const newGastos = combined.filter((m) => m.__tipo === "gasto").map(({ __tipo, ...rest }) => rest);
  const newIngresos = combined.filter((m) => m.__tipo === "ingreso").map(({ __tipo, ...rest }) => rest);

  return { ...q, gastos: newGastos, ingresos: newIngresos, folioContador: combined.length + 1, folioMigrado: 2 };
}

const emptyDenoms = () => {
  const b = {};
  BILLETES.forEach((d) => (b[d] = 0));
  const m = {};
  MONEDAS.forEach((d) => (m[d] = 0));
  return { billetes: b, monedas: m };
};

/* ============================== APP ROOT ============================== */

export default function MiApp() {
  const [mainTab, setMainTab] = useState("quincena"); // 'quincena' | 'caja' | 'prestamos'
  const [showBackup, setShowBackup] = useState(false);

  return (
    <div style={styles.page}>
      <style>{fontImports}</style>
      <div style={styles.ledgerLines} aria-hidden="true" />
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div>
              <div style={styles.eyebrow}>MIS FINANZAS</div>
              <h1 style={styles.title}>Cuenta cada peso</h1>
            </div>
            <button style={styles.backupIconBtn} onClick={() => setShowBackup(true)} aria-label="Respaldo">
              <DatabaseBackup size={20} />
            </button>
          </div>
        </div>

        {showBackup ? (
          <BackupSection onClose={() => setShowBackup(false)} />
        ) : (
          <>
        <div style={styles.mainTabBar}>
          <button
            style={{ ...styles.mainTabBtn, ...(mainTab === "quincena" ? styles.mainTabBtnActive : {}) }}
            onClick={() => setMainTab("quincena")}
          >
            <Wallet size={16} />
            <span>Quincena</span>
          </button>
          <button
            style={{ ...styles.mainTabBtn, ...(mainTab === "caja" ? styles.mainTabBtnActive : {}) }}
            onClick={() => setMainTab("caja")}
          >
            <PiggyBank size={16} />
            <span>Caja chica</span>
          </button>
          <button
            style={{ ...styles.mainTabBtn, ...(mainTab === "prestamos" ? styles.mainTabBtnActive : {}) }}
            onClick={() => setMainTab("prestamos")}
          >
            <HandCoins size={16} />
            <span>Préstamos</span>
          </button>
        </div>

        {mainTab === "quincena" && <QuincenaSection />}
        {mainTab === "caja" && <CajaChicaSection />}
        {mainTab === "prestamos" && <PrestamosSection />}
          </>
        )}

        <div style={styles.footer}>
          <Coins size={13} color="#B9AE93" />
          <span>Tus datos se guardan solo en este dispositivo/artefacto.</span>
        </div>
      </div>
    </div>
  );
}

/* ============================== QUINCENA ============================== */

function QuincenaSection() {
  const [loading, setLoading] = useState(true);
  const [quincena, setQuincena] = useState(emptyQuincena());
  const [historial, setHistorial] = useState([]);
  const [showCorte, setShowCorte] = useState(false);
  const [editingSaldo, setEditingSaldo] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [view, setView] = useState("actual"); // 'actual' | 'historial' | 'detalle'
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const blankForm = (tipo) => ({
    open: true,
    tipo,
    editId: null,
    fecha: todayISO(),
    concepto: "",
    categoria: CATEGORIAS[0],
    monto: "",
  });
  const [form, setForm] = useState({ open: false, tipo: "gasto", editId: null, fecha: todayISO(), concepto: "", categoria: CATEGORIAS[0], monto: "" });

  useEffect(() => {
    (async () => {
      try {
        const cur = await window.storage.get("quincena-actual");
        if (cur && cur.value) {
          const parsed = JSON.parse(cur.value);
          if (!parsed.ingresos) parsed.ingresos = [];
          if (!parsed.folioContador) parsed.folioContador = 1;
          const migrada = asignarFoliosSiFaltan(parsed);
          setQuincena(migrada);
          if (migrada !== parsed) {
            try {
              await window.storage.set("quincena-actual", JSON.stringify(migrada));
            } catch (e) {}
          }
        }
      } catch (e) {}
      try {
        const hist = await window.storage.get("historial-index");
        if (hist && hist.value) setHistorial(JSON.parse(hist.value));
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const persist = async (next) => {
    setQuincena(next);
    try {
      const res = await window.storage.set("quincena-actual", JSON.stringify(next));
      setSaveError(!res);
    } catch (e) {
      setSaveError(true);
    }
  };

  const totalGastado = useMemo(
    () => quincena.gastos.reduce((sum, g) => sum + Number(g.monto), 0),
    [quincena.gastos]
  );
  const totalIngresos = useMemo(
    () => (quincena.ingresos || []).reduce((sum, i) => sum + Number(i.monto), 0),
    [quincena.ingresos]
  );
  const saldoActual = Number(quincena.saldoInicial) + totalIngresos - totalGastado;

  const porCategoria = useMemo(() => {
    const map = {};
    CATEGORIAS.forEach((c) => (map[c] = 0));
    quincena.gastos.forEach((g) => {
      map[g.categoria] = (map[g.categoria] || 0) + Number(g.monto);
    });
    return map;
  }, [quincena.gastos]);

  const maxCat = Math.max(1, ...Object.values(porCategoria));

  const movimientos = useMemo(() => {
    const g = quincena.gastos.map((x) => ({ ...x, tipo: "gasto" }));
    const i = (quincena.ingresos || []).map((x) => ({ ...x, tipo: "ingreso" }));
    return [...g, ...i].sort((a, b) => (b.folio || 0) - (a.folio || 0));
  }, [quincena]);

  const abrirNuevo = (tipo) => setForm(blankForm(tipo));
  const abrirEditar = (item) => setForm({
    open: true,
    tipo: item.tipo,
    editId: item.id,
    fecha: item.fecha,
    concepto: item.concepto,
    categoria: item.categoria || CATEGORIAS[0],
    monto: String(item.monto),
  });
  const cerrarForm = () => setForm((f) => ({ ...f, open: false }));

  const guardarForm = () => {
    const monto = parseFloat(form.monto);
    if (!monto || monto <= 0) return;
    if (form.tipo === "gasto" && !form.concepto.trim()) return;

    if (form.editId) {
      if (form.tipo === "gasto") {
        const next = {
          ...quincena,
          gastos: quincena.gastos.map((g) =>
            g.id === form.editId ? { ...g, fecha: form.fecha, concepto: form.concepto.trim(), categoria: form.categoria, monto } : g
          ),
        };
        persist(next);
      } else {
        const next = {
          ...quincena,
          ingresos: quincena.ingresos.map((i) =>
            i.id === form.editId ? { ...i, fecha: form.fecha, concepto: form.concepto.trim() || "Ingreso", monto } : i
          ),
        };
        persist(next);
      }
    } else {
      const folio = quincena.folioContador || 1;
      if (form.tipo === "gasto") {
        const gasto = { id: `g-${Date.now()}`, folio, fecha: form.fecha, concepto: form.concepto.trim(), categoria: form.categoria, monto };
        persist({ ...quincena, gastos: [gasto, ...quincena.gastos], folioContador: folio + 1 });
      } else {
        const ingreso = { id: `i-${Date.now()}`, folio, fecha: form.fecha, concepto: form.concepto.trim() || "Ingreso", monto };
        persist({ ...quincena, ingresos: [ingreso, ...(quincena.ingresos || [])], folioContador: folio + 1 });
      }
    }
    cerrarForm();
  };

  const eliminarMovimiento = (item) => {
    if (item.tipo === "gasto") {
      persist({ ...quincena, gastos: quincena.gastos.filter((g) => g.id !== item.id) });
    } else {
      persist({ ...quincena, ingresos: quincena.ingresos.filter((i) => i.id !== item.id) });
    }
  };

  const updateSaldoInicial = (val) => {
    const n = parseFloat(val);
    persist({ ...quincena, saldoInicial: isNaN(n) ? 0 : n });
  };

  const updateDineroReal = (val) => {
    const n = val === "" ? null : parseFloat(val);
    persist({ ...quincena, dineroReal: isNaN(n) ? null : n });
  };

  const iniciarNuevaQuincena = async (arrastrarSaldo) => {
    const resumen = {
      id: quincena.id,
      fechaInicio: quincena.fechaInicio,
      fechaCierre: todayISO(),
      saldoInicial: quincena.saldoInicial,
      totalGastado,
      totalIngresos,
      saldoFinal: saldoActual,
      dineroReal: quincena.dineroReal,
      numMovimientos: quincena.gastos.length + (quincena.ingresos || []).length,
    };
    const nuevoHistorial = [resumen, ...historial].slice(0, 50);
    const quincenaCompleta = { ...quincena, fechaCierre: resumen.fechaCierre };
    try {
      await window.storage.set(`historial-quincena:${quincena.id}`, JSON.stringify(quincenaCompleta));
      await window.storage.set("historial-index", JSON.stringify(nuevoHistorial));
      setHistorial(nuevoHistorial);
    } catch (e) {
      setSaveError(true);
    }
    const nueva = emptyQuincena();
    nueva.saldoInicial = arrastrarSaldo ? (quincena.dineroReal ?? saldoActual) : 0;
    await persist(nueva);
    setShowCorte(false);
  };

  const diferencia = quincena.dineroReal !== null ? quincena.dineroReal - saldoActual : null;

  const abrirDetalle = async (id) => {
    setLoadingDetalle(true);
    setView("detalle");
    try {
      const res = await window.storage.get(`historial-quincena:${id}`);
      if (res && res.value) {
        const parsed = JSON.parse(res.value);
        const migrada = asignarFoliosSiFaltan(parsed);
        setDetalle(migrada);
        if (migrada !== parsed) {
          try {
            await window.storage.set(`historial-quincena:${id}`, JSON.stringify(migrada));
          } catch (e) {}
        }
      }
    } catch (e) {
      setDetalle(null);
    }
    setLoadingDetalle(false);
  };

  const volverAHistorial = () => {
    setDetalle(null);
    setView("historial");
  };

  const gruposPorMes = useMemo(() => {
    const map = {};
    historial.forEach((h) => {
      const [y, m] = h.fechaCierre.split("-").map(Number);
      const key = `${y}-${m}`;
      if (!map[key]) map[key] = { label: `${meses[m - 1]} ${y}`, items: [] };
      map[key].items.push(h);
    });
    return Object.values(map);
  }, [historial]);

  if (loading) {
    return <div style={styles.emptyState}>Cargando tu quincena…</div>;
  }

  return (
    <div>
      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tabBtn, ...(view !== "historial" && view !== "detalle" ? styles.tabBtnActive : {}) }}
          onClick={() => setView("actual")}
        >
          <Wallet size={15} /> Actual
        </button>
        <button
          style={{ ...styles.tabBtn, ...(view === "historial" || view === "detalle" ? styles.tabBtnActive : {}) }}
          onClick={() => setView("historial")}
        >
          <FolderClock size={15} /> Historial
        </button>
      </div>

      {view === "historial" && (
        <div>
          <div style={styles.subDate}>
            <span>Toca una quincena para ver todo su detalle.</span>
          </div>
          {gruposPorMes.length === 0 ? (
            <div style={styles.emptyState}>Todavía no tienes quincenas cerradas. Cuando cierres una desde "Corte de quincena", va a aparecer aquí.</div>
          ) : (
            gruposPorMes.map((grupo) => (
              <div key={grupo.label} style={{ marginBottom: 18 }}>
                <div style={styles.monthLabel}>{grupo.label}</div>
                <div style={styles.list}>
                  {grupo.items.map((h) => (
                    <button key={h.id} style={styles.histItemBtn} onClick={() => abrirDetalle(h.id)}>
                      <div>
                        <div style={styles.histItemDates}>
                          {formatFechaCorta(h.fechaInicio)} → {formatFechaCorta(h.fechaCierre)}
                        </div>
                        <div style={styles.histItemMeta}>{h.numMovimientos ?? h.numGastos ?? 0} movimientos</div>
                      </div>
                      <div style={styles.histItemMoney}>
                        <span style={styles.histItemGastado}>-{fmtMoney(h.totalGastado)}</span>
                        <span style={styles.histItemFinal}>Quedó {fmtMoney(h.saldoFinal)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === "detalle" && (
        <div>
          <button style={styles.backBtn} onClick={volverAHistorial}>
            <ArrowLeft size={16} /> Volver al historial
          </button>
          {loadingDetalle || !detalle ? (
            <div style={styles.emptyState}>Cargando…</div>
          ) : (
            <QuincenaDetalle data={detalle} />
          )}
        </div>
      )}

      {view === "actual" && (
        <>
          <div style={styles.ledPanel}>
            <div style={styles.ledLabel}>SALDO RESTANTE</div>
            <div style={{ ...styles.ledDigits, color: saldoActual < 0 ? "#FF6B6B" : "#7CFFB2" }}>
              {fmtMoney(saldoActual)}
            </div>
            <div style={styles.ledSubRow}>
              <span>Inicial: {fmtMoney(quincena.saldoInicial)}</span>
              <span style={{ color: "#8FE0A8" }}>Ingresos: +{fmtMoney(totalIngresos)}</span>
            </div>
            <div style={styles.ledSubRow}>
              <span style={{ color: "#FF9E9E" }}>Gastado: -{fmtMoney(totalGastado)}</span>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.rowBetween}>
              <span style={styles.cardLabel}>Saldo inicial de la quincena</span>
              {!editingSaldo ? (
                <button style={styles.linkBtn} onClick={() => setEditingSaldo(true)}>Editar</button>
              ) : (
                <button style={styles.linkBtn} onClick={() => setEditingSaldo(false)}>Listo</button>
              )}
            </div>
            {editingSaldo ? (
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={quincena.saldoInicial}
                onChange={(e) => updateSaldoInicial(e.target.value)}
                style={styles.inputMoney}
                autoFocus
              />
            ) : (
              <div style={styles.moneyDisplay}>{fmtMoney(quincena.saldoInicial)}</div>
            )}
          </div>

          {!form.open ? (
            <div style={styles.dualBtnRow}>
              <button style={styles.gastoBtn} onClick={() => abrirNuevo("gasto")}>
                <ArrowDownCircle size={17} /> Registrar gasto
              </button>
              <button style={styles.ingresoBtn} onClick={() => abrirNuevo("ingreso")}>
                <ArrowUpCircle size={17} /> Registrar ingreso
              </button>
            </div>
          ) : (
            <div style={styles.formCard}>
              <div style={styles.formHeaderRow}>
                <span style={{ ...styles.formTipoLabel, color: form.tipo === "gasto" ? "#A83E3E" : "#2F5D50" }}>
                  {form.editId ? "Editando" : "Nuevo"} {form.tipo === "gasto" ? "gasto" : "ingreso"}
                </span>
                {form.editId && (
                  <span style={styles.folioBadge}>
                    Folio #{form.tipo === "gasto"
                      ? quincena.gastos.find((g) => g.id === form.editId)?.folio
                      : quincena.ingresos.find((i) => i.id === form.editId)?.folio}
                  </span>
                )}
              </div>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>Fecha</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>{form.tipo === "gasto" ? "¿En qué gastaste?" : "Concepto (opcional)"}</label>
                <input
                  type="text"
                  placeholder={form.tipo === "gasto" ? "Ej. galleta, camión, comida" : "Ej. pago de folio #7, transferencia"}
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                  style={styles.input}
                />
              </div>
              {form.tipo === "gasto" && (
                <div style={styles.formRow}>
                  <label style={styles.formLabel}>Categoría</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    style={styles.input}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={styles.formRow}>
                <label style={styles.formLabel}>Monto</label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formActions}>
                <button style={styles.secondaryBtn} onClick={cerrarForm}>Cancelar</button>
                <button style={styles.primaryBtn} onClick={guardarForm}>
                  {form.editId ? "Guardar cambios" : form.tipo === "gasto" ? "Guardar gasto" : "Guardar ingreso"}
                </button>
              </div>
            </div>
          )}

          <div style={styles.sectionTitle}>Movimientos ({movimientos.length})</div>
          {movimientos.length === 0 ? (
            <div style={styles.emptyState}>Aún no registras nada en esta quincena. Cada gasto o ingreso que anotes aparece aquí.</div>
          ) : (
            <div style={styles.list}>
              {movimientos.map((m) => (
                <div key={m.id} style={styles.listItem}>
                  <div
                    style={{
                      ...styles.catDot,
                      background: m.tipo === "ingreso" ? "#6B9080" : (CAT_COLORS[m.categoria] || "#5C5C5C"),
                    }}
                  />
                  <div style={styles.listItemBody}>
                    <div style={styles.listItemTop}>
                      <span style={styles.listConcepto}>
                        <span style={styles.folioTag}>#{m.folio}</span> {m.concepto}
                      </span>
                      <span style={{ ...styles.listMonto, color: m.tipo === "ingreso" ? "#2F5D50" : "#A83E3E" }}>
                        {m.tipo === "ingreso" ? "+" : "-"}{fmtMoney(m.monto)}
                      </span>
                    </div>
                    <div style={styles.listItemBottom}>
                      <span>{formatFechaCorta(m.fecha)}</span>
                      <span>·</span>
                      <span>{m.tipo === "ingreso" ? "Ingreso" : m.categoria}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button style={styles.deleteBtn} onClick={() => abrirEditar(m)} aria-label="Editar">
                      <Pencil size={15} />
                    </button>
                    <button style={styles.deleteBtn} onClick={() => eliminarMovimiento(m)} aria-label="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {quincena.gastos.length > 0 && (
            <div style={styles.card}>
              <div style={styles.cardLabel}>Por categoría</div>
              <div style={{ marginTop: 10 }}>
                {CATEGORIAS.filter((c) => porCategoria[c] > 0).map((c) => (
                  <div key={c} style={styles.catRow}>
                    <div style={styles.catRowTop}>
                      <span style={styles.catRowLabel}>{c}</span>
                      <span style={styles.catRowValue}>{fmtMoney(porCategoria[c])}</span>
                    </div>
                    <div style={styles.catBarTrack}>
                      <div
                        style={{
                          ...styles.catBarFill,
                          width: `${(porCategoria[c] / maxCat) * 100}%`,
                          background: CAT_COLORS[c],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.corteCard}>
            <button style={styles.corteHeader} onClick={() => setShowCorte(!showCorte)}>
              <span style={styles.corteHeaderText}>
                <ArrowRightLeft size={16} /> Corte de quincena
              </span>
              {showCorte ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showCorte && (
              <div style={styles.corteBody}>
                <div style={styles.corteRow}>
                  <span>Saldo esperado</span>
                  <strong>{fmtMoney(saldoActual)}</strong>
                </div>
                <div style={styles.formRow}>
                  <label style={styles.formLabel}>Dinero real que traes en la mano</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0"
                    value={quincena.dineroReal ?? ""}
                    onChange={(e) => updateDineroReal(e.target.value)}
                    style={styles.input}
                  />
                </div>
                {diferencia !== null && (
                  <div
                    style={{
                      ...styles.diffBanner,
                      background: diferencia === 0 ? "#EAF4EE" : diferencia > 0 ? "#FBF3DE" : "#FBEAEA",
                      color: diferencia === 0 ? "#2F5D50" : diferencia > 0 ? "#8A6B1E" : "#A83E3E",
                    }}
                  >
                    {diferencia === 0
                      ? "Cuadra perfecto. Cada peso está contado."
                      : diferencia > 0
                      ? `Te sobran ${fmtMoney(diferencia)} de más — revisa si falta anotar un gasto.`
                      : `Faltan ${fmtMoney(Math.abs(diferencia))} — revisa si olvidaste registrar algo.`}
                  </div>
                )}
                <button style={styles.archiveBtn} onClick={() => iniciarNuevaQuincena(true)}>
                  <Archive size={16} /> Cerrar esta quincena y empezar otra
                </button>
              </div>
            )}
          </div>

          {saveError && (
            <div style={styles.saveErrorBanner}>
              No se pudo guardar el último cambio. Revisa tu conexión.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function QuincenaDetalle({ data }) {
  const totalGastado = (data.gastos || []).reduce((sum, g) => sum + Number(g.monto), 0);
  const totalIngresos = (data.ingresos || []).reduce((sum, i) => sum + Number(i.monto), 0);
  const saldoFinal = Number(data.saldoInicial) + totalIngresos - totalGastado;
  const porCategoria = {};
  CATEGORIAS.forEach((c) => (porCategoria[c] = 0));
  (data.gastos || []).forEach((g) => {
    porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + Number(g.monto);
  });
  const maxCat = Math.max(1, ...Object.values(porCategoria));
  const diferencia = data.dineroReal !== null && data.dineroReal !== undefined ? data.dineroReal - saldoFinal : null;

  const movimientos = useMemo(() => {
    const g = (data.gastos || []).map((x) => ({ ...x, tipo: "gasto" }));
    const i = (data.ingresos || []).map((x) => ({ ...x, tipo: "ingreso" }));
    return [...g, ...i].sort((a, b) => (b.folio || 0) - (a.folio || 0));
  }, [data]);

  return (
    <div>
      <div style={styles.subDate}>
        <CalendarDays size={14} color="#6B9080" />
        <span>{formatFechaLarga(data.fechaInicio)} → {formatFechaLarga(data.fechaCierre)}</span>
      </div>

      <div style={styles.ledPanel}>
        <div style={styles.ledLabel}>SALDO FINAL DE ESA QUINCENA</div>
        <div style={{ ...styles.ledDigits, color: saldoFinal < 0 ? "#FF6B6B" : "#7CFFB2" }}>
          {fmtMoney(saldoFinal)}
        </div>
        <div style={styles.ledSubRow}>
          <span>Inicial: {fmtMoney(data.saldoInicial)}</span>
          <span style={{ color: "#8FE0A8" }}>Ingresos: +{fmtMoney(totalIngresos)}</span>
        </div>
        <div style={styles.ledSubRow}>
          <span style={{ color: "#FF9E9E" }}>Gastado: -{fmtMoney(totalGastado)}</span>
        </div>
      </div>

      {diferencia !== null && (
        <div
          style={{
            ...styles.diffBanner,
            background: diferencia === 0 ? "#EAF4EE" : diferencia > 0 ? "#FBF3DE" : "#FBEAEA",
            color: diferencia === 0 ? "#2F5D50" : diferencia > 0 ? "#8A6B1E" : "#A83E3E",
          }}
        >
          {diferencia === 0
            ? "En el corte, cuadró perfecto."
            : diferencia > 0
            ? `En el corte sobraron ${fmtMoney(diferencia)}.`
            : `En el corte faltaron ${fmtMoney(Math.abs(diferencia))}.`}
        </div>
      )}

      {(data.gastos || []).length > 0 && (
        <div style={styles.card}>
          <div style={styles.cardLabel}>Por categoría</div>
          <div style={{ marginTop: 10 }}>
            {CATEGORIAS.filter((c) => porCategoria[c] > 0).map((c) => (
              <div key={c} style={styles.catRow}>
                <div style={styles.catRowTop}>
                  <span style={styles.catRowLabel}>{c}</span>
                  <span style={styles.catRowValue}>{fmtMoney(porCategoria[c])}</span>
                </div>
                <div style={styles.catBarTrack}>
                  <div
                    style={{
                      ...styles.catBarFill,
                      width: `${(porCategoria[c] / maxCat) * 100}%`,
                      background: CAT_COLORS[c],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.sectionTitle}>Movimientos ({movimientos.length})</div>
      <div style={styles.list}>
        {movimientos.map((m) => (
          <div key={m.id} style={styles.listItem}>
            <div
              style={{
                ...styles.catDot,
                background: m.tipo === "ingreso" ? "#6B9080" : (CAT_COLORS[m.categoria] || "#5C5C5C"),
              }}
            />
            <div style={styles.listItemBody}>
              <div style={styles.listItemTop}>
                <span style={styles.listConcepto}>
                  <span style={styles.folioTag}>#{m.folio}</span> {m.concepto}
                </span>
                <span style={{ ...styles.listMonto, color: m.tipo === "ingreso" ? "#2F5D50" : "#A83E3E" }}>
                  {m.tipo === "ingreso" ? "+" : "-"}{fmtMoney(m.monto)}
                </span>
              </div>
              <div style={styles.listItemBottom}>
                <span>{formatFechaCorta(m.fecha)}</span>
                <span>·</span>
                <span>{m.tipo === "ingreso" ? "Ingreso" : m.categoria}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== CAJA CHICA ============================== */

function CajaChicaSection() {
  const [loading, setLoading] = useState(true);
  const [denoms, setDenoms] = useState(emptyDenoms());
  const [historial, setHistorial] = useState([]);
  const [view, setView] = useState("actual"); // 'actual' | 'historial' | 'detalle'
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cur = await window.storage.get("caja-chica-actual");
        if (cur && cur.value) setDenoms(JSON.parse(cur.value));
      } catch (e) {}
      try {
        const hist = await window.storage.get("caja-historial-index");
        if (hist && hist.value) setHistorial(JSON.parse(hist.value));
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const total = useMemo(() => {
    let t = 0;
    BILLETES.forEach((d) => (t += d * (Number(denoms.billetes[d]) || 0)));
    MONEDAS.forEach((d) => (t += d * (Number(denoms.monedas[d]) || 0)));
    return t;
  }, [denoms]);

  const persistDenoms = async (next) => {
    setDenoms(next);
    try {
      const res = await window.storage.set("caja-chica-actual", JSON.stringify(next));
      setSaveError(!res);
    } catch (e) {
      setSaveError(true);
    }
  };

  const updateCantidad = (tipo, denom, valor) => {
    const n = valor === "" ? 0 : parseInt(valor, 10);
    const next = { ...denoms, [tipo]: { ...denoms[tipo], [denom]: isNaN(n) ? 0 : Math.max(0, n) } };
    persistDenoms(next);
  };

  const hacerCorte = async () => {
    const ultimoTotal = historial.length > 0 ? historial[0].total : null;
    const diferencia = ultimoTotal !== null ? total - ultimoTotal : null;
    const id = `corte-${Date.now()}`;
    const corte = {
      id,
      fecha: todayISO(),
      hora: nowTime(),
      total,
      diferencia,
      denominaciones: denoms,
    };
    const resumen = { id, fecha: corte.fecha, hora: corte.hora, total, diferencia };
    const nuevoHistorial = [resumen, ...historial].slice(0, 100);
    try {
      await window.storage.set(`caja-corte:${id}`, JSON.stringify(corte));
      await window.storage.set("caja-historial-index", JSON.stringify(nuevoHistorial));
      setHistorial(nuevoHistorial);
      setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
    setConfirmando(false);
  };

  const abrirDetalle = async (id) => {
    setLoadingDetalle(true);
    setView("detalle");
    try {
      const res = await window.storage.get(`caja-corte:${id}`);
      if (res && res.value) setDetalle(JSON.parse(res.value));
    } catch (e) {
      setDetalle(null);
    }
    setLoadingDetalle(false);
  };

  const gruposPorMes = useMemo(() => {
    const map = {};
    historial.forEach((h) => {
      const [y, m] = h.fecha.split("-").map(Number);
      const key = `${y}-${m}`;
      if (!map[key]) map[key] = { label: `${meses[m - 1]} ${y}`, items: [] };
      map[key].items.push(h);
    });
    return Object.values(map);
  }, [historial]);

  if (loading) {
    return <div style={styles.emptyState}>Cargando tu caja chica…</div>;
  }

  return (
    <div>
      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tabBtn, ...(view !== "historial" && view !== "detalle" ? styles.tabBtnActive : {}) }}
          onClick={() => setView("actual")}
        >
          <PiggyBank size={15} /> Conteo actual
        </button>
        <button
          style={{ ...styles.tabBtn, ...(view === "historial" || view === "detalle" ? styles.tabBtnActive : {}) }}
          onClick={() => setView("historial")}
        >
          <FolderClock size={15} /> Cortes anteriores
        </button>
      </div>

      {view === "historial" && (
        <div>
          <div style={styles.subDate}>
            <span>Toca un corte para ver cómo estaba repartido.</span>
          </div>
          {gruposPorMes.length === 0 ? (
            <div style={styles.emptyState}>Todavía no has hecho ningún corte de caja. Cuando hagas el primero, va a aparecer aquí.</div>
          ) : (
            gruposPorMes.map((grupo) => (
              <div key={grupo.label} style={{ marginBottom: 18 }}>
                <div style={styles.monthLabel}>{grupo.label}</div>
                <div style={styles.list}>
                  {grupo.items.map((h) => (
                    <button key={h.id} style={styles.histItemBtn} onClick={() => abrirDetalle(h.id)}>
                      <div>
                        <div style={styles.histItemDates}>{formatFechaCorta(h.fecha)} · {h.hora}</div>
                        <div style={styles.histItemMeta}>
                          {h.diferencia === null
                            ? "Primer corte"
                            : h.diferencia === 0
                            ? "Sin cambio"
                            : h.diferencia > 0
                            ? `Subió ${fmtMoney(h.diferencia)}`
                            : `Bajó ${fmtMoney(Math.abs(h.diferencia))}`}
                        </div>
                      </div>
                      <div style={styles.histItemMoney}>
                        <span style={styles.histItemFinal}>{fmtMoney(h.total)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === "detalle" && (
        <div>
          <button style={styles.backBtn} onClick={() => { setDetalle(null); setView("historial"); }}>
            <ArrowLeft size={16} /> Volver a cortes anteriores
          </button>
          {loadingDetalle || !detalle ? (
            <div style={styles.emptyState}>Cargando…</div>
          ) : (
            <CorteDetalle data={detalle} />
          )}
        </div>
      )}

      {view === "actual" && (
        <>
          <div style={styles.ledPanel}>
            <div style={styles.ledLabel}>TOTAL EN CAJA CHICA</div>
            <div style={{ ...styles.ledDigits, color: "#7CFFB2" }}>{fmtMoney(total)}</div>
            {historial.length > 0 && (
              <div style={styles.ledSubRow}>
                <span>Último corte: {fmtMoney(historial[0].total)}</span>
                <span>{formatFechaCorta(historial[0].fecha)} {historial[0].hora}</span>
              </div>
            )}
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>Billetes</div>
            <div style={{ marginTop: 8 }}>
              {BILLETES.map((d) => (
                <DenomRow
                  key={d}
                  label={fmtDenom(d)}
                  cantidad={denoms.billetes[d] || 0}
                  subtotal={d * (Number(denoms.billetes[d]) || 0)}
                  onChange={(v) => updateCantidad("billetes", d, v)}
                />
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>Monedas</div>
            <div style={{ marginTop: 8 }}>
              {MONEDAS.map((d) => (
                <DenomRow
                  key={d}
                  label={fmtDenom(d)}
                  cantidad={denoms.monedas[d] || 0}
                  subtotal={d * (Number(denoms.monedas[d]) || 0)}
                  onChange={(v) => updateCantidad("monedas", d, v)}
                />
              ))}
            </div>
          </div>

          {!confirmando ? (
            <button style={styles.addBtn} onClick={() => setConfirmando(true)}>
              <RefreshCw size={17} /> Actualizar corte de caja
            </button>
          ) : (
            <div style={styles.formCard}>
              <div style={{ fontSize: 14, marginBottom: 12, color: "#1F2A24" }}>
                Vas a guardar en tu historial un corte con un total de <strong>{fmtMoney(total)}</strong>. ¿Ya contaste todo bien?
              </div>
              <div style={styles.formActions}>
                <button style={styles.secondaryBtn} onClick={() => setConfirmando(false)}>Cancelar</button>
                <button style={styles.primaryBtn} onClick={hacerCorte}>Confirmar corte</button>
              </div>
            </div>
          )}

          {saveError && (
            <div style={styles.saveErrorBanner}>
              No se pudo guardar el último cambio. Revisa tu conexión.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DenomRow({ label, cantidad, subtotal, onChange }) {
  return (
    <div style={styles.denomRow}>
      <span style={styles.denomLabel}>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        value={cantidad === 0 ? "" : cantidad}
        placeholder="0"
        onChange={(e) => onChange(e.target.value)}
        style={styles.denomInput}
      />
      <span style={styles.denomSubtotal}>{fmtMoney(subtotal)}</span>
    </div>
  );
}

function CorteDetalle({ data }) {
  return (
    <div>
      <div style={styles.subDate}>
        <CalendarDays size={14} color="#6B9080" />
        <span>{formatFechaLarga(data.fecha)} · {data.hora}</span>
      </div>

      <div style={styles.ledPanel}>
        <div style={styles.ledLabel}>TOTAL DE ESE CORTE</div>
        <div style={{ ...styles.ledDigits, color: "#7CFFB2" }}>{fmtMoney(data.total)}</div>
        {data.diferencia !== null && (
          <div style={styles.ledSubRow}>
            <span>{data.diferencia === 0 ? "Sin cambio vs. corte anterior" : data.diferencia > 0 ? `Subió ${fmtMoney(data.diferencia)}` : `Bajó ${fmtMoney(Math.abs(data.diferencia))}`}</span>
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.cardLabel}>Billetes</div>
        <div style={{ marginTop: 8 }}>
          {BILLETES.filter((d) => (data.denominaciones?.billetes?.[d] || 0) > 0).map((d) => (
            <div key={d} style={styles.denomRowStatic}>
              <span style={styles.denomLabel}>{fmtDenom(d)} × {data.denominaciones.billetes[d]}</span>
              <span style={styles.denomSubtotal}>{fmtMoney(d * data.denominaciones.billetes[d])}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardLabel}>Monedas</div>
        <div style={{ marginTop: 8 }}>
          {MONEDAS.filter((d) => (data.denominaciones?.monedas?.[d] || 0) > 0).map((d) => (
            <div key={d} style={styles.denomRowStatic}>
              <span style={styles.denomLabel}>{fmtDenom(d)} × {data.denominaciones.monedas[d]}</span>
              <span style={styles.denomSubtotal}>{fmtMoney(d * data.denominaciones.monedas[d])}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== PRÉSTAMOS ============================== */

function PrestamosSection() {
  const [loading, setLoading] = useState(true);
  const [prestamos, setPrestamos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [showSaldados, setShowSaldados] = useState(false);
  const [abonoFormId, setAbonoFormId] = useState(null);
  const [abonoMonto, setAbonoMonto] = useState("");
  const [abonoFecha, setAbonoFecha] = useState(todayISO());

  const [form, setForm] = useState({
    persona: "",
    monto: "",
    fecha: todayISO(),
    notas: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("prestamos");
        if (res && res.value) setPrestamos(JSON.parse(res.value));
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const persist = async (next) => {
    setPrestamos(next);
    try {
      const res = await window.storage.set("prestamos", JSON.stringify(next));
      setSaveError(!res);
    } catch (e) {
      setSaveError(true);
    }
  };

  const getPagado = (p) => (p.abonos || []).reduce((sum, a) => sum + Number(a.monto), 0);
  const getPendiente = (p) => Number(p.monto) - getPagado(p);

  const activos = prestamos.filter((p) => p.estado === "activo");
  const saldados = prestamos.filter((p) => p.estado === "saldado");
  const totalActivo = activos.reduce((sum, p) => sum + getPendiente(p), 0);

  const addPrestamo = () => {
    const monto = parseFloat(form.monto);
    if (!monto || monto <= 0 || !form.persona.trim()) return;
    const nuevo = {
      id: `p-${Date.now()}`,
      persona: form.persona.trim(),
      monto,
      fecha: form.fecha,
      notas: form.notas.trim(),
      estado: "activo",
      fechaSaldado: null,
      abonos: [],
    };
    persist([nuevo, ...prestamos]);
    setForm({ persona: "", monto: "", fecha: todayISO(), notas: "" });
    setShowForm(false);
  };

  const marcarSaldado = (id) => {
    const next = prestamos.map((p) =>
      p.id === id ? { ...p, estado: "saldado", fechaSaldado: todayISO() } : p
    );
    persist(next);
  };

  const addAbono = (id) => {
    const monto = parseFloat(abonoMonto);
    if (!monto || monto <= 0) return;
    const next = prestamos.map((p) => {
      if (p.id !== id) return p;
      const abono = { id: `a-${Date.now()}`, monto, fecha: abonoFecha };
      const nuevosAbonos = [...(p.abonos || []), abono];
      const pagadoTotal = nuevosAbonos.reduce((sum, a) => sum + Number(a.monto), 0);
      const yaSaldado = pagadoTotal >= Number(p.monto);
      return {
        ...p,
        abonos: nuevosAbonos,
        estado: yaSaldado ? "saldado" : p.estado,
        fechaSaldado: yaSaldado ? todayISO() : p.fechaSaldado,
      };
    });
    persist(next);
    setAbonoMonto("");
    setAbonoFecha(todayISO());
    setAbonoFormId(null);
  };

  const reabrir = (id) => {
    const next = prestamos.map((p) =>
      p.id === id ? { ...p, estado: "activo", fechaSaldado: null } : p
    );
    persist(next);
  };

  const eliminar = (id) => {
    persist(prestamos.filter((p) => p.id !== id));
  };

  if (loading) {
    return <div style={styles.emptyState}>Cargando tus préstamos…</div>;
  }

  return (
    <div>
      <div style={styles.ledPanel}>
        <div style={styles.ledLabel}>TOTAL POR COBRAR</div>
        <div style={{ ...styles.ledDigits, color: totalActivo > 0 ? "#FFD37C" : "#7CFFB2" }}>
          {fmtMoney(totalActivo)}
        </div>
        <div style={styles.ledSubRow}>
          <span>{activos.length} préstamo{activos.length !== 1 ? "s" : ""} activo{activos.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {!showForm ? (
        <button style={styles.addBtn} onClick={() => setShowForm(true)}>
          <Plus size={18} /> Registrar un préstamo
        </button>
      ) : (
        <div style={styles.formCard}>
          <div style={styles.formRow}>
            <label style={styles.formLabel}>¿A quién le prestaste?</label>
            <input
              type="text"
              placeholder="Nombre de la persona"
              value={form.persona}
              onChange={(e) => setForm({ ...form, persona: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.formLabel}>Monto</label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0"
              value={form.monto}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.formLabel}>Fecha</label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.formLabel}>Notas (opcional)</label>
            <input
              type="text"
              placeholder="Ej. para qué era, cuándo quedó de pagar"
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.formActions}>
            <button style={styles.secondaryBtn} onClick={() => setShowForm(false)}>Cancelar</button>
            <button style={styles.primaryBtn} onClick={addPrestamo}>Guardar préstamo</button>
          </div>
        </div>
      )}

      <div style={styles.sectionTitle}>Activos ({activos.length})</div>
      {activos.length === 0 ? (
        <div style={styles.emptyState}>No tienes préstamos activos ahorita.</div>
      ) : (
        <div style={styles.list}>
          {activos.map((p) => {
            const pagado = getPagado(p);
            const pendiente = getPendiente(p);
            const pct = Math.min(100, (pagado / Number(p.monto)) * 100);
            return (
              <div key={p.id} style={styles.prestamoItem}>
                <div style={styles.prestamoTop}>
                  <span style={styles.prestamoPersona}>{p.persona}</span>
                  <span style={styles.prestamoMonto}>{fmtMoney(p.monto)}</span>
                </div>
                <div style={styles.listItemBottom}>
                  <span>Prestado el {formatFechaCorta(p.fecha)}</span>
                  {p.notas && <><span>·</span><span>{p.notas}</span></>}
                </div>

                {pagado > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={styles.catBarTrack}>
                      <div style={{ ...styles.catBarFill, width: `${pct}%`, background: "#6B9080" }} />
                    </div>
                    <div style={styles.prestamoProgresoTexto}>
                      Pagado {fmtMoney(pagado)} · Falta {fmtMoney(pendiente)}
                    </div>
                  </div>
                )}

                {abonoFormId === p.id ? (
                  <div style={styles.abonoForm}>
                    <div style={styles.formRow}>
                      <label style={styles.formLabel}>¿Cuánto te pagó?</label>
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0"
                        value={abonoMonto}
                        onChange={(e) => setAbonoMonto(e.target.value)}
                        style={styles.input}
                        autoFocus
                      />
                    </div>
                    <div style={styles.formRow}>
                      <label style={styles.formLabel}>Fecha</label>
                      <input
                        type="date"
                        value={abonoFecha}
                        onChange={(e) => setAbonoFecha(e.target.value)}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formActions}>
                      <button style={styles.secondaryBtn} onClick={() => setAbonoFormId(null)}>Cancelar</button>
                      <button style={styles.primaryBtn} onClick={() => addAbono(p.id)}>Guardar abono</button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.prestamoActions}>
                    <button style={styles.abonarBtn} onClick={() => { setAbonoFormId(p.id); setAbonoMonto(""); setAbonoFecha(todayISO()); }}>
                      <Plus size={14} /> Registrar abono
                    </button>
                    <button style={styles.saldarBtn} onClick={() => marcarSaldado(p.id)}>
                      <Check size={14} /> Marcar como saldado
                    </button>
                    <button style={styles.deleteBtn} onClick={() => eliminar(p.id)} aria-label="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={styles.card}>
        <button style={styles.corteHeader} onClick={() => setShowSaldados(!showSaldados)}>
          <span style={styles.corteHeaderText}>Saldados ({saldados.length})</span>
          {showSaldados ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showSaldados && (
          <div style={{ marginTop: 12 }}>
            {saldados.length === 0 ? (
              <div style={{ fontSize: 13, color: "#8A8268" }}>Aún no tienes préstamos saldados.</div>
            ) : (
              <div style={styles.list}>
                {saldados.map((p) => (
                  <div key={p.id} style={styles.prestamoItem}>
                    <div style={styles.prestamoTop}>
                      <span style={styles.prestamoPersona}>{p.persona}</span>
                      <span style={{ ...styles.prestamoMonto, color: "#5C6B62" }}>{fmtMoney(p.monto)}</span>
                    </div>
                    <div style={styles.listItemBottom}>
                      <span>Prestado {formatFechaCorta(p.fecha)}</span>
                      <span>·</span>
                      <span>Saldado {formatFechaCorta(p.fechaSaldado)}</span>
                    </div>
                    <div style={styles.prestamoActions}>
                      <button style={styles.linkBtn} onClick={() => reabrir(p.id)}>Reabrir</button>
                      <button style={styles.deleteBtn} onClick={() => eliminar(p.id)} aria-label="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {saveError && (
        <div style={styles.saveErrorBanner}>
          No se pudo guardar el último cambio. Revisa tu conexión.
        </div>
      )}
    </div>
  );
}

/* ============================== RESPALDO ============================== */

async function getJSON(key) {
  try {
    const res = await window.storage.get(key);
    if (res && res.value) return JSON.parse(res.value);
    return null;
  } catch (e) {
    return null;
  }
}

async function setJSON(key, obj) {
  try {
    const res = await window.storage.set(key, JSON.stringify(obj));
    return !!res;
  } catch (e) {
    return false;
  }
}

async function collectAllData() {
  const quincenaActual = await getJSON("quincena-actual");
  const historialIndex = (await getJSON("historial-index")) || [];
  const historialQuincenas = {};
  for (const h of historialIndex) {
    const q = await getJSON(`historial-quincena:${h.id}`);
    if (q) historialQuincenas[h.id] = q;
  }
  const cajaChicaActual = await getJSON("caja-chica-actual");
  const cajaHistorialIndex = (await getJSON("caja-historial-index")) || [];
  const cajaCortes = {};
  for (const c of cajaHistorialIndex) {
    const co = await getJSON(`caja-corte:${c.id}`);
    if (co) cajaCortes[c.id] = co;
  }
  const prestamos = (await getJSON("prestamos")) || [];
  return {
    tipo: "respaldo-mis-finanzas",
    version: 1,
    exportadoEl: new Date().toISOString(),
    quincenaActual,
    historialIndex,
    historialQuincenas,
    cajaChicaActual,
    cajaHistorialIndex,
    cajaCortes,
    prestamos,
  };
}

async function restoreAllData(data) {
  if (data.quincenaActual) await setJSON("quincena-actual", data.quincenaActual);
  if (data.historialIndex) await setJSON("historial-index", data.historialIndex);
  if (data.historialQuincenas) {
    for (const id in data.historialQuincenas) {
      await setJSON(`historial-quincena:${id}`, data.historialQuincenas[id]);
    }
  }
  if (data.cajaChicaActual) await setJSON("caja-chica-actual", data.cajaChicaActual);
  if (data.cajaHistorialIndex) await setJSON("caja-historial-index", data.cajaHistorialIndex);
  if (data.cajaCortes) {
    for (const id in data.cajaCortes) {
      await setJSON(`caja-corte:${id}`, data.cajaCortes[id]);
    }
  }
  if (data.prestamos) await setJSON("prestamos", data.prestamos);
}

function BackupSection({ onClose }) {
  const [exportText, setExportText] = useState("");
  const [loadingExport, setLoadingExport] = useState(false);
  const [copyStatus, setCopyStatus] = useState(""); // '', 'ok', 'error'
  const [downloadStatus, setDownloadStatus] = useState("");
  const [importText, setImportText] = useState("");
  const [confirmingImport, setConfirmingImport] = useState(false);
  const [importStatus, setImportStatus] = useState(""); // '', 'ok', 'error'
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setLoadingExport(true);
    setDownloadStatus("");
    const data = await collectAllData();
    const json = JSON.stringify(data, null, 2);
    setExportText(json);
    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `respaldo-mis-finanzas-${todayISO()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadStatus("ok");
    } catch (e) {
      setDownloadStatus("error");
    }
    setLoadingExport(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopyStatus("ok");
    } catch (e) {
      setCopyStatus("error");
    }
    setTimeout(() => setCopyStatus(""), 3000);
  };

  const handleImport = async () => {
    setImportStatus("");
    let parsed;
    try {
      parsed = JSON.parse(importText);
    } catch (e) {
      setImportStatus("error");
      return;
    }
    setImporting(true);
    try {
      await restoreAllData(parsed);
      setImportStatus("ok");
    } catch (e) {
      setImportStatus("error");
    }
    setImporting(false);
    setConfirmingImport(false);
  };

  return (
    <div>
      <button style={styles.backBtn} onClick={onClose}>
        <ArrowLeft size={16} /> Volver
      </button>

      <div style={styles.header}>
        <div style={styles.eyebrow}>RESPALDO</div>
        <h2 style={{ ...styles.title, fontSize: 24 }}>Guarda una copia de todo</h2>
      </div>

      <div style={styles.card}>
        <div style={styles.rowBetween}>
          <span style={{ ...styles.cardLabel, display: "flex", alignItems: "center", gap: 6 }}>
            <Download size={15} /> Exportar respaldo
          </span>
        </div>
        <div style={{ fontSize: 13, color: "#5C6B62", marginTop: 6, marginBottom: 12 }}>
          Junta tu quincena, tu historial, tu caja chica y tus préstamos en un solo archivo. Guárdalo en Google Drive, mándatelo por WhatsApp o correo, para no perderlo nunca.
        </div>
        <button style={styles.primaryBtnFull} onClick={handleExport} disabled={loadingExport}>
          {loadingExport ? "Preparando…" : "Exportar respaldo"}
        </button>
        {downloadStatus === "ok" && (
          <div style={{ ...styles.diffBanner, background: "#EAF4EE", color: "#2F5D50", marginTop: 10 }}>
            Se descargó el archivo. Si no lo viste, revisa la carpeta "Descargas" de tu celular.
          </div>
        )}
        {downloadStatus === "error" && (
          <div style={{ ...styles.diffBanner, background: "#FBEAEA", color: "#A83E3E", marginTop: 10 }}>
            No se pudo descargar directo. Usa el texto de abajo como respaldo.
          </div>
        )}

        {exportText && (
          <div style={{ marginTop: 14 }}>
            <div style={styles.formLabel}>O copia este texto y guárdalo donde quieras:</div>
            <textarea
              readOnly
              value={exportText}
              style={styles.backupTextarea}
              onFocus={(e) => e.target.select()}
            />
            <button style={styles.secondaryBtnFull} onClick={handleCopy}>
              <ClipboardCopy size={15} /> {copyStatus === "ok" ? "¡Copiado!" : "Copiar texto"}
            </button>
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={{ ...styles.cardLabel, display: "flex", alignItems: "center", gap: 6 }}>
          <Upload size={15} /> Restaurar un respaldo
        </div>
        <div style={{ fontSize: 13, color: "#5C6B62", marginTop: 6, marginBottom: 12 }}>
          Pega aquí el texto de un respaldo que hayas guardado antes.
        </div>
        <textarea
          value={importText}
          onChange={(e) => { setImportText(e.target.value); setImportStatus(""); }}
          placeholder="Pega aquí el contenido del respaldo…"
          style={styles.backupTextarea}
        />
        {!confirmingImport ? (
          <button
            style={styles.secondaryBtnFull}
            disabled={!importText.trim()}
            onClick={() => setConfirmingImport(true)}
          >
            Restaurar respaldo
          </button>
        ) : (
          <div style={{ marginTop: 10 }}>
            <div style={{ ...styles.diffBanner, background: "#FBF3DE", color: "#8A6B1E", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <TriangleAlert size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Esto va a reemplazar lo que tienes guardado ahorita con lo del respaldo. ¿Seguro que quieres continuar?</span>
            </div>
            <div style={styles.formActions}>
              <button style={styles.secondaryBtn} onClick={() => setConfirmingImport(false)}>Cancelar</button>
              <button style={styles.primaryBtn} onClick={handleImport} disabled={importing}>
                {importing ? "Restaurando…" : "Sí, restaurar"}
              </button>
            </div>
          </div>
        )}
        {importStatus === "ok" && (
          <div style={{ ...styles.diffBanner, background: "#EAF4EE", color: "#2F5D50", marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
            <ShieldCheck size={16} /> Listo, tu información se restauró. Cierra esta sección para verla.
          </div>
        )}
        {importStatus === "error" && (
          <div style={{ ...styles.diffBanner, background: "#FBEAEA", color: "#A83E3E", marginTop: 10 }}>
            Ese texto no es un respaldo válido. Revisa que lo hayas copiado completo.
          </div>
        )}
      </div>
    </div>
  );
}

const fontImports = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
`;

const styles = {
  page: {
    minHeight: "100vh",
    background: "#EFEAD8",
    fontFamily: "'Inter', sans-serif",
    color: "#1F2A24",
    position: "relative",
  },
  ledgerLines: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "repeating-linear-gradient(180deg, transparent, transparent 27px, rgba(47,93,80,0.07) 28px)",
    pointerEvents: "none",
  },
  container: {
    position: "relative",
    maxWidth: 480,
    margin: "0 auto",
    padding: "28px 18px 60px",
  },
  header: { marginBottom: 18 },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  backupIconBtn: {
    background: "#FBF8F1",
    border: "1px solid #DDD5BE",
    borderRadius: 10,
    padding: 8,
    color: "#2F5D50",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  primaryBtnFull: {
    width: "100%",
    padding: "12px 0",
    borderRadius: 8,
    border: "none",
    background: "#2F5D50",
    color: "#F6F1E7",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  secondaryBtnFull: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "11px 0",
    borderRadius: 8,
    border: "1px solid #C9BE9F",
    background: "transparent",
    color: "#2F5D50",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    marginTop: 10,
  },
  backupTextarea: {
    width: "100%",
    minHeight: 110,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #C9BE9F",
    background: "#fff",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "#5C6B62",
    boxSizing: "border-box",
    resize: "vertical",
  },
  eyebrow: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.14em",
    color: "#6B9080",
    fontWeight: 600,
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 30,
    fontWeight: 700,
    margin: "4px 0 8px",
    color: "#1F2A24",
  },
  mainTabBar: {
    display: "flex",
    gap: 6,
    background: "#E3DCC7",
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
  },
  mainTabBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    padding: "9px 4px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "#5C6B62",
    fontWeight: 600,
    fontSize: 11.5,
    cursor: "pointer",
  },
  mainTabBtnActive: {
    background: "#FBF8F1",
    color: "#1F2A24",
    boxShadow: "0 1px 3px rgba(31,42,36,0.12)",
  },
  subDate: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#5C6B62",
    marginBottom: 14,
  },
  tabBar: {
    display: "flex",
    gap: 6,
    background: "#E3DCC7",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "9px 0",
    borderRadius: 9,
    border: "none",
    background: "transparent",
    color: "#5C6B62",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  tabBtnActive: {
    background: "#FBF8F1",
    color: "#1F2A24",
    boxShadow: "0 1px 3px rgba(31,42,36,0.12)",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    color: "#2F5D50",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
    marginBottom: 14,
  },
  monthLabel: {
    fontFamily: "'Fraunces', serif",
    fontSize: 16,
    fontWeight: 600,
    color: "#1F2A24",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  histItemBtn: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#FBF8F1",
    border: "1px solid #E3DCC7",
    borderRadius: 12,
    padding: "12px 14px",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
  },
  histItemDates: { fontSize: 14, fontWeight: 600, color: "#1F2A24" },
  histItemMeta: { fontSize: 11, color: "#8A8268", marginTop: 2 },
  histItemMoney: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 },
  histItemGastado: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13,
    fontWeight: 600,
    color: "#A83E3E",
  },
  histItemFinal: { fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", color: "#5C6B62" },
  ledPanel: {
    background: "#16221D",
    borderRadius: 16,
    padding: "20px 20px 16px",
    marginBottom: 16,
    boxShadow: "0 6px 20px rgba(22,34,29,0.25)",
  },
  ledLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.12em",
    color: "#5C8A73",
    marginBottom: 6,
  },
  ledDigits: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 40,
    fontWeight: 600,
    lineHeight: 1.1,
    textShadow: "0 0 12px rgba(124,255,178,0.35)",
  },
  ledSubRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 10,
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    color: "#8FA89A",
  },
  card: {
    background: "#FBF8F1",
    border: "1px solid #DDD5BE",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { fontSize: 13, fontWeight: 600, color: "#5C6B62" },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#2F5D50",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
  },
  moneyDisplay: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 24,
    fontWeight: 600,
    marginTop: 6,
    color: "#1F2A24",
  },
  inputMoney: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 22,
    fontWeight: 600,
    marginTop: 8,
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #C9BE9F",
    background: "#fff",
    boxSizing: "border-box",
  },
  addBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#2F5D50",
    color: "#F6F1E7",
    border: "none",
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 18,
  },
  dualBtnRow: {
    display: "flex",
    gap: 10,
    marginBottom: 18,
  },
  gastoBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    background: "#A83E3E",
    color: "#F6F1E7",
    border: "none",
    borderRadius: 12,
    padding: "13px 10px",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  ingresoBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    background: "#2F5D50",
    color: "#F6F1E7",
    border: "none",
    borderRadius: 12,
    padding: "13px 10px",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  formHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  formTipoLabel: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  folioBadge: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    fontWeight: 600,
    color: "#8A8268",
    background: "#EFE9D6",
    padding: "3px 8px",
    borderRadius: 6,
  },
  folioTag: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
    color: "#8A8268",
  },
  formCard: {
    background: "#FBF8F1",
    border: "1px solid #DDD5BE",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  formRow: { marginBottom: 12 },
  formLabel: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#5C6B62",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    padding: "10px 10px",
    borderRadius: 8,
    border: "1px solid #C9BE9F",
    background: "#fff",
    fontSize: 15,
    fontFamily: "'Inter', sans-serif",
    boxSizing: "border-box",
    color: "#1F2A24",
  },
  formActions: { display: "flex", gap: 10, marginTop: 4 },
  secondaryBtn: {
    flex: 1,
    padding: "11px 0",
    borderRadius: 8,
    border: "1px solid #C9BE9F",
    background: "transparent",
    color: "#5C6B62",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  primaryBtn: {
    flex: 2,
    padding: "11px 0",
    borderRadius: 8,
    border: "none",
    background: "#2F5D50",
    color: "#F6F1E7",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#5C6B62",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 8,
  },
  emptyState: {
    fontSize: 13,
    color: "#8A8268",
    padding: "18px 14px",
    background: "#FBF8F1",
    border: "1px dashed #C9BE9F",
    borderRadius: 12,
    marginBottom: 18,
  },
  list: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#FBF8F1",
    border: "1px solid #E3DCC7",
    borderRadius: 12,
    padding: "10px 12px",
  },
  catDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  listItemBody: { flex: 1, minWidth: 0 },
  listItemTop: { display: "flex", justifyContent: "space-between", gap: 8 },
  listConcepto: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1F2A24",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  listMonto: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 14,
    fontWeight: 600,
    color: "#A83E3E",
    flexShrink: 0,
  },
  listItemBottom: { display: "flex", gap: 6, fontSize: 11, color: "#8A8268", marginTop: 2 },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#B9AE93",
    cursor: "pointer",
    padding: 4,
  },
  catRow: { marginBottom: 10 },
  catRowTop: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 },
  catRowLabel: { color: "#5C6B62", fontWeight: 500 },
  catRowValue: { fontFamily: "'IBM Plex Mono', monospace", color: "#1F2A24", fontWeight: 600 },
  catBarTrack: { height: 6, background: "#E9E2CC", borderRadius: 4, overflow: "hidden" },
  catBarFill: { height: "100%", borderRadius: 4 },
  corteCard: {
    background: "#FBF8F1",
    border: "1px solid #DDD5BE",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  corteHeader: {
    width: "100%",
    background: "none",
    border: "none",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    padding: 0,
  },
  corteHeaderText: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
    fontSize: 14,
    color: "#1F2A24",
  },
  corteBody: { marginTop: 14 },
  corteRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    marginBottom: 12,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  diffBanner: {
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 12,
  },
  archiveBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#1F2A24",
    color: "#F6F1E7",
    border: "none",
    borderRadius: 10,
    padding: "12px 0",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  saveErrorBanner: {
    background: "#FBEAEA",
    color: "#A83E3E",
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 12,
    marginBottom: 14,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    fontSize: 11,
    color: "#B9AE93",
    marginTop: 20,
  },
  denomRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 0",
    borderBottom: "1px solid #EFE9D6",
  },
  denomRowStatic: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    borderBottom: "1px solid #EFE9D6",
    fontSize: 13,
  },
  denomLabel: {
    width: 64,
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 14,
    fontWeight: 600,
    color: "#1F2A24",
  },
  denomInput: {
    flex: 1,
    padding: "7px 8px",
    borderRadius: 8,
    border: "1px solid #C9BE9F",
    background: "#fff",
    fontSize: 14,
    textAlign: "center",
    boxSizing: "border-box",
  },
  denomSubtotal: {
    width: 84,
    textAlign: "right",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13,
    fontWeight: 600,
    color: "#5C6B62",
  },
  prestamoItem: {
    background: "#FBF8F1",
    border: "1px solid #E3DCC7",
    borderRadius: 12,
    padding: "12px 14px",
  },
  prestamoTop: { display: "flex", justifyContent: "space-between", gap: 8 },
  prestamoPersona: { fontSize: 15, fontWeight: 700, color: "#1F2A24" },
  prestamoMonto: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 15,
    fontWeight: 700,
    color: "#C99A3E",
  },
  prestamoActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  saldarBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#2F5D50",
    color: "#F6F1E7",
    border: "none",
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  abonarBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    color: "#2F5D50",
    border: "1px solid #2F5D50",
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  prestamoProgresoTexto: {
    fontSize: 11,
    color: "#5C6B62",
    marginTop: 5,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  abonoForm: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid #E3DCC7",
  },
};
