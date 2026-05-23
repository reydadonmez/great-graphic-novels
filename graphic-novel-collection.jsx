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

const CoverPlaceholder = ({ size = 40 }) => (
  <div style={{
    width: size, height: size * 1.4, background: "#f5f5f5", border: "1px solid #ebebeb",
    borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, color: "#ccc", fontSize: size * 0.35,
  }}>📖</div>
);

const CoverImage = ({ src, size = 40 }) =>
  src
    ? <img src={src} alt="cover" style={{ width: size, height: size * 1.4, objectFit: "cover", borderRadius: "2px", border: "1px solid #ebebeb", flexShrink: 0, display: "block" }} />
    : <CoverPlaceholder size={size} />;

export default function App() {
  const [novels, setNovels] = useState([]);
  const [ready, setReady] = useState(false);
  const [sortMode, setSortMode] = useState("alpha");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", writer: "", rating: 0, cover: null });
  const [error, setError] = useState("");
  const [added, setAdded] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [copyMsg, setCopyMsg] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const fileInputRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          if (Array.isArray(parsed)) setNovels(parsed);
        }
      } catch (e) {}
      setReady(true);
      initialized.current = true;
    };
    load();
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    window.storage.set(STORAGE_KEY, JSON.stringify(novels)).catch(() => {});
  }, [novels]);

  const sorted = useMemo(() => [...novels].sort((a, b) =>
    sortMode === "alpha" ? a.title.localeCompare(b.title) : b.rating - a.rating
  ), [novels, sortMode]);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setCoverPreview(dataUrl);
      setForm(f => ({ ...f, cover: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm({ title: "", writer: "", rating: 0, cover: null });
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAdd = () => {
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.writer.trim()) return setError("Writer is required.");
    if (!form.rating) return setError("Please select a rating.");
    const entry = { ...form, id: Date.now() };
    setNovels(prev => [...prev, entry]);
    setAdded(form.title);
    resetForm();
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

      {/* Header */}
      <div style={{ padding: "48px 56px 32px", borderBottom: "1px solid #efefef", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.18em", color: "#aaa", textTransform: "uppercase", marginBottom: "6px" }}>Personal Archive</div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "300", letterSpacing: "-0.02em", color: "#111" }}>My Graphic Novels</h1>
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
          >
            Import
          </button>
          <button onClick={() => { setShowForm(true); setError(""); resetForm(); }}
            style={{ background: "#111", color: "#fff", border: "none", padding: "11px 22px", fontSize: "13px", letterSpacing: "0.04em", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px" }}
            onMouseEnter={e => e.target.style.background = "#333"}
            onMouseLeave={e => e.target.style.background = "#111"}
          >
            + Add Novel
          </button>
        </div>
      </div>

      {/* Export hint banner */}
      {novels.length > 0 && (
        <div style={{ padding: "10px 56px", background: "#fafafa", borderBottom: "1px solid #efefef", fontSize: "12px", color: "#bbb" }}>
          💡 Use <strong style={{ color: "#999" }}>Export</strong> to save your collection as text, and <strong style={{ color: "#999" }}>Import</strong> to restore it next time.
        </div>
      )}

      {/* Sort Controls */}
      <div style={{ padding: "16px 56px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #efefef" }}>
        <span style={{ fontSize: "11px", color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", marginRight: "4px" }}>Sort</span>
        {["alpha", "rating"].map((mode) => (
          <button key={mode} onClick={() => setSortMode(mode)}
            style={{ background: sortMode === mode ? "#111" : "transparent", color: sortMode === mode ? "#fff" : "#999", border: "1px solid " + (sortMode === mode ? "#111" : "#e5e5e5"), padding: "5px 14px", fontSize: "12px", letterSpacing: "0.06em", fontFamily: "inherit", cursor: "pointer", borderRadius: "20px", transition: "all 0.15s" }}
          >
            {mode === "alpha" ? "A → Z" : "★ Rating"}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "12px", color: "#ccc" }}>
          {novels.length} {novels.length === 1 ? "volume" : "volumes"}
        </span>
      </div>

      {/* List */}
      <div style={{ padding: "8px 56px 56px" }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#ccc" }}>
            <div style={{ fontSize: "40px", marginBottom: "14px" }}>📚</div>
            <div style={{ fontSize: "14px" }}>Your shelf is empty. Add your first graphic novel.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "32px 48px 1fr 180px 100px 32px", gap: "0 16px", padding: "16px 8px 8px", borderBottom: "1px solid #efefef", fontSize: "10px", letterSpacing: "0.14em", color: "#bbb", textTransform: "uppercase" }}>
              <div>#</div><div>Cover</div><div>Title</div><div>Writer</div><div>Rating</div><div></div>
            </div>
            {sorted.map((novel, i) => (
              <div key={novel.id}
                style={{ display: "grid", gridTemplateColumns: "32px 48px 1fr 180px 100px 32px", gap: "0 16px", padding: "10px 8px", borderBottom: "1px solid #f5f5f5", alignItems: "center", transition: "background 0.1s", borderRadius: "4px", margin: "0 -8px" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ fontSize: "11px", color: "#ddd" }}>{String(i + 1).padStart(2, "0")}</div>
                <CoverImage src={novel.cover} size={36} />
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

      {/* Add Modal */}
      {showForm && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setError(""); resetForm(); } }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}
        >
          <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "36px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}>
            {added ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>✓</div>
                <div style={{ color: "#111", fontSize: "15px" }}>"{added}" added to your shelf.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "28px", color: "#111" }}>Add a Novel</div>

                {/* Cover upload */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Cover Image <span style={{ color: "#ccc", fontStyle: "normal", textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {coverPreview
                      ? <img src={coverPreview} alt="preview" style={{ width: 52, height: 72, objectFit: "cover", borderRadius: "3px", border: "1px solid #e5e5e5", flexShrink: 0 }} />
                      : <div style={{ width: 52, height: 72, background: "#f8f8f8", border: "1px dashed #ddd", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "20px", flexShrink: 0 }}>📖</div>
                    }
                    <div style={{ flex: 1 }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        style={{ display: "none" }}
                        id="cover-upload"
                      />
                      <label htmlFor="cover-upload"
                        style={{ display: "inline-block", background: "#fff", color: "#555", border: "1px solid #e5e5e5", padding: "8px 14px", fontSize: "12px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px", letterSpacing: "0.03em" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#ccc"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e5e5"}
                      >
                        {coverPreview ? "Change image" : "Choose image"}
                      </label>
                      {coverPreview && (
                        <button onClick={() => { setCoverPreview(null); setForm(f => ({ ...f, cover: null })); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          style={{ display: "block", marginTop: "6px", background: "none", border: "none", color: "#bbb", fontSize: "11px", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                          onMouseEnter={e => e.target.style.color = "#e55"}
                          onMouseLeave={e => e.target.style.color = "#bbb"}
                        >Remove</button>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Watchmen" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e5e5"} />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Writer</label>
                  <input value={form.writer} onChange={e => setForm(f => ({ ...f, writer: e.target.value }))} placeholder="e.g. Alan Moore" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e5e5"} />
                </div>
                <div style={{ marginBottom: "28px" }}>
                  <label style={{ display: "block", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Rating</label>
                  <StarRating value={form.rating} onChange={(v) => setForm(f => ({ ...f, rating: v }))} />
                </div>
                {error && <div style={{ color: "#e55", fontSize: "12px", marginBottom: "14px" }}>{error}</div>}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={handleAdd}
                    style={{ flex: 1, background: "#111", color: "#fff", border: "none", padding: "11px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px", letterSpacing: "0.04em" }}
                    onMouseEnter={e => e.target.style.background = "#333"} onMouseLeave={e => e.target.style.background = "#111"}>
                    Add to Shelf
                  </button>
                  <button onClick={() => { setShowForm(false); setError(""); resetForm(); }}
                    style={{ background: "#fff", color: "#999", border: "1px solid #e5e5e5", padding: "11px 18px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px" }}
                    onMouseEnter={e => e.target.style.borderColor = "#ccc"} onMouseLeave={e => e.target.style.borderColor = "#e5e5e5"}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowImport(false); setImportText(""); setImportError(""); } }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}
        >
          <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "36px", width: "100%", maxWidth: "440px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "8px", color: "#111" }}>Import Collection</div>
            <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "20px" }}>Paste the JSON text from a previous export.</div>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder='[{"title": "Watchmen", "writer": "Alan Moore", ...}]'
              style={{ ...inputStyle, height: "140px", resize: "vertical", fontFamily: "monospace", fontSize: "12px" }}
              onFocus={e => e.target.style.borderColor = "#111"}
              onBlur={e => e.target.style.borderColor = "#e5e5e5"}
            />
            {importError && <div style={{ color: "#e55", fontSize: "12px", marginTop: "8px", marginBottom: "0" }}>{importError}</div>}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={handleImport}
                style={{ flex: 1, background: "#111", color: "#fff", border: "none", padding: "11px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px" }}
                onMouseEnter={e => e.target.style.background = "#333"} onMouseLeave={e => e.target.style.background = "#111"}>
                Import
              </button>
              <button onClick={() => { setShowImport(false); setImportText(""); setImportError(""); }}
                style={{ background: "#fff", color: "#999", border: "1px solid #e5e5e5", padding: "11px 18px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px" }}
                onMouseEnter={e => e.target.style.borderColor = "#ccc"} onMouseLeave={e => e.target.style.borderColor = "#e5e5e5"}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
