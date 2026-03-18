// Railway Vendor Digital License Portal
// Concepts covered:
//   2.17 - API Route Structure & Naming (mocked REST handlers)
//   2.19 - Input Validation with Zod
//   2.28 - State Management using Context & Hooks
//   2.30 - Form Handling & Validation
//   2.31 - Toasts, Modals, Feedback UI
//   2.33 - Error & Loading States

import { createContext, useContext, useReducer, useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
// 2.19 — ZOD-STYLE VALIDATION (pure JS, no lib needed)
// ─────────────────────────────────────────────
const vendorSchema = {
  validate(data) {
    const errors = {};
    if (!data.name || data.name.trim().length < 3)
      errors.name = "Full name must be at least 3 characters.";
    if (!data.stall || data.stall.trim().length < 2)
      errors.stall = "Stall/shop name is required.";
    if (!data.station || data.station.trim().length < 2)
      errors.station = "Station name is required.";
    if (!data.category)
      errors.category = "Please select a vendor category.";
    if (!data.aadhaar || !/^\d{12}$/.test(data.aadhaar))
      errors.aadhaar = "Aadhaar must be exactly 12 digits.";
    if (!data.mobile || !/^\d{10}$/.test(data.mobile))
      errors.mobile = "Mobile must be exactly 10 digits.";
    if (!data.platform || isNaN(data.platform) || +data.platform < 1 || +data.platform > 20)
      errors.platform = "Platform number must be between 1 and 20.";
    return { isValid: Object.keys(errors).length === 0, errors };
  },
};

// ─────────────────────────────────────────────
// 2.17 — MOCK API ROUTE HANDLERS
// ─────────────────────────────────────────────
const mockDB = {
  vendors: [
    { id: "VND-001", name: "Ramesh Kumar", stall: "Chai Point", station: "Nagpur", category: "Tea Stall", aadhaar: "****7890", mobile: "9876543210", platform: "3", status: "approved", appliedOn: "2024-11-10" },
    { id: "VND-002", name: "Sunita Devi", stall: "Book Nook", station: "Nagpur", category: "Bookshop", aadhaar: "****4321", mobile: "9123456780", platform: "1", status: "pending", appliedOn: "2025-01-15" },
    { id: "VND-003", name: "Arjun Pawar", stall: "Fresh Juice Hub", station: "Wardha", category: "Juice Stall", aadhaar: "****6655", mobile: "9988776655", platform: "5", status: "rejected", appliedOn: "2025-02-01" },
  ],
};

// GET /api/vendors
async function GET_vendors() {
  await delay(800);
  return { ok: true, data: mockDB.vendors };
}

// POST /api/vendors
async function POST_vendors(body) {
  await delay(1200);
  if (Math.random() < 0.05) throw new Error("Server error. Please retry.");
  const id = "VND-" + String(mockDB.vendors.length + 1).padStart(3, "0");
  const newVendor = {
    ...body,
    id,
    aadhaar: "****" + body.aadhaar.slice(-4),
    status: "pending",
    appliedOn: new Date().toISOString().split("T")[0],
  };
  mockDB.vendors.push(newVendor);
  return { ok: true, data: newVendor };
}

// PATCH /api/vendors/:id/status
async function PATCH_vendorStatus(id, status) {
  await delay(700);
  const v = mockDB.vendors.find((x) => x.id === id);
  if (!v) throw new Error("Vendor not found.");
  v.status = status;
  return { ok: true, data: v };
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─────────────────────────────────────────────
// 2.28 — CONTEXT & REDUCER STATE MANAGEMENT
// ─────────────────────────────────────────────
const AppContext = createContext(null);

const initialState = {
  vendors: [],
  loading: false,
  error: null,
  toasts: [],
  activeModal: null,
  tab: "list",
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_LOADING": return { ...state, loading: action.payload };
    case "SET_ERROR": return { ...state, error: action.payload, loading: false };
    case "SET_VENDORS": return { ...state, vendors: action.payload, loading: false };
    case "ADD_VENDOR": return { ...state, vendors: [...state.vendors, action.payload], loading: false };
    case "UPDATE_STATUS":
      return {
        ...state,
        vendors: state.vendors.map((v) =>
          v.id === action.payload.id ? { ...v, status: action.payload.status } : v
        ),
        loading: false,
      };
    case "ADD_TOAST": return { ...state, toasts: [...state.toasts, { id: Date.now(), ...action.payload }] };
    case "REMOVE_TOAST": return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };
    case "SET_MODAL": return { ...state, activeModal: action.payload };
    case "SET_TAB": return { ...state, tab: action.payload };
    default: return state;
  }
}

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const toast = (message, type = "success") => {
    dispatch({ type: "ADD_TOAST", payload: { message, type } });
  };

  const fetchVendors = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await GET_vendors();
      dispatch({ type: "SET_VENDORS", payload: res.data });
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: e.message });
      toast(e.message, "error");
    }
  };

  const submitVendor = async (data) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await POST_vendors(data);
      dispatch({ type: "ADD_VENDOR", payload: res.data });
      toast("Application submitted! ID: " + res.data.id, "success");
      dispatch({ type: "SET_TAB", payload: "list" });
      return true;
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: e.message });
      toast(e.message, "error");
      return false;
    }
  };

  const updateStatus = async (id, status) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await PATCH_vendorStatus(id, status);
      dispatch({ type: "UPDATE_STATUS", payload: { id, status } });
      toast(`Vendor ${status === "approved" ? "approved" : "rejected"} successfully.`, status === "approved" ? "success" : "warning");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, toast, fetchVendors, submitVendor, updateStatus }}>
      {children}
    </AppContext.Provider>
  );
}

function useApp() { return useContext(AppContext); }

// ─────────────────────────────────────────────
// 2.31 — TOAST COMPONENT
// ─────────────────────────────────────────────
function Toasts() {
  const { state, dispatch } = useApp();
  useEffect(() => {
    state.toasts.forEach((t) => {
      const timer = setTimeout(() => dispatch({ type: "REMOVE_TOAST", payload: t.id }), 3500);
      return () => clearTimeout(timer);
    });
  }, [state.toasts]);

  const colors = { success: "#1a7f5a", error: "#c0392b", warning: "#b07d0c", info: "#1a5fa0" };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, display: "flex", flexDirection: "column", gap: 10 }}>
      {state.toasts.map((t) => (
        <div key={t.id} style={{
          background: "#1e2130", color: "#f1f1f1", padding: "12px 18px", borderRadius: 10,
          borderLeft: `4px solid ${colors[t.type] || colors.info}`, fontSize: 14,
          minWidth: 260, maxWidth: 340, boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          animation: "slideIn 0.3s ease",
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 2.31 — MODAL COMPONENT
// ─────────────────────────────────────────────
function Modal({ vendor, onClose }) {
  const { updateStatus } = useApp();
  if (!vendor) return null;
  const statusColor = { approved: "#1a7f5a", pending: "#b07d0c", rejected: "#c0392b" };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: "#1e2130", borderRadius: 16, padding: "28px 32px",
        minWidth: 340, maxWidth: 480, width: "90%", color: "#f0f0f0",
        border: "1px solid rgba(255,255,255,0.1)",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Georgia', serif" }}>Vendor Details</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#aaa", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            ["License ID", vendor.id],
            ["Full Name", vendor.name],
            ["Stall Name", vendor.stall],
            ["Station", vendor.station],
            ["Category", vendor.category],
            ["Platform", vendor.platform],
            ["Aadhaar", vendor.aadhaar],
            ["Mobile", vendor.mobile],
            ["Applied On", vendor.appliedOn],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 8 }}>
              <span style={{ color: "#888", fontSize: 13 }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#888", fontSize: 13 }}>Status</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: statusColor[vendor.status] + "22", color: statusColor[vendor.status], border: `1px solid ${statusColor[vendor.status]}55` }}>
              {vendor.status.toUpperCase()}
            </span>
          </div>
        </div>
        {vendor.status === "pending" && (
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button onClick={() => { updateStatus(vendor.id, "approved"); onClose(); }}
              style={{ flex: 1, padding: "10px 0", background: "#1a7f5a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              Approve
            </button>
            <button onClick={() => { updateStatus(vendor.id, "rejected"); onClose(); }}
              style={{ flex: 1, padding: "10px 0", background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 2.30 — FORM COMPONENT WITH VALIDATION
// ─────────────────────────────────────────────
function VendorForm() {
  const { submitVendor, state, dispatch } = useApp();
  const [form, setForm] = useState({ name: "", stall: "", station: "", category: "", aadhaar: "", mobile: "", platform: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => { const c = { ...er }; delete c[name]; return c; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors: errs } = vendorSchema.validate(form);
    if (!isValid) { setErrors(errs); return; }
    setSubmitting(true);
    await submitVendor(form);
    setSubmitting(false);
    setForm({ name: "", stall: "", station: "", category: "", aadhaar: "", mobile: "", platform: "" });
  };

  const inputStyle = (field) => ({
    width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14,
    border: `1.5px solid ${errors[field] ? "#c0392b" : "rgba(255,255,255,0.12)"}`,
    background: "rgba(255,255,255,0.04)", color: "#f0f0f0", outline: "none",
    boxSizing: "border-box",
  });

  const Field = ({ label, name, type = "text", placeholder, children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, color: "#999", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>
      {children || <input name={name} type={type} placeholder={placeholder} value={form[name]} onChange={handleChange} style={inputStyle(name)} />}
      {errors[name] && <span style={{ fontSize: 12, color: "#e74c3c" }}>{errors[name]}</span>}
    </div>
  );

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontFamily: "'Georgia', serif", color: "#f0f0f0" }}>Apply for Vendor License</h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#888" }}>Fill in your details. All fields are required and validated.</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Full Name" name="name" placeholder="Your full name" />
          <Field label="Stall / Shop Name" name="stall" placeholder="e.g. Chai Point" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Railway Station" name="station" placeholder="e.g. Nagpur" />
          <Field label="Platform No." name="platform" type="number" placeholder="1–20" />
        </div>
        <Field label="Vendor Category" name="category">
          <select name="category" value={form.category} onChange={handleChange} style={{ ...inputStyle("category"), cursor: "pointer" }}>
            <option value="">Select category...</option>
            {["Tea Stall", "Coffee Stall", "Bookshop", "Snack Stall", "Juice Stall", "Newspaper Stand", "General Store"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.category && <span style={{ fontSize: 12, color: "#e74c3c" }}>{errors.category}</span>}
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Aadhaar Number (12 digits)" name="aadhaar" placeholder="123456789012" />
          <Field label="Mobile Number (10 digits)" name="mobile" placeholder="9876543210" />
        </div>

        {/* 2.19 Zod schema note */}
        <div style={{ background: "rgba(26,95,160,0.15)", border: "1px solid rgba(26,95,160,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#6baed6" }}>
          <strong style={{ color: "#90c5f0" }}>Concept 2.19 — Zod Validation:</strong> All inputs are validated against a schema (min length, digit-only, range checks) before submission.
        </div>

        <button type="submit" disabled={submitting}
          style={{ padding: "13px 0", background: submitting ? "#444" : "linear-gradient(135deg, #2563eb, #1a3fa5)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer", marginTop: 4, letterSpacing: "0.02em" }}>
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
// 2.33 — VENDOR LIST WITH LOADING & ERROR STATES
// ─────────────────────────────────────────────
function VendorList() {
  const { state, dispatch, fetchVendors } = useApp();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const statusColor = { approved: "#1a7f5a", pending: "#b07d0c", rejected: "#c0392b" };
  const statusBg = { approved: "#1a7f5a22", pending: "#b07d0c22", rejected: "#c0392b22" };

  const filtered = state.vendors.filter((v) => filter === "all" || v.status === filter);

  // 2.33 — Loading State
  if (state.loading && state.vendors.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
      <div style={{ fontSize: 36, marginBottom: 16, animation: "spin 1s linear infinite", display: "inline-block" }}>⊙</div>
      <p style={{ margin: 0, fontSize: 14 }}>Fetching vendor records from API...</p>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>GET /api/vendors</p>
    </div>
  );

  // 2.33 — Error State
  if (state.error && state.vendors.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠</div>
      <p style={{ color: "#e74c3c", fontWeight: 600, margin: "0 0 8px" }}>Failed to load vendors</p>
      <p style={{ color: "#888", fontSize: 13, margin: "0 0 20px" }}>{state.error}</p>
      <button onClick={fetchVendors} style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Retry</button>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontFamily: "'Georgia', serif", color: "#f0f0f0" }}>Vendor Registry</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>{filtered.length} records — GET /api/vendors</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid", borderColor: filter === s ? "#2563eb" : "rgba(255,255,255,0.12)", background: filter === s ? "#2563eb" : "transparent", color: filter === s ? "#fff" : "#aaa", fontSize: 12, cursor: "pointer", textTransform: "capitalize", fontWeight: filter === s ? 600 : 400 }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[["Approved", "approved", "#1a7f5a"], ["Pending", "pending", "#b07d0c"], ["Rejected", "rejected", "#c0392b"]].map(([label, key, color]) => (
          <div key={key} style={{ background: color + "15", border: `1px solid ${color}33`, borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ margin: 0, fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            <p style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 700, color }}>{state.vendors.filter((v) => v.status === key).length}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#666", fontSize: 14 }}>No vendors in this category.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((v) => (
            <div key={v.id} onClick={() => setSelected(v)}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 18px", cursor: "pointer", transition: "border-color 0.2s", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#2563eb22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {v.category === "Tea Stall" ? "🍵" : v.category === "Bookshop" ? "📚" : v.category === "Juice Stall" ? "🍹" : v.category === "Coffee Stall" ? "☕" : "🛒"}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#f0f0f0" }}>{v.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{v.stall} · {v.station} · Platform {v.platform}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 11, color: "#666" }}>{v.id}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: statusBg[v.status], color: statusColor[v.status], border: `1px solid ${statusColor[v.status]}44`, textTransform: "uppercase" }}>
                  {v.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && <Modal vendor={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// CONCEPTS BADGE PANEL
// ─────────────────────────────────────────────
function ConceptBadges({ active }) {
  const concepts = [
    { id: "2.17", label: "API Routes", desc: "GET /api/vendors, POST /api/vendors, PATCH /api/vendors/:id/status", tabs: ["list", "admin"] },
    { id: "2.19", label: "Zod Validation", desc: "Schema validates name, aadhaar (12 digits), mobile, platform range", tabs: ["apply"] },
    { id: "2.28", label: "Context & Hooks", desc: "useReducer + Context for global state: vendors, toasts, modals", tabs: ["list", "apply", "admin"] },
    { id: "2.30", label: "Form Handling", desc: "Controlled inputs, field-level error display, async submit", tabs: ["apply"] },
    { id: "2.31", label: "Toasts & Modals", desc: "Auto-dismiss toasts on submit/approve, detail modal on row click", tabs: ["list", "apply"] },
    { id: "2.33", label: "Error & Loading", desc: "Spinner on fetch, error retry button, submitting disabled state", tabs: ["list"] },
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
      {concepts.map((c) => {
        const isActive = c.tabs.includes(active);
        return (
          <div key={c.id} title={c.desc} style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "help",
            background: isActive ? "#2563eb22" : "rgba(255,255,255,0.04)",
            color: isActive ? "#60a5fa" : "#666",
            border: `1.5px solid ${isActive ? "#2563eb55" : "rgba(255,255,255,0.08)"}`,
          }}>
            {c.id} · {c.label}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
function App() {
  const { state, dispatch } = useApp();

  const tabs = [
    { id: "list", label: "Vendor Registry" },
    { id: "apply", label: "Apply for License" },
    { id: "admin", label: "Admin Panel" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#111520", color: "#f0f0f0", fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #555; }
        select option { background: #1e2130; }
        button:hover { opacity: 0.88; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "20px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, background: "#2563eb", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚆</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontFamily: "'Georgia', serif", fontWeight: 700 }}>RailVend Digital Portal</h1>
          <p style={{ margin: 0, fontSize: 12, color: "#666" }}>Vendor License Management System · Indian Railways</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => dispatch({ type: "SET_TAB", payload: t.id })}
              style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid", borderColor: state.tab === t.id ? "#2563eb" : "rgba(255,255,255,0.12)", background: state.tab === t.id ? "#2563eb" : "transparent", color: state.tab === t.id ? "#fff" : "#aaa", fontSize: 13, cursor: "pointer", fontWeight: state.tab === t.id ? 600 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
        <ConceptBadges active={state.tab} />

        {state.tab === "list" && <VendorList />}
        {state.tab === "apply" && <VendorForm />}
        {state.tab === "admin" && <AdminPanel />}
      </div>

      <Toasts />
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN PANEL (2.17 PATCH route demo)
// ─────────────────────────────────────────────
function AdminPanel() {
  const { state, updateStatus } = useApp();
  const pending = state.vendors.filter((v) => v.status === "pending");

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontFamily: "'Georgia', serif", color: "#f0f0f0" }}>Pending Approvals</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>PATCH /api/vendors/:id/status — approve or reject applications</p>
      </div>
      {pending.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#555", fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          No pending applications. All caught up!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pending.map((v) => (
            <div key={v.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{v.name} — <span style={{ color: "#888", fontWeight: 400 }}>{v.stall}</span></p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#666" }}>{v.station} · Platform {v.platform} · {v.category} · Applied: {v.appliedOn}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#555" }}>ID: {v.id}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => updateStatus(v.id, "approved")}
                  style={{ padding: "8px 18px", background: "#1a7f5a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Approve</button>
                <button onClick={() => updateStatus(v.id, "rejected")}
                  style={{ padding: "8px 18px", background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 36, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 12, padding: "18px 20px" }}>
        <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 14, color: "#60a5fa" }}>Concept 2.17 — API Route Structure</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "monospace", fontSize: 12, color: "#aaa" }}>
          <span><span style={{ color: "#34d399" }}>GET</span>    /api/vendors                — list all vendors</span>
          <span><span style={{ color: "#fbbf24" }}>POST</span>   /api/vendors                — submit new license application</span>
          <span><span style={{ color: "#a78bfa" }}>PATCH</span>  /api/vendors/:id/status     — approve or reject a vendor</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────
export default function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}