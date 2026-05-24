import { useState, useMemo, useEffect, useRef, forwardRef } from "react";
import { supabase } from "./supabase";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── DB helpers ───────────────────────────────────────────────────────────────
const toNovel = (row) => ({
  id: row.id,
  title: row.title,
  writer: row.writer,
  rating: row.rating,
  dateRead: row.date_read || "",
  cover: row.cover || null,
});

const toRow = (novel, userId) => ({
  user_id: userId,
  title: novel.title,
  writer: novel.writer,
  rating: novel.rating,
  date_read: novel.dateRead || null,
  cover: novel.cover || null,
});

// ── Responsive hook ──────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// ── Icons ────────────────────────────────────────────────────────────────────
const ExportIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 1v9M4 6.5L7.5 10 11 6.5M2 12h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ImportIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 10V1M4 4.5L7.5 1 11 4.5M2 12h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.2 1.8a1.2 1.2 0 0 1 1.7 1.7L3.8 10.6l-2.3.6.6-2.3L9.2 1.8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GripIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="3.5" cy="2" r="1.2"/><circle cx="8.5" cy="2" r="1.2"/>
    <circle cx="3.5" cy="6" r="1.2"/><circle cx="8.5" cy="6" r="1.2"/>
    <circle cx="3.5" cy="10" r="1.2"/><circle cx="8.5" cy="10" r="1.2"/>
  </svg>
);

// ── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ value, onChange, readonly = false }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{ fontSize: readonly ? "12px" : "22px", cursor: readonly ? "default" : "pointer", color: star <= (hovered || value) ? "#111" : "#ddd", transition: "color 0.1s ease", lineHeight: 1 }}
        >★</span>
      ))}
    </div>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
};

const EMPTY_FORM = { title: "", writer: "", rating: 0, dateRead: "", cover: null };

// ── Shared form fields ───────────────────────────────────────────────────────
const FormFields = ({ f, setF, err, inputStyle }) => (
  <>
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Title</label>
      <input value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Watchmen" style={inputStyle}
        onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e5e5"} />
    </div>
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Writer</label>
      <input value={f.writer} onChange={e => setF(p => ({ ...p, writer: e.target.value }))} placeholder="e.g. Alan Moore" style={inputStyle}
        onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e5e5"} />
    </div>
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Rating</label>
      <StarRating value={f.rating} onChange={(v) => setF(p => ({ ...p, rating: v }))} />
    </div>
    <div style={{ marginBottom: "28px" }}>
      <label style={{ display: "block", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Date Read</label>
      <input type="date" value={f.dateRead} onChange={e => setF(p => ({ ...p, dateRead: e.target.value }))}
        style={{ ...inputStyle, colorScheme: "light" }}
        onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e5e5"} />
    </div>
    {err && <div style={{ color: "#e55", fontSize: "12px", marginBottom: "14px" }}>{err}</div>}
  </>
);

// ── Cover upload section ─────────────────────────────────────────────────────
const CoverUpload = ({ preview, onFile, onRemove, fileRef, inputId }) => (
  <div style={{ marginBottom: "20px" }}>
    <label style={{ display: "block", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
      Cover Image <span style={{ color: "#ccc", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
    </label>
    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
      {preview
        ? <img src={preview} alt="preview" style={{ width: 52, height: 72, objectFit: "cover", borderRadius: "3px", border: "1px solid #e5e5e5", flexShrink: 0 }} />
        : <div style={{ width: 52, height: 72, background: "#f8f8f8", border: "1px dashed #ddd", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "20px", flexShrink: 0 }}>📖</div>
      }
      <div style={{ flex: 1 }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} id={inputId} />
        <label htmlFor={inputId}
          style={{ display: "inline-block", background: "#fff", color: "#555", border: "1px solid #e5e5e5", padding: "8px 14px", fontSize: "12px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px", letterSpacing: "0.03em" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#ccc"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e5e5"}
        >{preview ? "Change image" : "Choose image"}</label>
        {preview && (
          <button onClick={onRemove}
            style={{ display: "block", marginTop: "6px", background: "none", border: "none", color: "#bbb", fontSize: "11px", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
            onMouseEnter={e => e.target.style.color = "#e55"} onMouseLeave={e => e.target.style.color = "#bbb"}
          >Remove</button>
        )}
      </div>
    </div>
  </div>
);

// ── Auth Screen ──────────────────────────────────────────────────────────────
const AuthScreen = ({ isMobile }) => {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const inputStyle = {
    width: "100%", background: "#fff", border: "1px solid #e5e5e5", color: "#111",
    padding: "10px 12px", fontSize: "14px", fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", borderRadius: "4px",
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setSent(true);
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.18em", color: "#aaa", textTransform: "uppercase", marginBottom: "8px" }}>Personal Archive</div>
          <h1 style={{ margin: 0, fontSize: isMobile ? "22px" : "28px", fontWeight: "300", letterSpacing: "-0.02em", color: "#111" }}>My Graphic Novels</h1>
        </div>

        {sent ? (
          <div style={{ textAlign: "center", color: "#555", fontSize: "14px", lineHeight: 1.6 }}>
            <div style={{ fontSize: "28px", marginBottom: "16px" }}>✉️</div>
            Check your email for a confirmation link, then come back and sign in.
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey}
                placeholder="you@example.com" style={inputStyle} autoComplete="email"
                onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e5e5"}
              />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey}
                placeholder="••••••••" style={inputStyle} autoComplete={mode === "signin" ? "current-password" : "new-password"}
                onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e5e5"}
              />
            </div>
            {error && <div style={{ color: "#e55", fontSize: "12px", marginBottom: "14px" }}>{error}</div>}
            <button
              onClick={handleSubmit} disabled={loading}
              style={{ width: "100%", background: "#111", color: "#fff", border: "none", padding: "12px", fontSize: "13px", letterSpacing: "0.04em", fontFamily: "inherit", cursor: loading ? "default" : "pointer", borderRadius: "4px", opacity: loading ? 0.6 : 1 }}
              onMouseEnter={e => { if (!loading) e.target.style.background = "#333"; }}
              onMouseLeave={e => { e.target.style.background = "#111"; }}
            >{loading ? "…" : mode === "signin" ? "Sign In" : "Create Account"}</button>
            <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "#bbb" }}>
              {mode === "signin" ? "No account? " : "Already have one? "}
              <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
                style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "12px", fontFamily: "inherit", textDecoration: "underline", padding: 0 }}>
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Novel Card ───────────────────────────────────────────────────────────────
const NovelCard = forwardRef(function NovelCard(
  { novel, onEdit, onDelete, isDragging = false, isOverlay = false, dragListeners = {}, dragAttributes = {}, style = {} },
  ref
) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      {...dragAttributes}
      {...dragListeners}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: "1px solid #e5e5e5",
        borderRadius: "8px",
        overflow: "hidden",
        position: "relative",
        cursor: isOverlay ? "grabbing" : "grab",
        userSelect: "none",
        touchAction: "none",
        boxShadow: isOverlay
          ? "0 20px 48px rgba(0,0,0,0.18)"
          : hovered ? "0 4px 16px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.05)",
        transform: isOverlay ? "rotate(2deg) scale(1.03)" : undefined,
        transition: isOverlay ? "none" : "box-shadow 0.15s",
        ...style,
      }}
    >
      {/* Grip handle – visual only */}
      <div style={{
        position: "absolute",
        top: "8px",
        right: "8px",
        color: hovered || isOverlay ? "#c0c0c0" : "transparent",
        transition: "color 0.15s",
        zIndex: 4,
        pointerEvents: "none",
        lineHeight: 1,
      }}>
        <GripIcon />
      </div>

      {/* Cover */}
      <div style={{ paddingTop: "140%", position: "relative", background: "#f0f0f0", overflow: "hidden" }}>
        {novel.cover
          ? <img src={novel.cover} alt="cover" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", color: "#ccc" }}>📖</div>
        }
      </div>

      {/* Content */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{
          fontSize: "13px",
          fontWeight: "500",
          color: "#111",
          marginBottom: "3px",
          lineHeight: "1.35",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>{novel.title}</div>
        <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{novel.writer}</div>
        <StarRating value={novel.rating} readonly />
        {novel.dateRead && (
          <div style={{ fontSize: "11px", color: "#bbb", marginTop: "5px" }}>{formatDate(novel.dateRead)}</div>
        )}
        {/* Spacer so action buttons don't overlap text */}
        <div style={{ height: "28px" }} />
      </div>

      {/* Action buttons */}
      <div style={{
        position: "absolute",
        bottom: "10px",
        right: "10px",
        display: "flex",
        gap: "4px",
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.15s",
        zIndex: 5,
      }}>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEdit(novel); }}
          style={{ background: "#fff", border: "1px solid #e5e5e5", color: "#bbb", cursor: "pointer", padding: "5px 7px", borderRadius: "4px", display: "flex", alignItems: "center", lineHeight: 1 }}
          onMouseEnter={e => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#ccc"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#bbb"; e.currentTarget.style.borderColor = "#e5e5e5"; }}
          title="Edit"
        ><EditIcon /></button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(novel.id); }}
          style={{ background: "#fff", border: "1px solid #e5e5e5", color: "#ccc", cursor: "pointer", padding: "5px 8px", borderRadius: "4px", fontSize: "16px", lineHeight: 1 }}
          onMouseEnter={e => { e.currentTarget.style.color = "#e55"; e.currentTarget.style.borderColor = "#e55"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#ccc"; e.currentTarget.style.borderColor = "#e5e5e5"; }}
          title="Delete"
        >×</button>
      </div>
    </div>
  );
});

// ── Sortable Novel Card ──────────────────────────────────────────────────────
const SortableNovelCard = ({ novel, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: novel.id });

  return (
    <NovelCard
      ref={setNodeRef}
      novel={novel}
      onEdit={onEdit}
      onDelete={onDelete}
      isDragging={isDragging}
      dragListeners={listeners}
      dragAttributes={attributes}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.25 : 1,
        zIndex: isDragging ? 10 : 0,
      }}
    />
  );
};

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const w = useWindowWidth();
  const isMobile = w < 600;
  const isTablet = w >= 600 && w < 960;
  const px = isMobile ? "16px" : isTablet ? "28px" : "56px";

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [novels, setNovels] = useState([]);
  const [ready, setReady] = useState(false);
  const [sortMode, setSortMode] = useState("alpha");

  // Drag-and-drop state
  const [activeId, setActiveId] = useState(null);
  const [customOrder, setCustomOrder] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [copyMsg, setCopyMsg] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editError, setEditError] = useState("");
  const [coverPreview, setCoverPreview] = useState(null);
  const [editCoverPreview, setEditCoverPreview] = useState(null);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load novels from Supabase ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setNovels([]); setReady(false); return; }
    supabase.from("novels").select("*").eq("user_id", user.id).order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setNovels(data.map(toNovel));
        setReady(true);
      });
  }, [user]);

  // ── Keep customOrder in sync with novels ───────────────────────────────────
  useEffect(() => {
    setCustomOrder(prev => {
      const novelIds = novels.map(n => n.id);
      const novelIdSet = new Set(novelIds);
      const kept = prev.filter(id => novelIdSet.has(id));
      const added = novelIds.filter(id => !prev.includes(id));
      return [...kept, ...added];
    });
  }, [novels]);

  // ── Displayed novels (sorted or custom-ordered) ────────────────────────────
  const displayedNovels = useMemo(() => {
    if (sortMode === "alpha") return [...novels].sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === "rating") return [...novels].sort((a, b) => b.rating - a.rating);
    return customOrder.map(id => novels.find(n => n.id === id)).filter(Boolean);
  }, [novels, sortMode, customOrder]);

  // ── DnD sensors ───────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const currentIds = displayedNovels.map(n => n.id);
    const oldIndex = currentIds.indexOf(active.id);
    const newIndex = currentIds.indexOf(over.id);
    const newOrder = arrayMove(currentIds, oldIndex, newIndex);
    setCustomOrder(newOrder);
    setSortMode("custom");
  };

  // ── Cover handler ──────────────────────────────────────────────────────────
  const makeCoverHandler = (setPreview, setFormFn) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setPreview(url);
      setFormFn(f => ({ ...f, cover: url }));
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAdd = async () => {
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.writer.trim()) return setError("Writer is required.");
    if (!form.rating) return setError("Please select a rating.");
    const { data, error } = await supabase.from("novels").insert(toRow(form, user.id)).select().single();
    if (error) return setError("Could not save. Please try again.");
    setNovels(prev => [...prev, toNovel(data)]);
    setAdded(form.title);
    resetForm();
    setError("");
    setTimeout(() => { setShowForm(false); setAdded(null); }, 1200);
  };

  const openEdit = (novel) => {
    setEditingId(novel.id);
    setEditForm({ title: novel.title, writer: novel.writer, rating: novel.rating, dateRead: novel.dateRead || "", cover: novel.cover || null });
    setEditCoverPreview(novel.cover || null);
    setEditError("");
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) return setEditError("Title is required.");
    if (!editForm.writer.trim()) return setEditError("Writer is required.");
    if (!editForm.rating) return setEditError("Please select a rating.");
    const { error } = await supabase.from("novels").update({
      title: editForm.title, writer: editForm.writer, rating: editForm.rating,
      date_read: editForm.dateRead || null, cover: editForm.cover || null,
    }).eq("id", editingId);
    if (error) return setEditError("Could not save. Please try again.");
    setNovels(prev => prev.map(n => n.id === editingId ? { ...n, ...editForm } : n));
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    await supabase.from("novels").delete().eq("id", id);
    setNovels(prev => prev.filter(n => n.id !== id));
  };

  const handleExport = () => {
    navigator.clipboard.writeText(JSON.stringify(novels, null, 2)).then(() => {
      setCopyMsg(true);
      setTimeout(() => setCopyMsg(false), 2000);
    });
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error();
      const rows = parsed.map(n => toRow(n, user.id));
      const { data, error } = await supabase.from("novels").insert(rows).select();
      if (error) throw error;
      setNovels(prev => [...prev, ...data.map(toNovel)]);
      setShowImport(false);
      setImportText("");
      setImportError("");
    } catch {
      setImportError("Invalid data. Please paste a valid export.");
    }
  };

  const handleSignOut = () => supabase.auth.signOut();

  const inputStyle = {
    width: "100%", background: "#fff", border: "1px solid #e5e5e5", color: "#111",
    padding: "10px 12px", fontSize: "14px", fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", borderRadius: "4px",
  };

  const iconBtnStyle = (active) => ({
    background: "#fff", color: active ? "#4a4" : "#bbb", border: "1px solid #e5e5e5",
    width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", borderRadius: "4px", transition: "all 0.2s", position: "relative", flexShrink: 0,
  });

  const modalOverlayStyle = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100, padding: isMobile ? "12px" : "20px",
  };

  const modalBoxStyle = {
    background: "#fff", border: "1px solid #e5e5e5", borderRadius: "8px",
    padding: isMobile ? "24px 20px" : "36px",
    width: "100%", maxWidth: "400px",
    boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
    maxHeight: "90vh", overflowY: "auto",
  };

  // ── Active novel for the drag overlay ─────────────────────────────────────
  const activeNovel = activeId ? novels.find(n => n.id === activeId) : null;

  // ── Waiting for auth to resolve ────────────────────────────────────────────
  if (!authReady) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Helvetica Neue, sans-serif", color: "#ccc", fontSize: "13px" }}>
      Loading…
    </div>
  );

  if (!user) return <AuthScreen isMobile={isMobile} />;

  if (!ready) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Helvetica Neue, sans-serif", color: "#ccc", fontSize: "13px" }}>
      Loading…
    </div>
  );

  const cardMinWidth = isMobile ? "140px" : "160px";

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#111", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: isMobile ? "24px 16px 18px" : isTablet ? "36px 28px 24px" : "48px 56px 32px",
        borderBottom: "1px solid #efefef",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "12px", flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.18em", color: "#aaa", textTransform: "uppercase", marginBottom: "6px" }}>Personal Archive</div>
          <h1 style={{ margin: 0, fontSize: isMobile ? "20px" : "28px", fontWeight: "300", letterSpacing: "-0.02em", color: "#111" }}>My Graphic Novels</h1>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {novels.length > 0 && (
            <div style={{ position: "relative" }}>
              <button onClick={handleExport} title="Export collection" style={iconBtnStyle(copyMsg)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.querySelector('.tip').style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e5e5"; e.currentTarget.querySelector('.tip').style.opacity = '0'; }}
              >
                {copyMsg ? <span style={{ fontSize: "13px", color: "#4a4" }}>✓</span> : <ExportIcon />}
                <span className="tip" style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "#111", color: "#fff", fontSize: "11px", padding: "4px 8px", borderRadius: "4px", whiteSpace: "nowrap", opacity: 0, transition: "opacity 0.15s", pointerEvents: "none" }}>
                  {copyMsg ? "Copied!" : "Export"}
                </span>
              </button>
            </div>
          )}
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowImport(true); setImportError(""); }} title="Import collection" style={iconBtnStyle(false)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.querySelector('.tip').style.opacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e5e5"; e.currentTarget.querySelector('.tip').style.opacity = '0'; }}
            >
              <ImportIcon />
              <span className="tip" style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "#111", color: "#fff", fontSize: "11px", padding: "4px 8px", borderRadius: "4px", whiteSpace: "nowrap", opacity: 0, transition: "opacity 0.15s", pointerEvents: "none" }}>Import</span>
            </button>
          </div>
          <button onClick={() => { setShowForm(true); setError(""); resetForm(); }}
            style={{ background: "#111", color: "#fff", border: "none", padding: isMobile ? "9px 14px" : "11px 22px", fontSize: "13px", letterSpacing: "0.04em", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px" }}
            onMouseEnter={e => e.target.style.background = "#333"} onMouseLeave={e => e.target.style.background = "#111"}
          >+ Add Novel</button>
          <button onClick={handleSignOut}
            style={{ background: "transparent", color: "#ccc", border: "1px solid #e5e5e5", padding: isMobile ? "8px 12px" : "10px 16px", fontSize: "12px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px", letterSpacing: "0.03em" }}
            onMouseEnter={e => { e.target.style.color = "#888"; e.target.style.borderColor = "#ccc"; }}
            onMouseLeave={e => { e.target.style.color = "#ccc"; e.target.style.borderColor = "#e5e5e5"; }}
          >Sign out</button>
        </div>
      </div>

      {/* ── Sort controls ───────────────────────────────────────────────────── */}
      <div style={{ padding: `14px ${px}`, display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #efefef", flexWrap: "wrap" }}>
        <span style={{ fontSize: "11px", color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", marginRight: "4px" }}>Sort</span>
        {[
          { key: "alpha",  label: "A → Z" },
          { key: "rating", label: "★ Rating" },
          { key: "custom", label: "Custom" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setSortMode(key)}
            style={{ background: sortMode === key ? "#111" : "transparent", color: sortMode === key ? "#fff" : "#999", border: "1px solid " + (sortMode === key ? "#111" : "#e5e5e5"), padding: "5px 14px", fontSize: "12px", letterSpacing: "0.06em", fontFamily: "inherit", cursor: "pointer", borderRadius: "20px", transition: "all 0.15s" }}
          >{label}</button>
        ))}
        {sortMode === "custom" && (
          <span style={{ fontSize: "11px", color: "#bbb", marginLeft: "4px" }}>Drag cards to rearrange</span>
        )}
        <span style={{ marginLeft: "auto", fontSize: "12px", color: "#ccc" }}>{novels.length} {novels.length === 1 ? "volume" : "volumes"}</span>
      </div>

      {/* ── Canvas ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: `20px ${px} 64px` }}>
        {displayedNovels.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#ccc" }}>
            <div style={{ fontSize: "40px", marginBottom: "14px" }}>📚</div>
            <div style={{ fontSize: "14px" }}>Your shelf is empty. Add your first graphic novel.</div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={displayedNovels.map(n => n.id)} strategy={rectSortingStrategy}>
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(auto-fill, minmax(${cardMinWidth}, 1fr))`,
                gap: isMobile ? "12px" : "16px",
              }}>
                {displayedNovels.map(novel => (
                  <SortableNovelCard
                    key={novel.id}
                    novel={novel}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
              {activeNovel ? (
                <NovelCard
                  novel={activeNovel}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* ── Add Modal ───────────────────────────────────────────────────────── */}
      {showForm && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setError(""); resetForm(); } }} style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            {added ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>✓</div>
                <div style={{ color: "#111", fontSize: "15px" }}>"{added}" added to your shelf.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "28px", color: "#111" }}>Add a Novel</div>
                <CoverUpload
                  preview={coverPreview}
                  onFile={makeCoverHandler(setCoverPreview, setForm)}
                  onRemove={() => { setCoverPreview(null); setForm(f => ({ ...f, cover: null })); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  fileRef={fileInputRef}
                  inputId="cover-upload"
                />
                <FormFields f={form} setF={setForm} err={error} inputStyle={inputStyle} />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={handleAdd} style={{ flex: 1, background: "#111", color: "#fff", border: "none", padding: "11px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px", letterSpacing: "0.04em" }}
                    onMouseEnter={e => e.target.style.background = "#333"} onMouseLeave={e => e.target.style.background = "#111"}>Add to Shelf</button>
                  <button onClick={() => { setShowForm(false); setError(""); resetForm(); }} style={{ background: "#fff", color: "#999", border: "1px solid #e5e5e5", padding: "11px 18px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px" }}
                    onMouseEnter={e => e.target.style.borderColor = "#ccc"} onMouseLeave={e => e.target.style.borderColor = "#e5e5e5"}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {editingId && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setEditingId(null); }} style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "28px", color: "#111" }}>Edit Novel</div>
            <CoverUpload
              preview={editCoverPreview}
              onFile={makeCoverHandler(setEditCoverPreview, setEditForm)}
              onRemove={() => { setEditCoverPreview(null); setEditForm(f => ({ ...f, cover: null })); if (editFileInputRef.current) editFileInputRef.current.value = ""; }}
              fileRef={editFileInputRef}
              inputId="edit-cover-upload"
            />
            <FormFields f={editForm} setF={setEditForm} err={editError} inputStyle={inputStyle} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleSaveEdit} style={{ flex: 1, background: "#111", color: "#fff", border: "none", padding: "11px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px", letterSpacing: "0.04em" }}
                onMouseEnter={e => e.target.style.background = "#333"} onMouseLeave={e => e.target.style.background = "#111"}>Save Changes</button>
              <button onClick={() => setEditingId(null)} style={{ background: "#fff", color: "#999", border: "1px solid #e5e5e5", padding: "11px 18px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px" }}
                onMouseEnter={e => e.target.style.borderColor = "#ccc"} onMouseLeave={e => e.target.style.borderColor = "#e5e5e5"}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Modal ────────────────────────────────────────────────────── */}
      {showImport && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowImport(false); setImportText(""); setImportError(""); } }} style={modalOverlayStyle}>
          <div style={{ ...modalBoxStyle, maxWidth: "440px" }}>
            <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "8px", color: "#111" }}>Import Collection</div>
            <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "20px" }}>Paste the JSON text from a previous export.</div>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder='[{"title": "Watchmen", "writer": "Alan Moore", ...}]'
              style={{ ...inputStyle, height: "140px", resize: "vertical", fontFamily: "monospace", fontSize: "12px" }}
              onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e5e5"} />
            {importError && <div style={{ color: "#e55", fontSize: "12px", marginTop: "8px" }}>{importError}</div>}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={handleImport} style={{ flex: 1, background: "#111", color: "#fff", border: "none", padding: "11px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px" }}
                onMouseEnter={e => e.target.style.background = "#333"} onMouseLeave={e => e.target.style.background = "#111"}>Import</button>
              <button onClick={() => { setShowImport(false); setImportText(""); setImportError(""); }} style={{ background: "#fff", color: "#999", border: "1px solid #e5e5e5", padding: "11px 18px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", borderRadius: "4px" }}
                onMouseEnter={e => e.target.style.borderColor = "#ccc"} onMouseLeave={e => e.target.style.borderColor = "#e5e5e5"}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
