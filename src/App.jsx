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
