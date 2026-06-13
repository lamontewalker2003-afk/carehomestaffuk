import { useState } from "react";
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
import { Sparkles, Download, Copy, Loader2, FileText, Mail, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

async function callAi(kind: "cv" | "cover_letter", payload: any): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-generate", { body: { kind, payload } });
  if (error) throw new Error(error.message || "Generation failed");
  if (!data?.success) throw new Error(data?.error || "Generation failed");
  return data.content as string;
}

function downloadText(name: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function printable(title: string, body: string) {
  const w = window.open("", "_blank"); if (!w) return;
  const safe = body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:780px;margin:40px auto;padding:0 24px;color:#111;line-height:1.55;font-size:14px}
      h1{font-size:26px;margin:0 0 4px;border-bottom:2px solid #0f766e;padding-bottom:6px}
      h2{font-size:16px;text-transform:uppercase;letter-spacing:.05em;margin:18px 0 6px;color:#0f766e}
      h3{font-size:14px;margin:10px 0 2px}
      ul{margin:4px 0 8px 18px;padding:0}
      pre{white-space:pre-wrap;font-family:inherit;font-size:14px}
      @media print{body{margin:0;padding:18mm}}
    </style></head><body><pre>${safe}</pre>
    <script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

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
  const [cvOut, setCvOut] = useState(""); const [clOut, setClOut] = useState("");
  const [cvLoading, setCvLoading] = useState(false); const [clLoading, setClLoading] = useState(false);

  const generateCv = async () => {
    if (!cv.fullName.trim() || !cv.targetRole.trim()) {
      toast({ title: "Please add your full name and target role", variant: "destructive" }); return;
    }
    setCvLoading(true);
    try { setCvOut(await callAi("cv", cv)); toast({ title: "CV generated" }); }
    catch (e: any) { toast({ title: "Generation failed", description: e.message, variant: "destructive" }); }
    finally { setCvLoading(false); }
  };

  const generateCl = async () => {
    if (!cl.fullName.trim() || !cl.jobTitle.trim() || !cl.companyName.trim()) {
      toast({ title: "Please fill name, job title and company", variant: "destructive" }); return;
    }
    setClLoading(true);
    try { setClOut(await callAi("cover_letter", cl)); toast({ title: "Cover letter generated" }); }
    catch (e: any) { toast({ title: "Generation failed", description: e.message, variant: "destructive" }); }
    finally { setClLoading(false); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast({ title: "Copied to clipboard" }); };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Free AI CV Builder & Cover Letter Generator — UK Jobs | CareHomeStaffUK</title>
        <meta name="description" content="Build an ATS-friendly UK CV and tailored cover letter in seconds with our free AI tool. Open to guests — no signup. Optimised for UK recruiters, visa applicants and Health & Care Worker visa candidates." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.origin + "/cv-builder" : ""} />
      </Helmet>
      <SiteHeader />

      <main className="flex-1">
        <section className="bg-hero py-12">
          <div className="container max-w-4xl text-center space-y-3">
            <span className="inline-block text-xs font-semibold tracking-wider uppercase bg-hero-accent/20 text-hero-accent px-3 py-1 rounded-full">
              ✦ Free for guests — no signup
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl text-hero-foreground">UK CV Builder & Cover Letter Generator</h1>
            <p className="text-hero-foreground/80 max-w-2xl mx-auto">
              Powered by AI, optimised for UK recruiters and ATS systems. Perfect for care workers, healthcare assistants, nurses, hospitality, warehouse, retail, drivers and skilled-worker visa applicants.
            </p>
          </div>
        </section>

        <section className="container py-10 max-w-5xl">
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
                        <SelectItem value="Health & Care Worker visa">Health & Care Worker visa</SelectItem>
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
                <div><Label>Work history</Label><Textarea rows={5} value={cv.workHistory} onChange={e => setCv({ ...cv, workHistory: e.target.value })} placeholder={"Care Assistant — Sunrise Care Home — Jan 2022 – Present\n• Supported 12 residents with daily living tasks\n• Administered medication per MAR charts"} /></div>
                <div><Label>Education / qualifications</Label><Textarea rows={3} value={cv.education} onChange={e => setCv({ ...cv, education: e.target.value })} placeholder="NVQ Level 3 Health & Social Care — 2021" /></div>
                <div><Label>Certifications</Label><Textarea rows={2} value={cv.certifications} onChange={e => setCv({ ...cv, certifications: e.target.value })} placeholder="Care Certificate, DBS, First Aid, Moving & Handling" /></div>
                <div><Label>Languages</Label><Input value={cv.languages} onChange={e => setCv({ ...cv, languages: e.target.value })} /></div>
                <Button onClick={generateCv} disabled={cvLoading} className="w-full bg-primary text-primary-foreground" size="lg">
                  {cvLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate my CV</>}
                </Button>
              </Card>

              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-heading font-semibold">Your CV</h2>
                  {cvOut && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copy(cvOut)}><Copy className="h-3.5 w-3.5 mr-1" /> Copy</Button>
                      <Button size="sm" variant="outline" onClick={() => downloadText(`${cv.fullName || "cv"}.md`, cvOut)}><Download className="h-3.5 w-3.5 mr-1" /> .md</Button>
                      <Button size="sm" variant="outline" onClick={() => printable("CV", cvOut)}><FileText className="h-3.5 w-3.5 mr-1" /> Print / PDF</Button>
                      <Button size="sm" variant="ghost" onClick={generateCv} disabled={cvLoading}><RefreshCw className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </div>
                {cvOut ? (
                  <pre className="text-xs whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-md p-4 border max-h-[640px] overflow-auto">{cvOut}</pre>
                ) : (
                  <div className="text-sm text-muted-foreground border border-dashed rounded-md p-8 text-center">
                    Fill in the form and click <strong>Generate my CV</strong>. Your AI-tailored UK CV will appear here, ready to copy, download or print as PDF.
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="cl" className="grid lg:grid-cols-2 gap-6">
              <Card className="p-5 space-y-3">
                <h2 className="font-heading font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Job & you</h2>
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
                        <SelectItem value="Health & Care Worker visa">Health & Care Worker visa</SelectItem>
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
                <div><Label>Job description / advert text (paste it)</Label><Textarea rows={5} value={cl.jobDescription} onChange={e => setCl({ ...cl, jobDescription: e.target.value })} /></div>
                <div><Label>Your key strengths for this role</Label><Textarea rows={3} value={cl.keyStrengths} onChange={e => setCl({ ...cl, keyStrengths: e.target.value })} placeholder="3 years in dementia care, Care Certificate, NVQ L2, strong safeguarding record" /></div>
                <div><Label>Why this company / role (optional)</Label><Textarea rows={2} value={cl.whyCompany} onChange={e => setCl({ ...cl, whyCompany: e.target.value })} /></div>
                <Button onClick={generateCl} disabled={clLoading} className="w-full bg-primary text-primary-foreground" size="lg">
                  {clLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate cover letter</>}
                </Button>
              </Card>

              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-heading font-semibold">Your cover letter</h2>
                  {clOut && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copy(clOut)}><Copy className="h-3.5 w-3.5 mr-1" /> Copy</Button>
                      <Button size="sm" variant="outline" onClick={() => downloadText(`${cl.fullName || "cover-letter"}.txt`, clOut)}><Download className="h-3.5 w-3.5 mr-1" /> .txt</Button>
                      <Button size="sm" variant="outline" onClick={() => printable("Cover Letter", clOut)}><FileText className="h-3.5 w-3.5 mr-1" /> Print / PDF</Button>
                      <Button size="sm" variant="ghost" onClick={generateCl} disabled={clLoading}><RefreshCw className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </div>
                {clOut ? (
                  <pre className="text-sm whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-md p-4 border max-h-[640px] overflow-auto">{clOut}</pre>
                ) : (
                  <div className="text-sm text-muted-foreground border border-dashed rounded-md p-8 text-center">
                    Your tailored UK cover letter will appear here. We mirror the job description, surface your strengths, and reference your right to work where helpful.
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground text-center mt-8 max-w-2xl mx-auto">
            Tip: be specific — a strong work history paragraph with dates and 2-3 bullet achievements produces a much better result than one-line answers. Generated content is a draft: please proofread before sending.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default CVBuilderPage;
