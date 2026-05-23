import { useState, useMemo, useEffect, useRef } from "react";

const STORAGE_KEY = "graphic-novels-v1";

const StarRating = ({ value, onChange, readonly = false }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{ fontSize: readonly ? "13px" : "22px", cursor: readonly ? "default" : "pointer", color: star <= (hovered || value) ? "#111" : "#ddd", transition: "color 0.1s ease", lineHeight: 1 }}
        >★</span>
      ))}
    </div>
  );
};

export default function App() {
  const [novels, setNovels] = useState([]);
  const [ready, setReady] = useState(false);
  const [sortMode, setSortMode] = useState("alpha");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", writer: "", rating: 0 });
  const [error, setError] = useState("");
  const [added, setAdded] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [copyMsg, setCopyMsg] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setNovels(parsed);
      }
    } catch (e) {}
    setReady(true);
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novels));
    } catch (e) {}
  }, [novels]);

  const sorted = useMemo(() => [...novels].sort((a, b) =>
    sortMode === "alpha" ? a.title.localeCompare(b.title) : b.rating - a.rating
  ), [novels, sortMode]);

  const handleAdd = () => {
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.writer.trim()) return setError("Writer is required.");
    if (!form.rating) return setError("Please select a rating.");
    const entry = { ...form, id: Date.now() };
    setNovels(prev => [...prev, entry]);
    setAdded(form.title);
    setForm({ title: "", writer: "", rating: 0 });
    setError("");
    setTimeout(() => { setShowForm(false); setAdded(null); }, 1200);
  };

  const handleDelete = (id) => setNovels(prev => prev.filter(n => n.id !== id));

  const handleExport = () => {
    const data = JSON.stringify(novels, null, 2);
    navigator.clipboard.writeText(data).then(() => {
      setCopyMsg(true);
      setTimeout(() => setCopyMsg(false), 2000);
    });
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error();
      setNovels(parsed);
      setShowImport(false);
      setImportText("");
      setImportError("");
    } catch {
      setImportError("Invalid data. Please paste a valid export.");
    }
  };

  const inputStyle = {
    width: "100%", background: "#fff", border: "1px solid #e5e5e5", color: "#111",
    padding: "10px 12px", fontSize: "14px", fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", borderRadius: "4px",
  };

  if (!ready) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Helvetica Neue, sans-serif", color: "#ccc", fontSize: "13px" }}>
      Loading…
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#111", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <div style={{ padding: "48px 56px 32px", borderBottom: "1px solid #efefef", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.18em", color: "#aaa", textTransform: "uppercase", marginBottom: "6px" }}>Personal Archive</div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "300", letterSpacing: "-0.02em", color: "#111" }}>Graphic Novel Collection</h1>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {novels.length > 0 && (
            <button onClick={handleExport}
              style={{ background: "#fff", color: copyMsg ? "#4a4" : "#999", border: "1px solid #e5e5e5", padding: "10px 16px", fontSize: "12px", letterSpacing: "0.04em", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#ccc"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e5e5"}
            >
              {copyMsg ? "✓ Copied!" : "Export"}
            </button>
          )}
          <button onClick={() => { setShowImport(true); setImportError(""); }}
            style={{ background: "#fff", color: "#999", border: "1px solid #e5e5e5", padding: "10px 16px", fontSize: "12px", letterSpacing: "0.04em", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#ccc"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e5e5"}
          >Import</button>
          <button onClick={() => { setShowForm(true); setError(""); }}
            style={{ background: "#111", color: "#fff", border: "none", padding: "11px 22px", fontSize: "13px", letterSpacing: "0.04em", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px" }}
            onMouseEnter={e => e.target.style.background = "#333"}
            onMouseLeave={e => e.target.style.background = "#111"}
          >+ Add Novel</button>
        </div>
      </div>
      <div style={{ padding: "16px 56px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #efefef" }}>
        <span style={{ fontSize: "11px", color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", marginRight: "4px" }}>Sort</span>
        {["alpha", "rating"].map((mode) => (
          <button key={mode} onClick={() => setSortMode(mode)}
            style={{ background: sortMode === mode ? "#111" : "transparent", color: sortMode === mode ? "#fff" : "#999", border: "1px solid " + (sortMode === mode ? "#111" : "#e5e5e5"), padding: "5px 14px", fontSize: "12px", letterSpacing: "0.06em", fontFamily: "inherit", cursor: "pointer", borderRadius: "20px", transition: "all 0.15s" }}
          >{mode === "alpha" ? "A → Z" : "★ Rating"}</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "12px", color: "#ccc" }}>{novels.length} {novels.length === 1 ? "volume" : "volumes"}</span>
      </div>
      <div style={{ padding: "8px 56px 56px" }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#ccc" }}>
            <div style={{ fontSize: "40px", marginBottom: "14px" }}>📚</div>
            <div style={{ fontSize: "14px" }}>Your shelf is empty. Add your first graphic novel.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 180px 100px 32px", gap: "0 16px", padding: "16px 8px 8px", borderBottom: "1px solid #efefef", fontSize: "10px", letterSpacing: "0.14em", color: "#bbb", textTransform: "uppercase" }}>
              <div>#</div><div>Title</div><div>Writer</div><div>Rating</div><div></div>
            </div>
            {sorted.map((novel, i) => (
              <div key={novel.id}
                style={{ display: "grid", gridTemplateColumns: "32px 1fr 180px 100px 32px", gap: "0 16px", padding: "14px 8px", borderBottom: "1px solid #f5f5f5", alignItems: "center", transition: "background 0.1s", borderRadius: "4px", margin: "0 -8px" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ fontSize: "11px", color: "#ddd" }}>{String(i + 1).padStart(2, "0")}</div>
                <div style={{ fontSize: "15px", color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{novel.title}</div>
                <div style={{ fontSize: "13px", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{novel.writer}</div>
                <StarRating value={novel.rating} readonly />
                <button onClick={() => handleDelete(novel.id)}
                  style={{ background: "transparent", border: "none", color: "#ddd", cursor: "pointer", fontSize: "18px", padding: "0", lineHeight: 1, transition: "color 0.15s" }}
                  onMouseEnter={e => e.target.style.color = "#e55"}
                  onMouseLeave={e => e.target.style.color = "#ddd"}
                >×</button>
              </div>
            ))}
          </>
        )}
      </div>
      {showForm && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setError(""); } }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "36px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}>
            {added ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>✓</div>
                <div style={{ color: "#111", fontSize: "15px" }}>"{added}" added to your shelf.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "28px", color: "#111" }}>Add a Novel</div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Watchmen" style={inputStyle} onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e5e5"} />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Writer</label>
                  <input value={form.writer} onChange={e => setForm(f => ({ ...f, writer: e.target.value }))} placeholder="e.g. Alan Moore" style={inputStyle} onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e5e5"} />
                </div>
                <div style={{ marginBottom: "28px" }}>
                  <label style={{ display: "block", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Rating</label>
                  <StarRating value={form.rating} onChange={(v) => setForm(f => ({ ...f, rating: v }))} />
                </div>
                {error && <div style={{ color: "#e55", fontSize: "12px", marginBottom: "14px" }}>{error}</div>}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={handleAdd} style={{ flex: 1, background: "#111", color: "#fff", border: "none", padding: "11px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px", letterSpacing: "0.04em" }} onMouseEnter={e => e.target.style.background = "#333"} onMouseLeave={e => e.target.style.background = "#111"}>Add to Shelf</button>
                  <button onClick={() => { setShowForm(false); setError(""); }} style={{ background: "#fff", color: "#999", border: "1px solid #e5e5e5", padding: "11px 18px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px" }} onMouseEnter={e => e.target.style.borderColor = "#ccc"} onMouseLeave={e => e.target.style.borderColor = "#e5e5e5"}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {showImport && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowImport(false); setImportText(""); setImportError(""); } }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "36px", width: "100%", maxWidth: "440px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "8px", color: "#111" }}>Import Collection</div>
            <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "20px" }}>Paste the JSON text from a previous export.</div>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder='[{"title": "Watchmen", "writer": "Alan Moore", ...}]' style={{ ...inputStyle, height: "140px", resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e5e5"} />
            {importError && <div style={{ color: "#e55", fontSize: "12px", marginTop: "8px", marginBottom: "0" }}>{importError}</div>}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={handleImport} style={{ flex: 1, background: "#111", color: "#fff", border: "none", padding: "11px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px" }} onMouseEnter={e => e.target.style.background = "#333"} onMouseLeave={e => e.target.style.background = "#111"}>Import</button>
              <button onClick={() => { setShowImport(false); setImportText(""); setImportError(""); }} style={{ background: "#fff", color: "#999", border: "1px solid #e5e5e5", padding: "11px 18px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px" }} onMouseEnter={e => e.target.style.borderColor = "#ccc"} onMouseLeave={e => e.target.style.borderColor = "#e5e5e5"}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
