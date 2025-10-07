import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Filter, Search, Sparkles, Upload, Download, ListFilter, Stars, Tag, Calendar, MapPin, User, Image as ImageIcon, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";


// ---------------------------------------------
// Types aligned to Google Sheet schema
// ---------------------------------------------
export type Alumnus = {
  id: string; // Alumni!ID
  name: string; // Alumni!Full Name
  photoUrl?: string; // Alumni!Photo URL
  location?: string; // Alumni!Current Location
  roles?: string[]; // Alumni!Roles (comma)
  tags?: string[]; // Alumni!Tags (comma)
  bio?: string; // Alumni!Bio
  programs?: string[]; // Alumni!Programs (comma from Enums)
  featured?: boolean; // Alumni!Featured (checkbox)
  spotlight?: boolean; // Alumni!Spotlight (checkbox)
};

export type JourneyUpdate = {
  id: string; // JourneyUpdates!ID
  alumnusId: string; // JourneyUpdates!Alumnus ID
  category: string; // JourneyUpdates!Category (Enums)
  title: string;
  body?: string;
  mediaUrls?: string[];
  ctaText?: string;
  ctaUrl?: string;
  sortDate: string; // YYYY-MM-DD
  expiresAt?: string; // optional YYYY-MM-DD
};

// ---------------------------------------------
// Mock ENUMS (mirrors Enums tab)
// ---------------------------------------------
const DEFAULT_PROGRAMS = [
  "RAW",
  "ACTion",
  "CASTAWAY",
  "Global Play Initiative",
  "Travelogue",
  "Teaching Artist Residencies",
];

const DEFAULT_CATEGORIES = [
  "DAT Memory",
  "Creative Work",
  "What I’m Up To",
  "What’s Next",
];

// ---------------------------------------------
// In-memory mock data (can be replaced by API later)
// ---------------------------------------------
const seedAlumni: Alumnus[] = [
  {
    id: "A0001",
    name: "Alexis Floyd",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    location: "New York, NY, USA",
    roles: ["Actor", "Singer"],
    tags: ["TV", "Broadway"],
    bio: "DAT alum & award-winning performer…",
    programs: ["RAW", "ACTion"],
    featured: true,
    spotlight: true,
  },
  {
    id: "A0002",
    name: "Natalie Benally",
    photoUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400",
    location: "Albuquerque, NM, USA",
    roles: ["Actor", "Choreographer"],
    tags: ["Indigenous", "Dance"],
    bio: "Navajo actor & movement specialist…",
    programs: ["RAW"],
    featured: false,
    spotlight: true,
  },
  {
    id: "A0003",
    name: "Wolframio Sinué",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    location: "Quito, Ecuador",
    roles: ["Actor", "Creator"],
    tags: ["Film", "Site-Specific"],
    bio: "Ecuadorian actor & collaborator…",
    programs: ["RAW", "CASTAWAY"],
    featured: true,
    spotlight: false,
  },
];

const seedUpdates: JourneyUpdate[] = [
  {
    id: "U1001",
    alumnusId: "A0001",
    category: "Creative Work",
    title: "New EP release",
    body: "Dropped a 4-song EP exploring…",
    mediaUrls: [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800",
    ],
    ctaText: "Listen",
    ctaUrl: "https://example.com/ep",
    sortDate: "2025-08-01",
  },
  {
    id: "U1002",
    alumnusId: "A0001",
    category: "DAT Memory",
    title: "RAW showcase in Quito",
    body: "A moment from our rooftop performance…",
    mediaUrls: ["https://images.unsplash.com/photo-1541976076758-347942db1970?w=800"],
    ctaText: "View Gallery",
    ctaUrl: "https://example.com/gallery",
    sortDate: "2024-04-18",
  },
  {
    id: "U1003",
    alumnusId: "A0002",
    category: "What I’m Up To",
    title: "Movement residency",
    body: "Building a new movement piece with youth…",
    mediaUrls: ["https://images.unsplash.com/photo-1551970634-747846a548cb?w=800"],
    ctaText: "Learn More",
    ctaUrl: "https://example.com/project",
    sortDate: "2025-07-10",
  },
  {
    id: "U1004",
    alumnusId: "A0003",
    category: "What’s Next",
    title: "Film collaboration call",
    body: "Seeking a sound designer & colorist…",
    ctaText: "Collaborate",
    ctaUrl: "mailto:hello@example.com",
    sortDate: "2025-06-20",
    expiresAt: "2025-12-31",
  },
];

// ---------------------------------------------
// Tiny helper utilities
// ---------------------------------------------
const pastel = {
  yellow: "#FFF5CC",
  lavender: "#EFE6FF",
  sky: "#E6F3FF",
};

function csvJoin(a?: string[]) {
  return (a ?? []).join(", ");
}
function csvSplit(s?: string) {
  if (!s) return [] as string[];
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
const isISODate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

// ---------------------------------------------
// Faux API (swap with Apps Script later)
// ---------------------------------------------
const api = {
  async listAlumni(): Promise<Alumnus[]> {
    return new Promise((r) => setTimeout(() => r([...seedAlumni]), 150));
  },
  async listUpdates(): Promise<JourneyUpdate[]> {
    return new Promise((r) => setTimeout(() => r([...seedUpdates]), 150));
  },
};

// ---------------------------------------------
// Reusable micro components
// ---------------------------------------------
function SectionHeader({ title, hint, color }: { title: string; hint?: string; color?: string }) {
  return (
    <div className="rounded-2xl px-4 py-3 mb-4 text-sm" style={{ background: color ?? pastel.yellow }}>
      <div className="font-semibold text-slate-900">{title}</div>
      {hint && <div className="text-slate-600 mt-1">{hint}</div>}
    </div>
  );
}

function ChipInput({ label, value, onChange, placeholder }: { label: string; value?: string[]; onChange: (v: string[]) => void; placeholder?: string; }) {
  const [text, setText] = useState("");
  const items = value ?? [];
  return (
    <div className="w-full">
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((t, i) => (
          <Badge key={t+ i} variant="secondary" className="rounded-full px-3 py-1 text-[11px]">{t}</Badge>
        ))}
      </div>
      <Input
        value={text}
        placeholder={placeholder || "Type and press Enter (comma-separated)"}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const parts = csvSplit(text);
            if (parts.length) onChange([...(value ?? []), ...parts]);
            setText("");
          }
        }}
      />
    </div>
  );
}

function ISODateField({ label, value, onChange, required }: { label: string; value?: string; onChange: (v: string) => void; required?: boolean; }) {
  const valid = !value || isISODate(value);
  return (
    <div className="w-full">
      <div className="mb-1 text-xs font-medium text-slate-600">{label} {required && <span className="text-red-500">*</span>}</div>
      <Input placeholder="YYYY-MM-DD" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      {!valid && <div className="text-[11px] text-red-600 mt-1">Use YYYY-MM-DD</div>}
    </div>
  );
}

// ---------------------------------------------
// Edit Alumni Sheet (drawer)
// ---------------------------------------------
function EditAlumniSheet({ open, onOpenChange, initial, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; initial?: Partial<Alumnus>; onSave: (a: Alumnus) => void; }) {
  const [form, setForm] = useState<Alumnus>(() => ({
    id: initial?.id || "",
    name: initial?.name || "",
    photoUrl: initial?.photoUrl || "",
    location: initial?.location || "",
    roles: initial?.roles || [],
    tags: initial?.tags || [],
    bio: initial?.bio || "",
    programs: initial?.programs || [],
    featured: initial?.featured || false,
    spotlight: initial?.spotlight || false,
  }));

  useEffect(() => {
    setForm({
      id: initial?.id || "",
      name: initial?.name || "",
      photoUrl: initial?.photoUrl || "",
      location: initial?.location || "",
      roles: initial?.roles || [],
      tags: initial?.tags || [],
      bio: initial?.bio || "",
      programs: initial?.programs || [],
      featured: initial?.featured || false,
      spotlight: initial?.spotlight || false,
    });
  }, [initial]);

  const canSave = form.id.trim() && form.name.trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[540px] sm:w-[640px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{initial?.id ? "Edit Alumnus" : "New Alumnus"}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <SectionHeader title="Identity" hint="ID and Full Name are required. Photo URL is optional." color={pastel.yellow} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-xs font-medium text-slate-600">ID *</div>
              <Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="A0001" />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-slate-600">Full Name *</div>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
            </div>
            <div className="col-span-2">
              <div className="mb-1 text-xs font-medium text-slate-600">Photo URL</div>
              <Input value={form.photoUrl || ""} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://…" />
            </div>
          </div>

          <SectionHeader title="Details" hint="Roles, tags, programs are comma-separated internally. Use the chip input to add quickly." color={pastel.sky} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1 text-xs font-medium text-slate-600">Current Location</div>
              <Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, State, Country" />
            </div>
            <ChipInput label="Roles" value={form.roles} onChange={(v) => setForm({ ...form, roles: v })} placeholder="Actor, Director" />
            <ChipInput label="Tags" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} placeholder="Indigenous, LGBTQIA+" />
            <ChipInput label="Programs" value={form.programs} onChange={(v) => setForm({ ...form, programs: v })} placeholder="RAW, CASTAWAY" />
            <div className="col-span-2">
              <div className="mb-1 text-xs font-medium text-slate-600">Bio</div>
              <Textarea rows={4} value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Short bio…" />
            </div>
          </div>

          <SectionHeader title="Flags" hint="These map to checkbox columns in the Sheet (Featured, Spotlight)." color={pastel.lavender} />
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={!!form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              <span className="text-sm">Featured</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.spotlight} onCheckedChange={(v) => setForm({ ...form, spotlight: v })} />
              <span className="text-sm">Spotlight</span>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <div className="flex w-full justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={!canSave} onClick={() => canSave && onSave(form)}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------
// Edit Journey Update (dialog)
// ---------------------------------------------
function EditUpdateDialog({ open, onOpenChange, initial, alumni, categories, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; initial?: Partial<JourneyUpdate>; alumni: Alumnus[]; categories: string[]; onSave: (u: JourneyUpdate) => void; }) {
  const [form, setForm] = useState<JourneyUpdate>(() => ({
    id: initial?.id || "",
    alumnusId: initial?.alumnusId || (alumni[0]?.id ?? ""),
    category: initial?.category || categories[0] || "",
    title: initial?.title || "",
    body: initial?.body || "",
    mediaUrls: initial?.mediaUrls || [],
    ctaText: initial?.ctaText || "",
    ctaUrl: initial?.ctaUrl || "",
    sortDate: initial?.sortDate || "",
    expiresAt: initial?.expiresAt || "",
  }));

  useEffect(() => {
    setForm({
      id: initial?.id || "",
      alumnusId: initial?.alumnusId || (alumni[0]?.id ?? ""),
      category: initial?.category || categories[0] || "",
      title: initial?.title || "",
      body: initial?.body || "",
      mediaUrls: initial?.mediaUrls || [],
      ctaText: initial?.ctaText || "",
      ctaUrl: initial?.ctaUrl || "",
      sortDate: initial?.sortDate || "",
      expiresAt: initial?.expiresAt || "",
    });
  }, [initial, alumni, categories]);

  const canSave = form.id.trim() && form.alumnusId && form.category && form.title.trim() && isISODate(form.sortDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit Update" : "New Update"}</DialogTitle>
          <DialogDescription>Sort Date must be YYYY-MM-DD. Expires At is optional.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">ID *</div>
            <Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="U1200" />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">Alumnus *</div>
            <select className="w-full border rounded-md h-9 px-2" value={form.alumnusId} onChange={(e) => setForm({ ...form, alumnusId: e.target.value })}>
              {alumni.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.id})</option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">Category *</div>
            <select className="w-full border rounded-md h-9 px-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <ISODateField label="Sort Date *" value={form.sortDate} onChange={(v) => setForm({ ...form, sortDate: v })} required />
          </div>
          <div className="col-span-2">
            <div className="mb-1 text-xs font-medium text-slate-600">Title *</div>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Update title…" />
          </div>
          <div className="col-span-2">
            <div className="mb-1 text-xs font-medium text-slate-600">Body</div>
            <Textarea rows={4} value={form.body || ""} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Optional description…" />
          </div>
          <div className="col-span-2">
            <ChipInput label="Media URLs" value={form.mediaUrls} onChange={(v) => setForm({ ...form, mediaUrls: v })} placeholder="https://image.jpg, https://video.mp4" />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">CTA Text</div>
            <Input value={form.ctaText || ""} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="Learn more" />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">CTA URL</div>
            <Input value={form.ctaUrl || ""} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} placeholder="https://…" />
          </div>
          <div className="col-span-2">
            <ISODateField label="Expires At" value={form.expiresAt} onChange={(v) => setForm({ ...form, expiresAt: v })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave} onClick={() => canSave && onSave(form)}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------
// Spotlight Preview Card
// ---------------------------------------------
function SpotlightCard({ a, latest }: { a: Alumnus; latest?: JourneyUpdate | null }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 w-full bg-slate-100">
        {a.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.photoUrl} alt={a.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-400">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {a.name}
          {a.spotlight && <Sparkles className="w-4 h-4 text-purple-600" />}
          {a.featured && <Stars className="w-4 h-4 text-amber-500" />}
        </CardTitle>
        <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.location || "—"}</div>
      </CardHeader>
      <CardContent className="pt-0 text-sm">
        {a.roles && a.roles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {a.roles.map((r) => (
              <Badge key={r} variant="outline" className="rounded-full">{r}</Badge>
            ))}
          </div>
        )}
        {latest ? (
          <div className="mt-2">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Latest</div>
            <div className="font-medium">{latest.title}</div>
            {latest.ctaUrl && (
              <a href={latest.ctaUrl} className="text-xs underline text-blue-600" target="_blank" rel="noreferrer">{latest.ctaText || "Open"}</a>
            )}
          </div>
        ) : (
          <div className="text-slate-500 text-sm">No updates yet.</div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------
// Main Admin App
// ---------------------------------------------
export default function AlumniAdminApp() {
  const [alumni, setAlumni] = useState<Alumnus[]>([]);
  const [updates, setUpdates] = useState<JourneyUpdate[]>([]);
  const [programs, setPrograms] = useState<string[]>(DEFAULT_PROGRAMS);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("alumni");

  const [editAlum, setEditAlum] = useState<Alumnus | null>(null);
  const [showAlumSheet, setShowAlumSheet] = useState(false);

  const [editUpdate, setEditUpdate] = useState<JourneyUpdate | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    (async () => {
      const [a, u] = await Promise.all([api.listAlumni(), api.listUpdates()]);
      setAlumni(a);
      setUpdates(u);
    })();
  }, []);

  const filteredAlumni = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return alumni;
    return alumni.filter((a) => [
      a.id,
      a.name,
      a.location,
      csvJoin(a.roles),
      csvJoin(a.tags),
      csvJoin(a.programs),
    ].join(" ").toLowerCase().includes(term));
  }, [alumni, q]);

  const spotlightData = useMemo(() => {
    const latestByAlum: Record<string, JourneyUpdate | undefined> = {};
    for (const u of [...updates].sort((x, y) => (y.sortDate || "").localeCompare(x.sortDate || ""))) {
      if (!latestByAlum[u.alumnusId]) latestByAlum[u.alumnusId] = u;
    }
    const picks = alumni.filter((a) => a.featured || a.spotlight);
    return picks
      .map((a) => ({ a, latest: latestByAlum[a.id] }))
      .sort((x, y) => {
        const sp = Number(!!y.a.spotlight) - Number(!!x.a.spotlight);
        if (sp !== 0) return sp;
        const ft = Number(!!y.a.featured) - Number(!!x.a.featured);
        if (ft !== 0) return ft;
        return (y.latest?.sortDate || "").localeCompare(x.latest?.sortDate || "");
      });
  }, [alumni, updates]);

  // Handlers (local only for preview)
  function saveAlumnus(a: Alumnus) {
    setAlumni((prev) => {
      const ix = prev.findIndex((x) => x.id === a.id);
      if (ix >= 0) {
        const copy = [...prev];
        copy[ix] = a;
        return copy;
      }
      return [...prev, a];
    });
    setShowAlumSheet(false);
    setEditAlum(null);
  }
  function saveUpdate(u: JourneyUpdate) {
    setUpdates((prev) => {
      const ix = prev.findIndex((x) => x.id === u.id);
      if (ix >= 0) {
        const copy = [...prev];
        copy[ix] = u;
        return copy;
      }
      return [...prev, u];
    });
    setShowUpdateDialog(false);
    setEditUpdate(null);
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ alumni, updates, programs, categories }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dat-alumni-backend-preview.json"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 backdrop-blur border-b border-slate-200/70" style={{ background: "rgba(255,255,255,0.8)" }}>
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-semibold tracking-tight">DAT Alumni Admin</motion.div>
            <Badge className="rounded-full" variant="secondary">Preview</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-slate-400" />
              <Input className="pl-7 w-[240px]" placeholder="Search alumni…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><ListFilter className="w-4 h-4 mr-2" /> Filters</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Quick Filters</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setQ("spotlight:true")}>Spotlight</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setQ("featured:true")}>Featured</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setQ("")}>Clear</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={exportJSON}><Download className="w-4 h-4 mr-2" /> Export JSON</Button>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="alumni">Alumni</TabsTrigger>
              <TabsTrigger value="updates">Journey Updates</TabsTrigger>
              <TabsTrigger value="spotlight">Spotlight Preview</TabsTrigger>
              <TabsTrigger value="enums">Enums</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {tab === "alumni" && (
          <div>
            <SectionHeader title="Alumni" hint="ID & Full Name required. Roles/Tags/Programs are comma-separated in the Sheet." color={pastel.yellow} />
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-slate-600">{filteredAlumni.length} alumni</div>
              <Button onClick={() => { setEditAlum(null); setShowAlumSheet(true); }}><Plus className="w-4 h-4 mr-2" /> New Alumnus</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAlumni.map((a) => (
                <Card key={a.id} className="group overflow-hidden">
                  <div className="h-36 bg-slate-100 relative">
                    {a.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.photoUrl} alt={a.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400"><ImageIcon className="w-8 h-8" /></div>
                    )}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition">
                      <Button size="icon" variant="secondary" onClick={() => { setEditAlum(a); setShowAlumSheet(true); }}><Pencil className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">{a.name}
                      {a.spotlight && <Sparkles className="w-4 h-4 text-purple-600" />}
                      {a.featured && <Stars className="w-4 h-4 text-amber-500" />}
                    </CardTitle>
                    <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.location || "—"}</div>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm">
                    {a.roles && a.roles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {a.roles.map((r) => <Badge key={r} variant="outline" className="rounded-full">{r}</Badge>)}
                      </div>
                    )}
                    {a.programs && a.programs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {a.programs.map((p) => <Badge key={p} className="rounded-full bg-amber-50 text-amber-700" variant="secondary">{p}</Badge>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <EditAlumniSheet
              open={showAlumSheet}
              onOpenChange={setShowAlumSheet}
              initial={editAlum ?? undefined}
              onSave={saveAlumnus}
            />
          </div>
        )}

        {tab === "updates" && (
          <div>
            <SectionHeader title="Journey Updates" hint="Create and preview categorized updates. Required: ID, Alumnus, Category, Title, Sort Date." color={pastel.lavender} />
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-slate-600">{updates.length} updates</div>
              <Button onClick={() => { setEditUpdate(null); setShowUpdateDialog(true); }}><Plus className="w-4 h-4 mr-2" /> New Update</Button>
            </div>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-sm">
                <thead style={{ background: pastel.lavender }}>
                  <tr className="text-left text-slate-700">
                    <th className="px-3 py-2 font-semibold">ID</th>
                    <th className="px-3 py-2 font-semibold">Alumnus</th>
                    <th className="px-3 py-2 font-semibold">Category</th>
                    <th className="px-3 py-2 font-semibold">Title</th>
                    <th className="px-3 py-2 font-semibold">Sort Date</th>
                    <th className="px-3 py-2 font-semibold">Expires</th>
                    <th className="px-3 py-2 font-semibold">CTA</th>
                    <th className="px-3 py-2 font-semibold">Media</th>
                    <th className="px-3 py-2 font-semibold">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {updates
                    .slice()
                    .sort((a, b) => (b.sortDate || "").localeCompare(a.sortDate || ""))
                    .map((u, i) => (
                      <tr key={u.id} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                        <td className="px-3 py-2 whitespace-nowrap">{u.id}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{alumni.find((a) => a.id === u.alumnusId)?.name || u.alumnusId}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{u.category}</td>
                        <td className="px-3 py-2">{u.title}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{u.sortDate}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{u.expiresAt || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{u.ctaText || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{(u.mediaUrls?.length || 0) > 0 ? `${u.mediaUrls?.length} link(s)` : "—"}</td>
                        <td className="px-3 py-2">
                          <Button size="icon" variant="ghost" onClick={() => { setEditUpdate(u); setShowUpdateDialog(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <EditUpdateDialog
              open={showUpdateDialog}
              onOpenChange={setShowUpdateDialog}
              initial={editUpdate ?? undefined}
              alumni={alumni}
              categories={categories}
              onSave={saveUpdate}
            />
          </div>
        )}

        {tab === "spotlight" && (
          <div>
            <SectionHeader title="Spotlight Preview" hint="Shows featured/spotlight alumni with their latest (non-expired) update." color={pastel.sky} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spotlightData.map(({ a, latest }) => (
                <SpotlightCard key={a.id} a={a} latest={latest} />
              ))}
            </div>
          </div>
        )}

        {tab === "enums" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <SectionHeader title="Programs (Enums)" hint="These power dropdowns and validation in the Sheet." color={pastel.yellow} />
              <ChipInput label="Programs" value={programs} onChange={setPrograms} placeholder="RAW, ACTion, CASTAWAY…" />
              <div className="text-xs text-slate-500 mt-2">Add lines here → copy into the Google Sheet&apos;s <strong>Enums!Programs</strong> column.</div>
            </div>
            <div>
              <SectionHeader title="Categories (Enums)" hint="Journey Update categories." color={pastel.lavender} />
              <ChipInput label="Categories" value={categories} onChange={setCategories} placeholder="Creative Work, DAT Memory…" />
              <div className="text-xs text-slate-500 mt-2">Add lines here → copy into <strong>Enums!Categories</strong>.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
