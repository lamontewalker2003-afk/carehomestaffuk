import { useState, useEffect } from "react";
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
import { getJobs, saveApplication, sendToTelegram, sendEmail, buildApplicationConfirmationEmail } from "@/lib/store";
import type { Job } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

const ApplyPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedJob = searchParams.get("job") || "";
  const [jobs, setJobs] = useState<Job[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    jobId: preselectedJob,
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    currentLocation: "",
    visaStatus: "",
    experience: "",
    qualifications: "",
    coverLetter: "",
  });

  useEffect(() => {
    getJobs().then(allJobs => setJobs(allJobs.filter(j => j.isActive)));
  }, []);

  const selectedJob = jobs.find(j => j.id === form.jobId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jobId || !form.fullName || !form.email || !form.phone) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const app = await saveApplication({
        ...form,
        jobId: form.jobId,
        jobTitle: selectedJob?.title || "General Application",
        cvFileName: "",
      });

      if (app) {
        // Send Telegram notification (fire and forget)
        sendToTelegram(app).then(ok => {
          if (ok) console.log('Telegram notification sent');
          else console.log('Telegram notification skipped or failed');
        });

        // Send confirmation email (fire and forget)
        buildApplicationConfirmationEmail(app).then(emailHtml => {
          sendEmail(app.email, "Application Received — CareHomeStaffUK", emailHtml).then(ok => {
          if (ok) console.log('Confirmation email sent');
            else console.log('Confirmation email skipped (SMTP may not be configured)');
          });
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
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 p-8 animate-fade-in">
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
            <h1 className="font-heading text-3xl font-bold">Application Submitted!</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Thank you for your application. A confirmation email has been sent to your inbox. Our team will review your details and get back to you within 3-5 working days.
            </p>
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
            <h1 className="font-heading text-3xl font-bold text-hero-foreground">Apply Now</h1>
            <p className="text-hero-foreground/70 mt-2">Start your care career in the UK</p>
          </div>
        </div>

        <div className="container py-10 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
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
              <Label htmlFor="coverLetter">Cover Letter</Label>
              <Textarea id="coverLetter" value={form.coverLetter} onChange={e => setForm(f => ({ ...f, coverLetter: e.target.value }))} placeholder="Tell us why you'd be great for this role..." rows={4} />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default ApplyPage;
