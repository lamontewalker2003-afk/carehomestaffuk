import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  getJobs, saveApplication, sendToTelegram, sendEmail, buildApplicationConfirmationEmail, getSiteSettings,
  uploadApplicantCv, ALLOWED_CV_MIME_TYPES, CV_MAX_BYTES,
} from "@/lib/store";
import { WhatsAppLink } from "@/components/WhatsAppButton";
import type { Job, SiteSettings } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, MessageCircle, Upload, FileText, X, Loader2, ShieldCheck, Mail } from "lucide-react";

const ApplyPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedJob = searchParams.get("job") || "";
  const applicationType: 'standard' | 'sponsorship' =
    searchParams.get("type") === "sponsorship" ? "sponsorship" : "standard";
  const isSponsorshipFlow = applicationType === "sponsorship";

  const [jobs, setJobs] = useState<Job[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvFile, setCvFile] = useState<{ name: string; url: string; path: string; contentType: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    jobId: preselectedJob,
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    currentLocation: "",
    visaStatus: isSponsorshipFlow ? "requires_sponsorship" : "",
    experience: "",
    qualifications: "",
    coverLetter: "",
  });

  useEffect(() => {
    getJobs().then(allJobs => setJobs(allJobs.filter(j => j.isActive)));
    getSiteSettings().then(setSite);
  }, []);

  const selectedJob = jobs.find(j => j.id === form.jobId);

  // For sponsorship flow we hide the per-job picker AND we never disclose
  // which licensed sponsor will eventually be matched to the applicant.
  // jobTitle becomes a generic placeholder admins can re-route internally.
  const effectiveJobTitle = isSponsorshipFlow
    ? "Sponsorship Pathway — General Enquiry"
    : (selectedJob?.title || "General Application");

  const handleCvUpload = async (file: File) => {
    if (!ALLOWED_CV_MIME_TYPES[file.type]) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF, Word (.doc/.docx), ODT, RTF or .txt document.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > CV_MAX_BYTES) {
      toast({ title: "File too large", description: "Maximum CV size is 8 MB.", variant: "destructive" });
      return;
    }
    setCvUploading(true);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(",")[1] || "");
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const up = await uploadApplicantCv({
        filename: file.name,
        contentBase64: b64,
        contentType: file.type,
        email: form.email || undefined,
      });
      if (up) {
        setCvFile({ name: file.name, url: up.url, path: up.path, contentType: file.type });
        toast({ title: "CV uploaded" });
      } else {
        toast({ title: "Upload failed — please try again.", variant: "destructive" });
      }
    } finally {
      setCvUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSponsorshipFlow) {
      if (!form.fullName || !form.email || !form.phone) {
        toast({ title: "Please fill in all required fields", variant: "destructive" });
        return;
      }
    } else if (!form.jobId || !form.fullName || !form.email || !form.phone) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (!isValidPhoneNumber(form.phone)) {
      toast({ title: "Please enter a valid phone number with country code", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const app = await saveApplication({
        ...form,
        jobId: isSponsorshipFlow ? "" : form.jobId,
        jobTitle: effectiveJobTitle,
        cvFileName: cvFile?.name || "",
        cvUrl: cvFile?.url || "",
        cvStoragePath: cvFile?.path || "",
        cvContentType: cvFile?.contentType || "",
        sponsorCompany: "", // never set by the user — admin assigns privately
        applicationType,
      });

      if (app) {
        sendToTelegram(app).catch(() => {});
        buildApplicationConfirmationEmail(app).then(emailHtml => {
          sendEmail(app.email, "Application Received — CareHomeStaffUK", emailHtml).catch(() => {});
        });
      }

      setSubmitted(true);
      toast({ title: "Application submitted successfully!" });
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    // WhatsApp CTA on success is hidden when:
    //  - admin disabled WhatsApp globally, OR
    //  - admin enabled "hide WhatsApp after apply" (so they email instructions instead), OR
    //  - this is a sponsorship enquiry (handled privately by the team via email).
    const waConfigured = !!(site?.whatsappNumber || "").replace(/[^\d]/g, "");
    const waEnabled = site?.whatsappEnabled !== false;
    const waHiddenAfterApply = site?.hideWhatsappAfterApply === true;
    const showWaCta = waConfigured && waEnabled && !waHiddenAfterApply && !isSponsorshipFlow;

    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-5 p-8 animate-fade-in max-w-md">
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
            <h1 className="font-heading text-3xl font-bold">
              {isSponsorshipFlow ? "Sponsorship Enquiry Received" : "Application Submitted!"}
            </h1>
            <p className="text-muted-foreground">
              {isSponsorshipFlow
                ? "Thank you for registering your interest in UK Health & Care Worker sponsorship. A confirmation email has been sent. Our sponsorship advisors will review your profile against our active partner employers and reach out by email with personal next steps."
                : "Thank you for your application. A confirmation email has been sent to your inbox. Our team will review your details and get back to you within 3-5 working days."}
            </p>
            {isSponsorshipFlow && (
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-left text-muted-foreground flex gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  For your protection, partner employers are matched <span className="font-semibold">privately by our team</span>. You will receive all next steps and contact details by email — please check your spam folder if you do not hear from us within 2 working days.
                </span>
              </div>
            )}
            {showWaCta && (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium">Want a faster response? Message us on WhatsApp:</p>
                <WhatsAppLink className="inline-flex">
                  <Button size="lg" className="bg-[#25D366] hover:bg-[#1ebe5a] text-white" asChild={false}>
                    <span className="inline-flex items-center"><MessageCircle className="h-5 w-5 mr-2" /> Message us on WhatsApp</span>
                  </Button>
                </WhatsAppLink>
              </div>
            )}
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="bg-hero py-12">
          <div className="container">
            {isSponsorshipFlow && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase bg-hero-accent/20 text-hero-accent px-3 py-1 rounded-full mb-3">
                <ShieldCheck className="h-3.5 w-3.5" /> UK Sponsorship Pathway
              </span>
            )}
            <h1 className="font-heading text-3xl font-bold text-hero-foreground">
              {isSponsorshipFlow ? "Register Interest — UK Sponsorship" : "Apply Now"}
            </h1>
            <p className="text-hero-foreground/70 mt-2">
              {isSponsorshipFlow
                ? "Submit one application. Our team will privately match you to a licensed UK sponsor and follow up by email."
                : "Start your care career in the UK"}
            </p>
          </div>
        </div>

        {site?.applicationBanner?.enabled && site.applicationBanner.message && (
          <div className="bg-accent/15 border-y border-accent/30">
            <div className="container py-3 text-sm text-foreground/90 flex items-start gap-2">
              <span className="font-semibold text-accent-foreground">Notice:</span>
              <span>{site.applicationBanner.message}</span>
            </div>
          </div>
        )}

        <div className="container py-10 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSponsorshipFlow ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm space-y-1">
                <p className="font-semibold flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-4 w-4" /> One general application — multiple licensed sponsors
                </p>
                <p className="text-muted-foreground">
                  To protect both you and our partner employers, you cannot pick a specific company. Our advisors review your profile and confidentially introduce you to the best-matched licensed UK sponsor. We confirm the matched employer by email.
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="job">Position *</Label>
                <Select value={form.jobId} onValueChange={(v) => setForm(f => ({ ...f, jobId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a position" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map(j => (
                      <SelectItem key={j.id} value={j.id}>{j.title} — {j.location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <PhoneInput
                  id="phone"
                  international
                  defaultCountry="GB"
                  countryCallingCodeEditable={false}
                  value={form.phone}
                  onChange={(v) => setForm(f => ({ ...f, phone: v || "" }))}
                  className="phone-input-wrapper flex items-center gap-2 h-10 rounded-md border border-input bg-background px-3 text-sm focus-within:ring-2 focus-within:ring-ring"
                  placeholder="Enter phone number"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Select your country, then enter your number.</p>
              </div>
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Input id="nationality" value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentLocation">Current Location</Label>
                <Input id="currentLocation" value={form.currentLocation} onChange={e => setForm(f => ({ ...f, currentLocation: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="visaStatus">Visa Status</Label>
                <Select value={form.visaStatus} onValueChange={(v) => setForm(f => ({ ...f, visaStatus: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visa status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="british_citizen">British Citizen</SelectItem>
                    <SelectItem value="settled_status">Settled Status (EU)</SelectItem>
                    <SelectItem value="pre_settled">Pre-Settled Status</SelectItem>
                    <SelectItem value="work_visa">Existing Work Visa</SelectItem>
                    <SelectItem value="requires_sponsorship">Requires Sponsorship</SelectItem>
                    <SelectItem value="student_visa">Student Visa</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="experience">Relevant Experience</Label>
              <Textarea id="experience" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} placeholder="Describe your care experience..." rows={3} />
            </div>

            <div>
              <Label htmlFor="qualifications">Qualifications</Label>
              <Textarea id="qualifications" value={form.qualifications} onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))} placeholder="List your relevant qualifications (NVQ, Care Certificate, etc.)..." rows={3} />
            </div>

            <div>
              <Label htmlFor="coverLetter">{isSponsorshipFlow ? "Tell us about yourself" : "Cover Letter"}</Label>
              <Textarea id="coverLetter" value={form.coverLetter} onChange={e => setForm(f => ({ ...f, coverLetter: e.target.value }))} placeholder={isSponsorshipFlow ? "Share your motivation, preferred UK region, available start date, and any care roles you're targeting..." : "Tell us why you'd be great for this role..."} rows={4} />
            </div>

            {/* CV upload */}
            <div>
              <Label>Upload your CV <span className="text-xs text-muted-foreground">(PDF, DOC, DOCX, ODT, RTF, TXT — max 8 MB)</span></Label>
              <div className="mt-1 border-2 border-dashed rounded-lg p-5 bg-muted/30 text-center space-y-3">
                {!cvFile ? (
                  <>
                    <Upload className="h-7 w-7 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Attach your CV so our team can review it alongside your application.
                    </p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.odt,.rtf,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text,application/rtf,text/plain"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleCvUpload(f); }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={cvUploading}>
                      {cvUploading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Uploading…</> : <>Choose file</>}
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                      Documents only — executables, images and archives are blocked.
                    </p>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{cvFile.name}</p>
                        <a href={cvFile.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View uploaded CV</a>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setCvFile(null); if (fileRef.current) fileRef.current.value = ""; }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
              {loading ? "Submitting..." : (isSponsorshipFlow ? "Submit Sponsorship Enquiry" : "Submit Application")}
            </Button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default ApplyPage;
