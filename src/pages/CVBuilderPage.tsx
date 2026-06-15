import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Copy, Loader2, FileText, Mail, RefreshCw, Palette, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ---------- Types matching the AI JSON contract ----------
interface CvJson {
  name?: string;
  contact?: { email?: string; phone?: string; city?: string; rightToWork?: string };
  summary?: string;
  skills?: string[];
  experience?: { role?: string; company?: string; location?: string; dates?: string; bullets?: string[] }[];
  education?: { qualification?: string; institution?: string; dates?: string }[];
  certifications?: string[];
  languages?: string[];
  references?: string;
}
interface CoverJson {
  greeting?: string;
  paragraphs?: string[];
  signOff?: string;
  signature?: string;
  recipient?: string;
}

// ---------- Themes ----------
type ThemeKey = "classic" | "modern" | "elegant" | "minimal" | "bold";
interface Theme {
  key: ThemeKey;
  label: string;
  defaultAccent: string;
  defaultBody: string;
  defaultHeading: string;
  // Returns full CSS for the chosen accent + fonts. Used in screen + print.
  css: (accent: string, bodyFont: string, headingFont: string) => string;
}

const FONT_OPTIONS = [
  { value: "Inter, system-ui, sans-serif", label: "Inter (modern sans)" },
  { value: "'DM Sans', system-ui, sans-serif", label: "DM Sans" },
  { value: "Roboto, Arial, sans-serif", label: "Roboto" },
  { value: "'Source Sans 3', system-ui, sans-serif", label: "Source Sans" },
  { value: "'Playfair Display', Georgia, serif", label: "Playfair (elegant serif)" },
  { value: "'Merriweather', Georgia, serif", label: "Merriweather (serif)" },
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia" },
];

const ACCENT_PRESETS = ["#0f766e", "#1d4ed8", "#9333ea", "#b91c1c", "#0891b2", "#15803d", "#c2410c", "#111827"];

const THEMES: Theme[] = [
  {
    key: "classic", label: "Classic", defaultAccent: "#0f766e",
    defaultBody: "Georgia, 'Times New Roman', serif",
    defaultHeading: "Georgia, 'Times New Roman', serif",
    css: (accent, body, heading) => `
.doc{max-width:780px;margin:0 auto;padding:36px 40px;background:#fff;color:#1a1a1a;font-family:${body};font-size:14px;line-height:1.55;}
.doc h1{font-family:${heading};font-size:30px;margin:0 0 4px;letter-spacing:.2px;color:${accent};border-bottom:2px solid ${accent};padding-bottom:8px;}
.doc h2{font-family:${heading};font-size:13px;text-transform:uppercase;letter-spacing:.12em;margin:22px 0 8px;color:${accent};border-bottom:1px solid #e5e7eb;padding-bottom:4px;}
.doc h3{font-family:${heading};font-size:14px;margin:14px 0 2px;color:#111;}
.doc .contact{color:#555;font-size:13px;margin:0 0 10px;}
.doc .summary{margin:6px 0 0;color:#333;}
.doc ul{margin:6px 0 4px 18px;padding:0;}
.doc li{margin:3px 0;}
.doc .meta{color:#666;font-size:12.5px;margin:0 0 4px;font-style:italic;}
.doc .skills{display:flex;flex-wrap:wrap;gap:6px;}
.doc .skills span{font-size:12.5px;}
.doc .skills span:not(:last-child)::after{content:" · ";color:#888;}
`,
  },
  {
    key: "modern", label: "Modern", defaultAccent: "#1d4ed8",
    defaultBody: "Inter, system-ui, sans-serif",
    defaultHeading: "Inter, system-ui, sans-serif",
    css: (accent, body, heading) => `
.doc{max-width:820px;margin:0 auto;padding:0;background:#fff;color:#0f172a;font-family:${body};font-size:14px;line-height:1.55;display:grid;grid-template-columns:240px 1fr;}
.doc .side{background:${accent};color:#fff;padding:36px 24px;}
.doc .main{padding:36px 32px;}
.doc h1{font-family:${heading};font-size:24px;margin:0 0 6px;color:#fff;font-weight:700;letter-spacing:.2px;}
.doc .contact{color:rgba(255,255,255,.85);font-size:13px;margin:0;line-height:1.6;}
.doc .side h2{font-family:${heading};font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.85);margin:24px 0 8px;border:0;padding:0;}
.doc .side ul,.doc .side .skills{color:#fff;font-size:13px;list-style:none;padding:0;margin:0;}
.doc .side li{margin:4px 0;padding-left:14px;position:relative;}
.doc .side li::before{content:"";position:absolute;left:0;top:8px;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.7);}
.doc .main h2{font-family:${heading};font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:${accent};margin:0 0 10px;border-bottom:2px solid ${accent};padding-bottom:4px;}
.doc .main h2:not(:first-child){margin-top:22px;}
.doc h3{font-family:${heading};font-size:14px;margin:10px 0 2px;color:#0f172a;font-weight:600;}
.doc .meta{color:#64748b;font-size:12.5px;margin:0 0 4px;}
.doc ul.exp{margin:4px 0 6px 16px;padding:0;}
.doc ul.exp li{margin:3px 0;}
`,
  },
  {
    key: "elegant", label: "Elegant", defaultAccent: "#9333ea",
    defaultBody: "'Merriweather', Georgia, serif",
    defaultHeading: "'Playfair Display', Georgia, serif",
    css: (accent, body, heading) => `
.doc{max-width:780px;margin:0 auto;padding:48px 48px 40px;background:#fff;color:#222;font-family:${body};font-size:13.5px;line-height:1.65;}
.doc h1{font-family:${heading};font-size:36px;margin:0;text-align:center;font-weight:600;color:${accent};letter-spacing:.5px;}
.doc .contact{text-align:center;color:#666;font-size:12.5px;margin:6px 0 18px;border-bottom:1px solid ${accent}33;padding-bottom:14px;}
.doc h2{font-family:${heading};font-size:18px;font-weight:600;text-align:center;margin:22px 0 10px;color:${accent};}
.doc h2::before,.doc h2::after{content:"";display:inline-block;width:30px;height:1px;background:${accent};vertical-align:middle;margin:0 12px;opacity:.5;}
.doc h3{font-family:${heading};font-size:14.5px;margin:12px 0 2px;color:#1f1f1f;font-weight:600;}
.doc .meta{color:#777;font-size:12.5px;font-style:italic;margin:0 0 4px;}
.doc ul{margin:4px 0 6px 18px;padding:0;}
.doc li{margin:3px 0;}
.doc .skills{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 14px;font-size:13px;}
`,
  },
  {
    key: "minimal", label: "Minimal", defaultAccent: "#111827",
    defaultBody: "'DM Sans', system-ui, sans-serif",
    defaultHeading: "'DM Sans', system-ui, sans-serif",
    css: (accent, body, heading) => `
.doc{max-width:780px;margin:0 auto;padding:40px;background:#fff;color:#111;font-family:${body};font-size:14px;line-height:1.6;}
.doc h1{font-family:${heading};font-size:28px;margin:0;color:${accent};font-weight:700;letter-spacing:-.5px;}
.doc .contact{color:#666;font-size:13px;margin:4px 0 22px;}
.doc h2{font-family:${heading};font-size:12px;text-transform:uppercase;letter-spacing:.2em;color:${accent};margin:22px 0 8px;font-weight:700;}
.doc h3{font-family:${heading};font-size:14px;margin:10px 0 2px;color:#111;font-weight:600;}
.doc .meta{color:#777;font-size:12.5px;margin:0 0 4px;}
.doc ul{margin:4px 0 6px 18px;padding:0;}
.doc li{margin:3px 0;}
.doc hr{border:0;border-top:1px solid #eee;margin:18px 0;}
.doc .skills{display:flex;flex-wrap:wrap;gap:6px;}
.doc .skills span{border:1px solid #e5e7eb;border-radius:999px;padding:2px 10px;font-size:12px;color:#333;}
`,
  },
  {
    key: "bold", label: "Bold", defaultAccent: "#b91c1c",
    defaultBody: "Inter, system-ui, sans-serif",
    defaultHeading: "Inter, system-ui, sans-serif",
    css: (accent, body, heading) => `
.doc{max-width:820px;margin:0 auto;padding:0;background:#fff;color:#111;font-family:${body};font-size:14px;line-height:1.55;}
.doc .banner{background:${accent};color:#fff;padding:32px 40px;}
.doc h1{font-family:${heading};font-size:34px;margin:0;letter-spacing:.3px;font-weight:800;}
.doc .contact{color:rgba(255,255,255,.92);font-size:13.5px;margin:6px 0 0;}
.doc .body{padding:28px 40px 36px;}
.doc h2{font-family:${heading};font-size:14px;text-transform:uppercase;letter-spacing:.16em;color:${accent};margin:20px 0 8px;border-left:5px solid ${accent};padding:2px 0 2px 10px;}
.doc h3{font-family:${heading};font-size:14.5px;margin:12px 0 2px;font-weight:700;}
.doc .meta{color:#666;font-size:12.5px;margin:0 0 4px;}
.doc ul{margin:4px 0 6px 18px;padding:0;}
.doc li{margin:3px 0;}
.doc .skills{display:flex;flex-wrap:wrap;gap:6px;}
.doc .skills span{background:${accent}14;color:${accent};border-radius:6px;padding:3px 10px;font-size:12.5px;font-weight:600;}
`,
  },
];

// ---------- Helpers ----------
async function callAi(kind: "cv" | "cover_letter", payload: any): Promise<{ data: any; raw: string }> {
  const { data, error } = await supabase.functions.invoke("ai-generate", { body: { kind, payload } });
  if (error) throw new Error(error.message || "Generation failed");
  if (!data?.success) throw new Error(data?.error || "Generation failed");
  const parsed = data.data || parseAiJson(data.content) || fallbackGeneratedDocument(kind, payload, data.content || "");
  return { data: parsed, raw: data.content || "" };
}

function parseAiJson(raw: string): any | null {
  const cleaned = String(raw || "").replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  const candidates = [cleaned, first >= 0 && last > first ? cleaned.slice(first, last + 1) : ""].filter(Boolean);
  for (const candidate of candidates) {
    try { return JSON.parse(candidate); } catch (_) { /* try next */ }
  }
  return null;
}

function fallbackGeneratedDocument(kind: "cv" | "cover_letter", payload: any, raw: string): CvJson | CoverJson {
  if (kind === "cover_letter") {
    return {
      greeting: "Dear Hiring Manager,",
      paragraphs: [
        `I am applying for the ${payload.jobTitle || "advertised role"} at ${payload.companyName || "your organisation"}.`,
        sanitiseText(payload.keyStrengths || raw || "I bring strong communication, reliability, teamwork, and a professional approach to the role."),
        payload.rightToWork ? `My current right to work status is ${payload.rightToWork}. I would welcome the opportunity to discuss my application.` : "I would welcome the opportunity to discuss my application.",
      ],
      signOff: "Yours sincerely,",
      signature: payload.fullName || "Applicant",
    };
  }
  return {
    name: payload.fullName || "Applicant",
    contact: { email: payload.email || "", phone: payload.phone || "", city: payload.city || "", rightToWork: payload.rightToWork || "" },
    summary: sanitiseText(raw || `${payload.fullName || "Candidate"} is targeting ${payload.targetRole || "a UK role"} and brings a reliable, professional approach.`),
    skills: String(payload.skills || "Communication, Reliability, Teamwork").split(",").map(sanitiseText).filter(Boolean),
    experience: [{ role: payload.targetRole || "Relevant role", company: "Previous employer", location: payload.city || "United Kingdom", dates: "Recent experience", bullets: String(payload.workHistory || "Delivered reliable support and followed workplace procedures").split("\n").map(sanitiseText).filter(Boolean) }],
    education: payload.education ? [{ qualification: payload.education, institution: "", dates: "" }] : [],
    certifications: String(payload.certifications || "").split(",").map(sanitiseText).filter(Boolean),
    languages: String(payload.languages || "English").split(",").map(sanitiseText).filter(Boolean),
    references: "Available on request",
  };
}

function escapeHtml(s: string): string {
  return (s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// Strip em-dashes / # / * defensively in case the model slips up.
function sanitiseText(s: string): string {
  return (s || "")
    .replace(/—/g, ", ")
    .replace(/–/g, "-")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[-•]+\s*/gm, "")
    .replace(/[*]+/g, "")
    .trim();
}

function renderCvBody(cv: CvJson, themeKey: ThemeKey): string {
  const contactParts: string[] = [];
  if (cv.contact?.email) contactParts.push(escapeHtml(cv.contact.email));
  if (cv.contact?.phone) contactParts.push(escapeHtml(cv.contact.phone));
  if (cv.contact?.city) contactParts.push(escapeHtml(cv.contact.city));
  if (cv.contact?.rightToWork) contactParts.push(escapeHtml(cv.contact.rightToWork));
  const contact = contactParts.join("  ·  ");

  const skills = (cv.skills || []).filter(Boolean);
  const skillsHtml = skills.length
    ? `<div class="skills">${skills.map(s => `<span>${escapeHtml(sanitiseText(s))}</span>`).join("")}</div>`
    : "";

  const experience = (cv.experience || []).filter(e => e && (e.role || e.company)).map(e => {
    const bullets = (e.bullets || []).filter(Boolean).map(b => `<li>${escapeHtml(sanitiseText(b))}</li>`).join("");
    return `
      <h3>${escapeHtml(sanitiseText(e.role || ""))}${e.company ? ` <span style="font-weight:400;color:#555;">at ${escapeHtml(sanitiseText(e.company))}</span>` : ""}</h3>
      <p class="meta">${[e.location, e.dates].filter(Boolean).map(escapeHtml).join("  ·  ")}</p>
      ${bullets ? `<ul class="exp">${bullets}</ul>` : ""}`;
  }).join("");

  const education = (cv.education || []).filter(e => e && (e.qualification || e.institution)).map(e => `
    <h3>${escapeHtml(sanitiseText(e.qualification || ""))}</h3>
    <p class="meta">${[e.institution, e.dates].filter(Boolean).map(escapeHtml).join("  ·  ")}</p>`).join("");

  const certs = (cv.certifications || []).filter(Boolean);
  const langs = (cv.languages || []).filter(Boolean);

  const summaryBlock = cv.summary ? `<h2>Personal Profile</h2><p class="summary">${escapeHtml(sanitiseText(cv.summary))}</p>` : "";
  const skillsBlock = skills.length ? `<h2>Key Skills</h2>${skillsHtml}` : "";
  const expBlock = experience ? `<h2>Work Experience</h2>${experience}` : "";
  const eduBlock = education ? `<h2>Education & Qualifications</h2>${education}` : "";
  const certBlock = certs.length ? `<h2>Certifications</h2><ul>${certs.map(c => `<li>${escapeHtml(sanitiseText(c))}</li>`).join("")}</ul>` : "";
  const langBlock = langs.length ? `<h2>Languages</h2><p>${langs.map(l => escapeHtml(sanitiseText(l))).join("  ·  ")}</p>` : "";
  const refBlock = cv.references ? `<h2>References</h2><p>${escapeHtml(sanitiseText(cv.references))}</p>` : "";

  if (themeKey === "modern") {
    // Two-column layout: skills/contact/langs on side, rest on main.
    return `<div class="doc">
      <aside class="side">
        <h1>${escapeHtml(sanitiseText(cv.name || ""))}</h1>
        <p class="contact">${contactParts.join("<br>")}</p>
        ${skills.length ? `<h2>Key Skills</h2><ul>${skills.map(s => `<li>${escapeHtml(sanitiseText(s))}</li>`).join("")}</ul>` : ""}
        ${langs.length ? `<h2>Languages</h2><ul>${langs.map(l => `<li>${escapeHtml(sanitiseText(l))}</li>`).join("")}</ul>` : ""}
        ${certs.length ? `<h2>Certifications</h2><ul>${certs.map(c => `<li>${escapeHtml(sanitiseText(c))}</li>`).join("")}</ul>` : ""}
      </aside>
      <section class="main">
        ${summaryBlock}
        ${expBlock}
        ${eduBlock}
        ${refBlock}
      </section>
    </div>`;
  }

  if (themeKey === "bold") {
    return `<div class="doc">
      <header class="banner">
        <h1>${escapeHtml(sanitiseText(cv.name || ""))}</h1>
        <p class="contact">${contact}</p>
      </header>
      <div class="body">
        ${summaryBlock}${skillsBlock}${expBlock}${eduBlock}${certBlock}${langBlock}${refBlock}
      </div>
    </div>`;
  }

  return `<div class="doc">
    <h1>${escapeHtml(sanitiseText(cv.name || ""))}</h1>
    <p class="contact">${contact}</p>
    ${summaryBlock}${skillsBlock}${expBlock}${eduBlock}${certBlock}${langBlock}${refBlock}
  </div>`;
}

function renderCoverBody(cl: CoverJson, applicant: { name?: string; email?: string; phone?: string }, recipient: { company?: string; role?: string }): string {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const paragraphs = (cl.paragraphs || []).filter(Boolean).map(p => `<p>${escapeHtml(sanitiseText(p))}</p>`).join("");
  return `<div class="doc">
    <h1>${escapeHtml(sanitiseText(applicant.name || cl.signature || ""))}</h1>
    <p class="contact">${[applicant.email, applicant.phone].filter(Boolean).map(escapeHtml).join("  ·  ")}</p>
    <p class="meta" style="text-align:right;">${escapeHtml(today)}</p>
    ${recipient.company ? `<p style="margin:18px 0 4px;font-weight:600;">${escapeHtml(sanitiseText(recipient.company))}</p>` : ""}
    ${recipient.role ? `<p class="meta" style="margin:0 0 14px;">Re: ${escapeHtml(sanitiseText(recipient.role))}</p>` : ""}
    <p style="margin:14px 0 8px;">${escapeHtml(sanitiseText(cl.greeting || "Dear Hiring Manager,"))}</p>
    ${paragraphs}
    <p style="margin:18px 0 4px;">${escapeHtml(sanitiseText(cl.signOff || "Yours sincerely,"))}</p>
    <p style="font-weight:700;">${escapeHtml(sanitiseText(cl.signature || applicant.name || ""))}</p>
  </div>`;
}

function openPrint(title: string, css: string, bodyHtml: string) {
  const w = window.open("", "_blank"); if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Merriweather:wght@400;700&family=Playfair+Display:wght@400;600;700&family=Roboto:wght@400;500;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      *{box-sizing:border-box}
      html,body{margin:0;padding:0;background:#f4f4f5;}
      @page{size:A4;margin:14mm;}
      @media print{html,body{background:#fff;} .doc{box-shadow:none !important;}}
      ${css}
      .doc{box-shadow:0 4px 24px rgba(0,0,0,.08);margin:24px auto !important;}
    </style></head><body>${bodyHtml}
    <script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`);
  w.document.close();
}

// ---------- Sample form state ----------
const SAMPLE_CV = {
  fullName: "", email: "", phone: "", city: "", country: "United Kingdom",
  rightToWork: "", targetRole: "", yearsExperience: "", industries: "",
  skills: "", education: "", certifications: "", workHistory: "", languages: "English (Fluent)", summary: "",
};
const SAMPLE_CL = {
  fullName: "", email: "", phone: "",
  jobTitle: "", companyName: "", jobDescription: "",
  keyStrengths: "", whyCompany: "", rightToWork: "",
};

const CVBuilderPage = () => {
  const [cv, setCv] = useState(SAMPLE_CV);
  const [cl, setCl] = useState(SAMPLE_CL);
  const [cvData, setCvData] = useState<CvJson | null>(null);
  const [clData, setClData] = useState<CoverJson | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [clLoading, setClLoading] = useState(false);

  // Style controls
  const [themeKey, setThemeKey] = useState<ThemeKey>("modern");
  const theme = THEMES.find(t => t.key === themeKey) || THEMES[1];
  const [accent, setAccent] = useState<string>(theme.defaultAccent);
  const [bodyFont, setBodyFont] = useState<string>(theme.defaultBody);
  const [headingFont, setHeadingFont] = useState<string>(theme.defaultHeading);

  // When theme changes, refresh defaults
  const switchTheme = (key: ThemeKey) => {
    const t = THEMES.find(x => x.key === key) || THEMES[0];
    setThemeKey(key);
    setAccent(t.defaultAccent);
    setBodyFont(t.defaultBody);
    setHeadingFont(t.defaultHeading);
  };

  const css = useMemo(() => theme.css(accent, bodyFont, headingFont), [theme, accent, bodyFont, headingFont]);

  const generateCv = async () => {
    if (!cv.fullName.trim() || !cv.targetRole.trim()) {
      toast({ title: "Please add your full name and target role", variant: "destructive" }); return;
    }
    setCvLoading(true);
    try {
      const { data } = await callAi("cv", cv);
      if (!data) throw new Error("AI returned invalid output. Please try again.");
      setCvData(data as CvJson);
      toast({ title: "CV generated" });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally { setCvLoading(false); }
  };

  const generateCl = async () => {
    if (!cl.fullName.trim() || !cl.jobTitle.trim() || !cl.companyName.trim()) {
      toast({ title: "Please fill name, job title and company", variant: "destructive" }); return;
    }
    setClLoading(true);
    try {
      const { data } = await callAi("cover_letter", cl);
      if (!data) throw new Error("AI returned invalid output. Please try again.");
      setClData(data as CoverJson);
      toast({ title: "Cover letter generated" });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally { setClLoading(false); }
  };

  const cvHtml = cvData ? renderCvBody(cvData, themeKey) : "";
  const clHtml = clData ? renderCoverBody(clData, { name: cl.fullName, email: cl.email, phone: cl.phone }, { company: cl.companyName, role: cl.jobTitle }) : "";

  const copyHtml = (html: string) => {
    navigator.clipboard.writeText(html.replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n"));
    toast({ title: "Copied as plain text" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Free AI CV Builder & Cover Letter Generator — UK Jobs | CareHomeStaffUK</title>
        <meta name="description" content="Design a polished UK CV and tailored cover letter with style, font and colour controls. Print to PDF with the styles intact. Free, no signup, ATS-friendly." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.origin + "/cv-builder" : ""} />
      </Helmet>
      <SiteHeader />

      <main className="flex-1">
        <section className="bg-hero py-12">
          <div className="container max-w-4xl text-center space-y-3">
            <span className="inline-block text-xs font-semibold tracking-wider uppercase bg-hero-accent/20 text-hero-accent px-3 py-1 rounded-full">
              ✦ Free for guests · Styled · ATS-friendly
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl text-hero-foreground">UK CV Builder & Cover Letter Generator</h1>
            <p className="text-hero-foreground/80 max-w-2xl mx-auto">
              Five professional themes, full font and colour control, and a print-perfect PDF export that keeps every style.
            </p>
          </div>
        </section>

        <section className="container py-10 max-w-6xl">
          {/* Style controls */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Style your document</h2>
            </div>
            <div className="grid lg:grid-cols-5 gap-3">
              <div>
                <Label className="text-xs">Theme</Label>
                <Select value={themeKey} onValueChange={(v) => switchTheme(v as ThemeKey)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {THEMES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Body font</Label>
                <Select value={bodyFont} onValueChange={setBodyFont}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Heading font</Label>
                <Select value={headingFont} onValueChange={setHeadingFont}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Accent colour</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="h-10 w-12 rounded border" />
                  <Input value={accent} onChange={e => setAccent(e.target.value)} className="h-10" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Presets</Label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ACCENT_PRESETS.map(c => (
                    <button key={c} type="button" aria-label={c} title={c} onClick={() => setAccent(c)}
                      className={`h-7 w-7 rounded-full border-2 ${accent.toLowerCase() === c.toLowerCase() ? "border-primary" : "border-border"}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="cv" className="space-y-6">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
              <TabsTrigger value="cv"><FileText className="h-4 w-4 mr-2" /> CV Builder</TabsTrigger>
              <TabsTrigger value="cl"><Mail className="h-4 w-4 mr-2" /> Cover Letter</TabsTrigger>
            </TabsList>

            <TabsContent value="cv" className="grid lg:grid-cols-2 gap-6">
              <Card className="p-5 space-y-3">
                <h2 className="font-heading font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Your details</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Full name *</Label><Input value={cv.fullName} onChange={e => setCv({ ...cv, fullName: e.target.value })} placeholder="Jane Smith" /></div>
                  <div><Label>Target role *</Label><Input value={cv.targetRole} onChange={e => setCv({ ...cv, targetRole: e.target.value })} placeholder="Senior Care Worker" /></div>
                  <div><Label>Email</Label><Input value={cv.email} onChange={e => setCv({ ...cv, email: e.target.value })} placeholder="jane@example.com" /></div>
                  <div><Label>Phone</Label><Input value={cv.phone} onChange={e => setCv({ ...cv, phone: e.target.value })} placeholder="+44 7700 900000" /></div>
                  <div><Label>City</Label><Input value={cv.city} onChange={e => setCv({ ...cv, city: e.target.value })} placeholder="Manchester" /></div>
                  <div>
                    <Label>Right to work / Visa</Label>
                    <Select value={cv.rightToWork} onValueChange={v => setCv({ ...cv, rightToWork: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="British Citizen">British Citizen</SelectItem>
                        <SelectItem value="Settled / Pre-settled (EU)">Settled / Pre-settled (EU)</SelectItem>
                        <SelectItem value="Health and Care Worker visa">Health and Care Worker visa</SelectItem>
                        <SelectItem value="Skilled Worker visa">Skilled Worker visa</SelectItem>
                        <SelectItem value="Graduate / PSW visa (switching)">Graduate / PSW visa (switching)</SelectItem>
                        <SelectItem value="Student visa (switching)">Student visa (switching)</SelectItem>
                        <SelectItem value="Dependant / Spouse visa">Dependant / Spouse visa</SelectItem>
                        <SelectItem value="Requires Sponsorship">Requires Sponsorship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Years of experience</Label><Input value={cv.yearsExperience} onChange={e => setCv({ ...cv, yearsExperience: e.target.value })} placeholder="3" /></div>
                  <div><Label>Industries</Label><Input value={cv.industries} onChange={e => setCv({ ...cv, industries: e.target.value })} placeholder="Healthcare, hospitality" /></div>
                </div>
                <div><Label>Key skills (comma-separated)</Label><Textarea rows={2} value={cv.skills} onChange={e => setCv({ ...cv, skills: e.target.value })} placeholder="Personal care, medication admin, safeguarding, manual handling, dementia care" /></div>
                <div><Label>Work history</Label><Textarea rows={5} value={cv.workHistory} onChange={e => setCv({ ...cv, workHistory: e.target.value })} placeholder={"Care Assistant, Sunrise Care Home, Jan 2022 to Present\n- Supported 12 residents with daily living tasks\n- Administered medication per MAR charts"} /></div>
                <div><Label>Education / qualifications</Label><Textarea rows={3} value={cv.education} onChange={e => setCv({ ...cv, education: e.target.value })} placeholder="NVQ Level 3 Health and Social Care, 2021" /></div>
                <div><Label>Certifications</Label><Textarea rows={2} value={cv.certifications} onChange={e => setCv({ ...cv, certifications: e.target.value })} placeholder="Care Certificate, DBS, First Aid, Moving and Handling" /></div>
                <div><Label>Languages</Label><Input value={cv.languages} onChange={e => setCv({ ...cv, languages: e.target.value })} /></div>
                <Button onClick={generateCv} disabled={cvLoading} className="w-full bg-primary text-primary-foreground" size="lg">
                  {cvLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate my CV</>}
                </Button>
              </Card>

              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h2 className="font-heading font-semibold">Live preview</h2>
                  {cvData && (
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => copyHtml(cvHtml)}><Copy className="h-3.5 w-3.5 mr-1" /> Copy text</Button>
                      <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => openPrint(`${cv.fullName || "CV"} - CV`, css, cvHtml)}><Printer className="h-3.5 w-3.5 mr-1" /> Print / PDF</Button>
                      <Button size="sm" variant="ghost" onClick={generateCv} disabled={cvLoading}><RefreshCw className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </div>
                {cvData ? (
                  <div className="border rounded-md bg-zinc-100 max-h-[720px] overflow-auto">
                    <style dangerouslySetInnerHTML={{ __html: css }} />
                    <div dangerouslySetInnerHTML={{ __html: cvHtml }} />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground border border-dashed rounded-md p-8 text-center">
                    Fill in the form and click <strong>Generate my CV</strong>. Your styled UK CV preview will appear here.
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="cl" className="grid lg:grid-cols-2 gap-6">
              <Card className="p-5 space-y-3">
                <h2 className="font-heading font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Job and you</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Your full name *</Label><Input value={cl.fullName} onChange={e => setCl({ ...cl, fullName: e.target.value })} /></div>
                  <div><Label>Email</Label><Input value={cl.email} onChange={e => setCl({ ...cl, email: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={cl.phone} onChange={e => setCl({ ...cl, phone: e.target.value })} /></div>
                  <div>
                    <Label>Right to work / Visa</Label>
                    <Select value={cl.rightToWork} onValueChange={v => setCl({ ...cl, rightToWork: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="British Citizen">British Citizen</SelectItem>
                        <SelectItem value="Settled / Pre-settled (EU)">Settled / Pre-settled (EU)</SelectItem>
                        <SelectItem value="Health and Care Worker visa">Health and Care Worker visa</SelectItem>
                        <SelectItem value="Skilled Worker visa">Skilled Worker visa</SelectItem>
                        <SelectItem value="Graduate / PSW visa (switching)">Graduate / PSW visa (switching)</SelectItem>
                        <SelectItem value="Student visa (switching)">Student visa (switching)</SelectItem>
                        <SelectItem value="Dependant / Spouse visa">Dependant / Spouse visa</SelectItem>
                        <SelectItem value="Requires Sponsorship">Requires Sponsorship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Job title *</Label><Input value={cl.jobTitle} onChange={e => setCl({ ...cl, jobTitle: e.target.value })} placeholder="Care Assistant" /></div>
                  <div><Label>Company name *</Label><Input value={cl.companyName} onChange={e => setCl({ ...cl, companyName: e.target.value })} placeholder="Sunrise Care Group" /></div>
                </div>
                <div><Label>Job description / advert text</Label><Textarea rows={5} value={cl.jobDescription} onChange={e => setCl({ ...cl, jobDescription: e.target.value })} /></div>
                <div><Label>Your key strengths for this role</Label><Textarea rows={3} value={cl.keyStrengths} onChange={e => setCl({ ...cl, keyStrengths: e.target.value })} placeholder="3 years in dementia care, Care Certificate, NVQ L2, strong safeguarding record" /></div>
                <div><Label>Why this company / role (optional)</Label><Textarea rows={2} value={cl.whyCompany} onChange={e => setCl({ ...cl, whyCompany: e.target.value })} /></div>
                <Button onClick={generateCl} disabled={clLoading} className="w-full bg-primary text-primary-foreground" size="lg">
                  {clLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate cover letter</>}
                </Button>
              </Card>

              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h2 className="font-heading font-semibold">Live preview</h2>
                  {clData && (
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => copyHtml(clHtml)}><Copy className="h-3.5 w-3.5 mr-1" /> Copy text</Button>
                      <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => openPrint(`${cl.fullName || "Cover Letter"} - Cover Letter`, css, clHtml)}><Printer className="h-3.5 w-3.5 mr-1" /> Print / PDF</Button>
                      <Button size="sm" variant="ghost" onClick={generateCl} disabled={clLoading}><RefreshCw className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </div>
                {clData ? (
                  <div className="border rounded-md bg-zinc-100 max-h-[720px] overflow-auto">
                    <style dangerouslySetInnerHTML={{ __html: css }} />
                    <div dangerouslySetInnerHTML={{ __html: clHtml }} />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground border border-dashed rounded-md p-8 text-center">
                    Your tailored UK cover letter preview will appear here, styled in your chosen theme.
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground text-center mt-8 max-w-2xl mx-auto">
            Tip: a detailed work history with dates and 2 to 3 bullet achievements produces a much stronger result than one-line answers. Always proofread your generated document before sending.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default CVBuilderPage;
