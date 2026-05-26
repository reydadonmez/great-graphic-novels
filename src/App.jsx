import { useState, useEffect, useMemo, useCallback, useRef } from "react";

const SEED = [
  { id:"1",  title:"Watchmen",         writer:"Alan Moore",        artist:"Dave Gibbons",    colorist:"John Higgins",   publisher:"DC Comics",            year:1986, format:"Trade Paperback",  genres:["Superhero","Dystopian"],      artStyle:["Precise","Geometric"],         moods:["Dense","Harrowing"],    description:"A deconstructionist masterpiece that redefined what comics could say about power, morality, and paranoia. The one that proved the medium could do anything.",                                                                    coverColor:"#1A2744", coverAccent:"#4A6FA5", hasCover:false, dateAdded:"2024-01-15" },
  { id:"2",  title:"Maus",             writer:"Art Spiegelman",    artist:"Art Spiegelman",  colorist:"",               publisher:"Pantheon",              year:1980, format:"Complete Edition", genres:["Memoir","Historical"],         artStyle:["Scratchy","Symbolic"],          moods:["Harrowing","Essential"], description:"Spiegelman recounts his father's experience as a Holocaust survivor through allegory only the comics medium could sustain.",                                                                                                    coverColor:"#1C1C1C", coverAccent:"#C8A84B", hasCover:false, dateAdded:"2024-01-20" },
  { id:"3",  title:"Persepolis",       writer:"Marjane Satrapi",   artist:"Marjane Satrapi", colorist:"",               publisher:"Pantheon",              year:2000, format:"Complete Edition", genres:["Memoir","Political"],          artStyle:["High Contrast","Graphic"],      moods:["Vital","Personal"],     description:"Growing up during the Iranian Revolution in stark black and white — a voice at once intimate and universal.",                                                                                                                   coverColor:"#2C1A1A", coverAccent:"#8C2E24", hasCover:false, dateAdded:"2024-02-01" },
  { id:"4",  title:"Asterios Polyp",   writer:"D. Mazzucchelli",   artist:"D. Mazzucchelli", colorist:"D. Mazzucchelli",publisher:"Pantheon",              year:2009, format:"Hardcover",        genres:["Literary","Drama"],            artStyle:["Duotone","Conceptual"],         moods:["Cerebral","Beautiful"], description:"Every visual decision carries meaning: color, line weight, panel shape all encode character and theme in this quietly astounding work.",                                                                                        coverColor:"#1A2C1E", coverAccent:"#2E6B42", hasCover:false, dateAdded:"2024-02-10" },
  { id:"5",  title:"Black Hole",       writer:"Charles Burns",     artist:"Charles Burns",   colorist:"",               publisher:"Pantheon",              year:1995, format:"Complete Edition", genres:["Horror","Coming-of-age"],      artStyle:["Ligne Claire","High Contrast"], moods:["Uncanny","Psychedelic"], description:"A sexually transmitted plague mutates suburban teenagers in 1970s Seattle. Burns' immaculate inkwork transforms teen dread into mythology.",                                                                                    coverColor:"#0E0E0E", coverAccent:"#C8A84B", hasCover:false, dateAdded:"2024-02-18" },
  { id:"6",  title:"Saga, Vol. 1",     writer:"Brian K. Vaughan",  artist:"Fiona Staples",   colorist:"Fiona Staples",  publisher:"Image Comics",          year:2012, format:"Trade Paperback",  genres:["Sci-fi","Fantasy"],            artStyle:["Painterly","Expressive"],       moods:["Epic","Page-turner"],   description:"Two soldiers from opposite sides of an intergalactic war fall in love and flee with their newborn. The most ambitious ongoing epic in contemporary comics.",                                                                    coverColor:"#241A2C", coverAccent:"#5A3A8C", hasCover:false, dateAdded:"2024-03-05" },
  { id:"7",  title:"Fun Home",         writer:"Alison Bechdel",    artist:"Alison Bechdel",  colorist:"",               publisher:"Houghton Mifflin",      year:2006, format:"Hardcover",        genres:["Memoir","Literary"],           artStyle:["Crosshatch","Detailed"],        moods:["Tender","Dense"],       description:"Bechdel investigates her father's closeted life and death through literary allusion, rendered with crosshatch precision and genuine warmth.",                                                                                   coverColor:"#1A2430", coverAccent:"#246B6B", hasCover:false, dateAdded:"2024-03-12" },
  { id:"8",  title:"Blankets",         writer:"Craig Thompson",    artist:"Craig Thompson",  colorist:"",               publisher:"Top Shelf",             year:2003, format:"Complete Edition", genres:["Memoir","Romance"],            artStyle:["Flowing","Expressive"],         moods:["Tender","Nostalgic"],   description:"A winter romance set against a fundamentalist upbringing. Thompson's fluid line captures the particular ache of first love.",                                                                                                  coverColor:"#1E2A2C", coverAccent:"#4A8C9A", hasCover:false, dateAdded:"2024-03-20" },
  { id:"9",  title:"The Arrival",      writer:"Shaun Tan",         artist:"Shaun Tan",       colorist:"Shaun Tan",      publisher:"Arthur A. Levine",      year:2006, format:"Hardcover",        genres:["Wordless","Immigration"],      artStyle:["Painterly","Sepia"],            moods:["Quiet","Profound"],     description:"A wordless immigrant story told in sepia-tinged panels that achieve the wonder and total disorientation of arriving somewhere completely unknown.",                                                                             coverColor:"#2A261A", coverAccent:"#8C6824", hasCover:false, dateAdded:"2024-04-01" },
  { id:"10", title:"Sophie'nin Baladi",writer:"Filipe Melo",       artist:"Juan Cavia",      colorist:"Juan Cavia",     publisher:"Yapı Kredi Yayınları",  year:2019, format:"Hardcover",        genres:["Literary","Drama"],            artStyle:["Painterly","Atmospheric"],      moods:["Harrowing","Beautiful"],description:"A jazz musician's haunted past surfaces through memory and music, rendered in a richly painted visual language that matches the story's emotional depth.",                                                                    coverColor:"#1A2744", coverAccent:"#4A6FA5", hasCover:false, dateAdded:"2024-04-10" },
  { id:"11", title:"Vitray",           writer:"Joe Kessler",       artist:"Joe Kessler",     colorist:"",               publisher:"Fantagraphics",         year:2022, format:"Trade Paperback",  genres:["Experimental","Horror"],       artStyle:["Scratchy","Raw"],               moods:["Dense","Unsettling"],   description:"Kessler's scratchy, urgent line creates a world where form and dread are inseparable. A visceral work from one of the most distinctive voices in contemporary comics.",                                                        coverColor:"#2C1A22", coverAccent:"#8C2456", hasCover:false, dateAdded:"2024-04-15" },
  { id:"12", title:"Jimmy Corrigan",   writer:"Chris Ware",        artist:"Chris Ware",      colorist:"Chris Ware",     publisher:"Pantheon",              year:2000, format:"Hardcover",        genres:["Literary","Family Drama"],     artStyle:["Blueprint","Precise"],          moods:["Melancholic","Cerebral"],description:"The most formally inventive graphic novel ever printed. A story of failed fathers told in a self-invented visual language of breathtaking sadness.",                                                                         coverColor:"#1E1A2C", coverAccent:"#5A4A8C", hasCover:false, dateAdded:"2024-05-01" },
  { id:"13", title:"Habibi",           writer:"Craig Thompson",    artist:"Craig Thompson",  colorist:"",               publisher:"Pantheon",              year:2011, format:"Hardcover",        genres:["Literary","Fable"],            artStyle:["Ornate","Calligraphic"],        moods:["Epic","Beautiful"],     description:"An epic fable woven through with Arabic calligraphy, Islamic geometric art, and the patterns of scripture — Thompson at his most ambitious.",                                                                                   coverColor:"#2C2218", coverAccent:"#A07840", hasCover:false, dateAdded:"2024-05-10" },
  { id:"14", title:"From Hell",        writer:"Alan Moore",        artist:"Eddie Campbell",  colorist:"",               publisher:"Top Shelf",             year:1989, format:"Complete Edition", genres:["Historical","Crime"],          artStyle:["Scratchy","Expressionist"],     moods:["Dense","Harrowing"],    description:"A meticulous, obsessive dissection of the Jack the Ripper murders and the Victorian world that produced them. Moore and Campbell's magnum opus.",                                                                              coverColor:"#1A1410", coverAccent:"#6B4A24", hasCover:false, dateAdded:"2024-05-18" },
];

const EMPTY_FORM = { title:"", writer:"", artist:"", colorist:"", publisher:"", imprint:"", year:new Date().getFullYear(), format:"Trade Paperback", genres:"", artStyle:"", moods:"", description:"", coverColor:"#1A2744", coverAccent:"#4A6FA5", coverImageData:null };
const FORMATS = ["Single Issue","Trade Paperback","Hardcover","Omnibus","Deluxe Edition","Complete Edition"];
const COVER_PRESETS = [
  {bg:"#1A2744",accent:"#4A6FA5"},{bg:"#2C1A1A",accent:"#8C2E24"},{bg:"#1A2C1E",accent:"#2E6B42"},
  {bg:"#2A261A",accent:"#8C6824"},{bg:"#241A2C",accent:"#5A3A8C"},{bg:"#1A2430",accent:"#246B6B"},
  {bg:"#2C1A22",accent:"#8C2456"},{bg:"#1C1C1C",accent:"#C8A84B"},{bg:"#2C2218",accent:"#A07840"},
  {bg:"#1A1410",accent:"#6B4A24"},{bg:"#1E2A2C",accent:"#4A8C9A"},{bg:"#1E1A2C",accent:"#5A4A8C"},
];

const storage = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k,v) => { try { localStorage.setItem(k,v); } catch {} },
  remove: (k) => { try { localStorage.removeItem(k); } catch {} },
};

async function resizeImage(file, maxW=480, maxH=720) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let {width:w, height:h} = img;
        const r = Math.min(maxW/w, maxH/h, 1);
        w = Math.round(w*r); h = Math.round(h*r);
        const c = document.createElement("canvas");
        c.width=w; c.height=h;
        c.getContext("2d").drawImage(img,0,0,w,h);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [books, setBooks]             = useState([]);
  const [covers, setCovers]           = useState({});
  const [loaded, setLoaded]           = useState(false);
  const [view, setView]               = useState("directory");
  const [sort, setSort]               = useState("newest");
  const [activeGenre, setActiveGenre] = useState(null);
  const [hoveredId, setHoveredId]     = useState(null);
  const [expandedId, setExpandedId]   = useState(null);
  const [pwInput, setPwInput]         = useState("");
  const [pwError, setPwError]         = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isMobile, setIsMobile]       = useState(false);
  const fileRef                       = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,600&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap";
    document.head.appendChild(link);
    document.body.style.cssText = "margin:0;padding:0;background:#F7F4EF;";
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 760);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const raw = storage.get("panels-books");
    let b = SEED;
    if (raw) { try { b = JSON.parse(raw); } catch {} }
    else storage.set("panels-books", JSON.stringify(SEED));
    setBooks(b);
    const c = {};
    b.filter(x=>x.hasCover).forEach(x=>{const img=storage.get(`panels-cover-${x.id}`);if(img)c[x.id]=img;});
    setCovers(c);
    setLoaded(true);
  }, []);

  const save = useCallback(next => { setBooks(next); storage.set("panels-books", JSON.stringify(next)); }, []);

  const genreCounts = useMemo(() => {
    const m = {};
    books.forEach(b => b.genres.forEach(g => { m[g]=(m[g]||0)+1; }));
    return m;
  }, [books]);

  const displayed = useMemo(() => {
    let r = activeGenre ? books.filter(b=>b.genres.includes(activeGenre)) : [...books];
    switch(sort) {
      case "alpha":      r.sort((a,b)=>a.title.localeCompare(b.title)); break;
      case "alpha-desc": r.sort((a,b)=>b.title.localeCompare(a.title)); break;
      case "newest":     r.sort((a,b)=>b.dateAdded.localeCompare(a.dateAdded)); break;
      case "year-desc":  r.sort((a,b)=>b.year-a.year); break;
    }
    return r;
  }, [books, activeGenre, sort]);

  function login() {
    if (pwInput==="panels") { setView("admin"); setPwError(false); setPwInput(""); }
    else setPwError(true);
  }

  async function handleImageSelect(e) {
    const file = e.target.files[0]; if(!file) return;
    setForm(f=>({...f,coverImageData:"loading"}));
    const resized = await resizeImage(file);
    setForm(f=>({...f,coverImageData:resized}));
  }

  async function handleAdd(e) {
    e.preventDefault(); if(!form.title||!form.writer) return;
    setSaving(true);
    const id = Date.now().toString();
    const book = {
      id, title:form.title, writer:form.writer, artist:form.artist, colorist:form.colorist,
      publisher:form.publisher, imprint:form.imprint, year:Number(form.year), format:form.format,
      genres:form.genres.split(",").map(s=>s.trim()).filter(Boolean),
      artStyle:form.artStyle.split(",").map(s=>s.trim()).filter(Boolean),
      moods:form.moods.split(",").map(s=>s.trim()).filter(Boolean),
      description:form.description, coverColor:form.coverColor, coverAccent:form.coverAccent,
      hasCover:!!(form.coverImageData&&form.coverImageData!=="loading"),
      dateAdded:new Date().toISOString().slice(0,10),
    };
    if(book.hasCover){ storage.set(`panels-cover-${id}`,form.coverImageData); setCovers(p=>({...p,[id]:form.coverImageData})); }
    save([book,...books]);
    setForm(EMPTY_FORM); if(fileRef.current) fileRef.current.value="";
    setSaving(false);
  }

  async function handleCoverUpdate(bookId, file) {
    const resized = await resizeImage(file);
    storage.set(`panels-cover-${bookId}`,resized);
    setCovers(p=>({...p,[bookId]:resized}));
    save(books.map(b=>b.id===bookId?{...b,hasCover:true}:b));
  }

  function handleDelete(id) {
    save(books.filter(b=>b.id!==id));
    storage.remove(`panels-cover-${id}`);
    setCovers(p=>{const n={...p};delete n[id];return n;});
    setDeleteConfirm(null);
  }

  if(!loaded) return <div style={{background:"#F7F4EF",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace",fontSize:11,letterSpacing:"0.2em",color:"#8C8680"}}>LOADING…</div>;

  // ── Admin login ─────────────────────────────────────────────────────────
  if(view==="admin-login") return (
    <div style={{background:"#F7F4EF",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:360,padding:"2.5rem",background:"#fff",border:"1px solid #E8E2D9"}}>
        <p style={S.eyebrow}>Curator Access</p>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"2rem",fontWeight:600,color:"#0C0B09",margin:"0.25rem 0 1.5rem",lineHeight:1}}>Admin CMS</h2>
        <input type="password" placeholder="Password" value={pwInput} autoFocus
          onChange={e=>setPwInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}
          style={{...S.input,width:"100%",marginBottom:"0.5rem"}} />
        {pwError&&<p style={{fontSize:10,color:"#B03A2E",letterSpacing:"0.1em",marginBottom:"0.5rem"}}>INCORRECT PASSWORD</p>}
        <div style={{display:"flex",gap:"1rem",alignItems:"center",marginTop:"0.75rem"}}>
          <button onClick={login} style={S.btnPrimary}>Enter</button>
          <button onClick={()=>{setView("directory");setPwError(false);}} style={S.btnLink}>← Back</button>
        </div>
      </div>
    </div>
  );

  // ── Admin CMS ───────────────────────────────────────────────────────────
  if(view==="admin") return (
    <div style={{background:"#F7F4EF",minHeight:"100vh",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:isMobile?"0.85rem 1rem":"1rem 2rem",background:"#fff",borderBottom:"1px solid #E8E2D9",position:"sticky",top:0,zIndex:10,gap:"0.75rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:isMobile?"0.75rem":"1.5rem",minWidth:0,flex:1}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:isMobile?"1rem":"1.1rem",color:"#0C0B09",letterSpacing:"0.01em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Great Graphic Novels</span>
          <span style={{fontSize:10,color:"#B0A89E",letterSpacing:"0.18em",textTransform:"uppercase",borderLeft:"1px solid #E8E2D9",paddingLeft:isMobile?"0.75rem":"1.5rem",flexShrink:0}}>CMS</span>
        </div>
        <button onClick={()=>setView("directory")} style={{...S.btnLink,fontSize:isMobile?12:13,whiteSpace:"nowrap"}}>← Directory</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",minHeight:isMobile?"auto":"calc(100vh - 57px)"}}>
        {/* Form */}
        <div style={{padding:isMobile?"1.5rem 1rem":"2rem",borderRight:isMobile?"none":"1px solid #E8E2D9",borderBottom:isMobile?"1px solid #E8E2D9":"none",overflowY:isMobile?"visible":"auto",maxHeight:isMobile?"none":"calc(100vh - 57px)"}}>
          <p style={S.eyebrow}>Add entry</p>
          <form onSubmit={handleAdd}>
            {/* Cover upload */}
            <div style={{marginBottom:"1.5rem"}}>
              <label style={{...S.label,display:"block",marginBottom:8}}>Cover image</label>
              <div style={{display:"flex",gap:"1rem",alignItems:"flex-start"}}>
                <div onClick={()=>fileRef.current?.click()}
                  style={{width:72,height:100,flexShrink:0,background:form.coverImageData&&form.coverImageData!=="loading"?"transparent":form.coverColor,borderTop:`3px solid ${form.coverAccent}`,overflow:"hidden",cursor:"pointer",position:"relative",border:"1px solid #E8E2D9"}}>
                  {form.coverImageData&&form.coverImageData!=="loading"
                    ?<img src={form.coverImageData} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,opacity:.2,color:"#fff"}}>+</div>}
                </div>
                <div style={{flex:1}}>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} style={{display:"none"}}/>
                  <button type="button" onClick={()=>fileRef.current?.click()} style={{...S.btnOutline,display:"block",width:"100%",marginBottom:6}}>
                    {form.coverImageData?"Change image":"Upload cover"}
                  </button>
                  {form.coverImageData&&form.coverImageData!=="loading"&&(
                    <button type="button" onClick={()=>{setForm(f=>({...f,coverImageData:null}));if(fileRef.current)fileRef.current.value="";}} style={{...S.btnLink,fontSize:11}}>× Remove</button>
                  )}
                  <p style={{fontSize:10,color:"#B0A89E",marginTop:6,lineHeight:1.6}}>JPG / PNG · Resized to 480×720</p>
                </div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"}}>
              {[{label:"Title *",key:"title",col:"1/-1",ph:"Jimmy Corrigan"},{label:"Writer *",key:"writer",ph:"Chris Ware"},{label:"Artist",key:"artist",ph:"Chris Ware"},{label:"Colorist",key:"colorist",ph:"John Higgins"},{label:"Publisher",key:"publisher",ph:"Pantheon"},{label:"Imprint",key:"imprint",ph:"Vertigo"}].map(f=>(
                <div key={f.key} style={{display:"flex",flexDirection:"column",gap:4,gridColumn:f.col||"auto"}}>
                  <label style={S.label}>{f.label}</label>
                  <input style={S.input} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} placeholder={f.ph} required={f.label.includes("*")}/>
                </div>
              ))}
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <label style={S.label}>Year</label>
                <input style={S.input} type="number" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} min={1900} max={2100}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <label style={S.label}>Format</label>
                <select style={{...S.input,cursor:"pointer"}} value={form.format} onChange={e=>setForm({...form,format:e.target.value})}>
                  {FORMATS.map(f=><option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4,gridColumn:"1/-1"}}>
                <label style={S.label}>Description</label>
                <textarea style={{...S.input,minHeight:80,resize:"vertical"}} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Why this belongs in the directory…"/>
              </div>
              {[{label:"Genres",key:"genres",ph:"Literary, Horror"},{label:"Art Style",key:"artStyle",ph:"Painterly, Expressive"},{label:"Moods",key:"moods",ph:"Dense, Harrowing"}].map(f=>(
                <div key={f.key} style={{display:"flex",flexDirection:"column",gap:4}}>
                  <label style={S.label}>{f.label} <span style={{opacity:.5}}>(comma-sep)</span></label>
                  <input style={S.input} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} placeholder={f.ph}/>
                </div>
              ))}
              {!form.coverImageData&&(
                <div style={{display:"flex",flexDirection:"column",gap:8,gridColumn:"1/-1"}}>
                  <label style={S.label}>Fallback color</label>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {COVER_PRESETS.map((p,i)=>(
                      <div key={i} onClick={()=>setForm({...form,coverColor:p.bg,coverAccent:p.accent})}
                        style={{width:28,height:40,background:p.bg,cursor:"pointer",borderTop:`2px solid ${p.accent}`,outline:form.coverColor===p.bg?"2px solid #9C7A2A":"2px solid transparent",outlineOffset:2}}/>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button type="submit" style={{...S.btnPrimary,marginTop:"1.5rem",width:"100%"}} disabled={saving}>
              {saving?"Adding…":"+ Add to directory"}
            </button>
          </form>
        </div>
        {/* List */}
        <div style={{padding:isMobile?"1.5rem 1rem":"2rem",overflowY:isMobile?"visible":"auto",maxHeight:isMobile?"none":"calc(100vh - 57px)"}}>
          <p style={{...S.eyebrow,marginBottom:"1rem"}}>{books.length} entries</p>
          {books.map(b=>(
            <div key={b.id} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.6rem 0.5rem",borderBottom:"1px solid #E8E2D9",background:"transparent"}}>
              <div onClick={()=>{ const r=document.createElement("input"); r.type="file"; r.accept="image/*"; r.onchange=e=>{if(e.target.files[0])handleCoverUpdate(b.id,e.target.files[0]);}; r.click(); }}
                style={{width:24,height:34,flexShrink:0,background:b.coverColor,borderTop:`2px solid ${b.coverAccent}`,overflow:"hidden",cursor:"pointer"}}>
                {covers[b.id]&&<img src={covers[b.id]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,fontWeight:500,color:"#0C0B09",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",margin:0}}>{b.title}</p>
                <p style={{fontSize:10,color:"#B0A89E",margin:0,letterSpacing:"0.04em"}}>{b.writer} · {b.year}</p>
              </div>
              {deleteConfirm===b.id?(
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>handleDelete(b.id)} style={{fontSize:10,background:"#B03A2E",color:"#fff",border:"none",padding:"3px 8px",cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>Delete</button>
                  <button onClick={()=>setDeleteConfirm(null)} style={{...S.btnLink,fontSize:10}}>Cancel</button>
                </div>
              ):(
                <button onClick={()=>setDeleteConfirm(b.id)} style={{...S.btnLink,fontSize:14,opacity:.3,padding:0,lineHeight:1}}>×</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Directory ────────────────────────────────────────────────────────────
  return (
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",minHeight:"100vh",background:"#F7F4EF",fontFamily:"'DM Sans',sans-serif"}}>

      {/* ── Sidebar ── */}
      <aside style={{
        width:isMobile?"100%":240,
        flexShrink:0,
        position:isMobile?"relative":"sticky",
        top:0,
        height:isMobile?"auto":"100vh",
        display:"flex",flexDirection:"column",
        borderRight:isMobile?"none":"1px solid #E8E2D9",
        borderBottom:isMobile?"1px solid #E8E2D9":"none",
        background:"#F7F4EF",
        padding:isMobile?"1.5rem 1.25rem 1rem":"2rem 0",
        overflowY:isMobile?"visible":"auto",
      }}>
        <div style={{padding:isMobile?0:"0 1.75rem",marginBottom:isMobile?"1.25rem":0}}>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?"1.35rem":"1.05rem",fontWeight:600,color:"#0C0B09",margin:"0 0 0.25rem",lineHeight:1.2,letterSpacing:"0.01em"}}>Great Graphic Novels</p>
          <p style={{fontSize:isMobile?12:11,color:"#B0A89E",margin:isMobile?0:"0 0 2rem",lineHeight:1.5}}>A curated directory of essential graphic novels.</p>
        </div>

        {/* Sort */}
        <div style={{padding:isMobile?0:"0 1.75rem",marginBottom:isMobile?"1rem":"1.5rem"}}>
          <p style={{...S.eyebrow,marginBottom:"0.5rem"}}>Sort</p>
          <div style={{display:isMobile?"flex":"block",gap:isMobile?"0.5rem":0,flexWrap:"wrap"}}>
            {[["newest","Recently added"],["alpha","A → Z"],["year-desc","By year"],["alpha-desc","Z → A"]].map(([val,lbl])=>(
              <button key={val} onClick={()=>setSort(val)}
                style={{
                  display:isMobile?"inline-block":"block",
                  width:isMobile?"auto":"100%",
                  textAlign:"left",
                  background:isMobile&&sort===val?"#0C0B09":isMobile?"#fff":"none",
                  border:isMobile?"1px solid #E8E2D9":"none",
                  padding:isMobile?"0.35rem 0.7rem":"0.3rem 0",
                  cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif",
                  fontSize:isMobile?12:13,
                  color:isMobile&&sort===val?"#fff":sort===val?"#0C0B09":"#B0A89E",
                  fontWeight:sort===val?500:400,
                  borderRadius:isMobile?2:0,
                  transition:"all 0.15s"
                }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {!isMobile && <div style={{borderTop:"1px solid #E8E2D9",margin:"0",padding:"1.5rem 1.75rem 0"}}/>}

        {/* Genre filters */}
        <div style={{padding:isMobile?0:"0 1.75rem"}}>
          <p style={{...S.eyebrow,marginBottom:"0.75rem"}}>Genre</p>
          <div style={{display:isMobile?"flex":"block",gap:isMobile?"0.4rem":0,flexWrap:"wrap"}}>
            <button onClick={()=>setActiveGenre(null)}
              style={{
                display:isMobile?"inline-flex":"flex",
                justifyContent:"space-between",
                alignItems:"center",
                gap:isMobile?6:0,
                width:isMobile?"auto":"100%",
                background:isMobile&&!activeGenre?"#0C0B09":isMobile?"#fff":"none",
                border:isMobile?"1px solid #E8E2D9":"none",
                padding:isMobile?"0.3rem 0.65rem":"0.3rem 0",
                cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",
                fontSize:isMobile?12:13,
                color:isMobile&&!activeGenre?"#fff":!activeGenre?"#0C0B09":"#B0A89E",
                fontWeight:!activeGenre?500:400,
                borderRadius:isMobile?2:0,
              }}>
              <span>All</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,opacity:.6}}>{books.length.toString().padStart(2,"0")}</span>
            </button>
            {Object.entries(genreCounts).sort((a,b)=>b[1]-a[1]).map(([g,count])=>(
              <button key={g} onClick={()=>setActiveGenre(activeGenre===g?null:g)}
                style={{
                  display:isMobile?"inline-flex":"flex",
                  justifyContent:"space-between",
                  alignItems:"center",
                  gap:isMobile?6:0,
                  width:isMobile?"auto":"100%",
                  background:isMobile&&activeGenre===g?"#0C0B09":isMobile?"#fff":"none",
                  border:isMobile?"1px solid #E8E2D9":"none",
                  padding:isMobile?"0.3rem 0.65rem":"0.3rem 0",
                  cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif",
                  fontSize:isMobile?12:13,
                  color:isMobile&&activeGenre===g?"#fff":activeGenre===g?"#0C0B09":"#B0A89E",
                  fontWeight:activeGenre===g?500:400,
                  borderRadius:isMobile?2:0,
                  transition:"all 0.15s"
                }}>
                <span>{g}</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,opacity:.6}}>{count.toString().padStart(2,"0")}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        {!isMobile && (
          <div style={{marginTop:"auto",padding:"1.5rem 1.75rem 0",borderTop:"1px solid #E8E2D9"}}>
            <button onClick={()=>setView("admin-login")} style={{...S.btnLink,fontSize:11,opacity:.4,padding:0}}>Curator access</button>
          </div>
        )}
      </aside>

      {/* ── Main grid ── */}
      <main style={{flex:1,padding:isMobile?"1.5rem 1rem":"2rem",minWidth:0}}>
        {/* Header row */}
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:isMobile?"1.25rem":"1.75rem"}}>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?"1.4rem":"1.75rem",fontWeight:400,fontStyle:"italic",color:"#0C0B09",margin:0,lineHeight:1}}>
            {activeGenre||"All"} <span style={{fontFamily:"'DM Mono',monospace",fontSize:isMobile?11:13,fontStyle:"normal",color:"#B0A89E",marginLeft:6}}>{displayed.length}</span>
          </p>
        </div>

        {/* Grid */}
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(auto-fill,minmax(180px,1fr))",gap:isMobile?"1rem 0.75rem":"1.5rem 1.25rem"}}>
          {displayed.map(b=>(
            <div key={b.id}
              onMouseEnter={()=>setHoveredId(b.id)}
              onMouseLeave={()=>setHoveredId(null)}
              onClick={()=>setExpandedId(expandedId===b.id?null:b.id)}
              style={{cursor:"pointer"}}>

              {/* Cover */}
              <div style={{
                aspectRatio:"2/3",
                background:b.coverColor,
                position:"relative",
                overflow:"hidden",
                marginBottom:"0.6rem",
                transition:"transform 0.25s ease",
                transform:hoveredId===b.id?"scale(1.02)":"scale(1)",
              }}>
                {covers[b.id]
                  ?<img src={covers[b.id]} alt={b.title} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                  :<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:b.coverAccent}}/>
                }
                {/* Hover overlay */}
                <div style={{
                  position:"absolute",inset:0,
                  background:"rgba(12,11,9,0.04)",
                  opacity:hoveredId===b.id?1:0,
                  transition:"opacity 0.2s",
                }}/>
              </div>

              {/* Info below cover */}
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:"#0C0B09",margin:"0 0 2px",lineHeight:1.3,letterSpacing:"-0.01em"}}>{b.title}</p>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#B0A89E",margin:"0 0 6px",lineHeight:1.3}}>{b.writer}</p>

              {/* Expanded description */}
              {expandedId===b.id&&b.description&&(
                <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #E8E2D9"}}>
                  <p style={{fontSize:11,color:"#6B6560",lineHeight:1.7,margin:"0 0 6px"}}>{b.description}</p>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {b.genres.map(g=><span key={g} style={{fontSize:9,letterSpacing:"0.08em",padding:"2px 6px",border:"1px solid #E8E2D9",color:"#B0A89E",textTransform:"uppercase"}}>{g}</span>)}
                  </div>
                  <p style={{fontSize:10,color:"#B0A89E",margin:"6px 0 0",fontFamily:"'DM Mono',monospace"}}>{b.year} · {b.format}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        {isMobile && (
          <div style={{marginTop:"2rem",paddingTop:"1.25rem",borderTop:"1px solid #E8E2D9",textAlign:"center"}}>
            <button onClick={()=>setView("admin-login")} style={{...S.btnLink,fontSize:11,opacity:.4,padding:0}}>Curator access</button>
          </div>
        )}
      </main>
    </div>
  );
}

const S = {
  eyebrow: { fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:"#B0A89E",margin:0,fontFamily:"'DM Mono',monospace" },
  label:   { fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:"#8C8680",fontFamily:"'DM Mono',monospace" },
  input:   { background:"#fff",border:"1px solid #E8E2D9",color:"#0C0B09",fontFamily:"'DM Sans',sans-serif",fontSize:13,padding:"0.5rem 0.65rem",outline:"none",width:"100%",borderRadius:0 },
  btnPrimary: { fontFamily:"'DM Mono',monospace",fontSize:11,letterSpacing:"0.1em",color:"#fff",background:"#0C0B09",border:"none",padding:"0.65rem 1.5rem",cursor:"pointer" },
  btnOutline: { fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:"0.08em",color:"#6B6560",background:"transparent",border:"1px solid #E8E2D9",padding:"0.45rem 0.75rem",cursor:"pointer" },
  btnLink:    { fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#6B6560",background:"transparent",border:"none",cursor:"pointer",padding:"0.25rem 0",letterSpacing:0 },
};
