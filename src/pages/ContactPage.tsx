import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { saveContactSubmission, sendEmail, buildContactConfirmationEmail, getSiteSettings, defaultSiteSettings } from "@/lib/store";
import type { SiteSettings } from "@/lib/store";
import { Mail, Phone, MapPin, Clock, CheckCircle } from "lucide-react";

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [site, setSite] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => { getSiteSettings().then(setSite); }, []);

  const contactInfo = [
    { icon: Mail, label: "Email", value: site.contactEmail, href: `mailto:${site.contactEmail}` },
    { icon: Phone, label: "Phone", value: site.contactPhone, href: `tel:${site.contactPhone.replace(/[^\d+]/g, '')}` },
    { icon: MapPin, label: "Address", value: site.contactAddress, href: undefined },
    { icon: Clock, label: "Office Hours", value: site.officeHours, href: undefined },
  ].filter(i => i.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Save to database
      await saveContactSubmission(form);

      // Send confirmation email (fire and forget)
      buildContactConfirmationEmail(form.name).then(emailHtml => {
        sendEmail(form.email, "We've Received Your Message — CareHomeStaffUK", emailHtml).then(ok => {
          if (ok) console.log('Contact confirmation email sent');
          else console.log('Contact email skipped (SMTP may not be configured)');
        });
      });

      // Send Telegram notification about the contact (fire and forget)
      const { supabase } = await import("@/integrations/supabase/client");
      supabase.functions.invoke('send-telegram', {
        body: {
          message: `📩 <b>New Contact Message</b>\n\n<b>Name:</b> ${form.name}\n<b>Email:</b> ${form.email}\n<b>Subject:</b> ${form.subject || 'N/A'}\n<b>Message:</b>\n${form.message}`,
        },
      });

      setSubmitted(true);
      toast({ title: "Message sent successfully!" });
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="bg-hero py-12">
          <div className="container">
            <h1 className="font-heading text-3xl font-bold text-hero-foreground">Contact Us</h1>
            <p className="text-hero-foreground/70 mt-2">We'd love to hear from you. Get in touch today.</p>
          </div>
        </div>

        <div className="container py-10">
          <div className="grid lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="font-heading text-xl font-semibold">Get in Touch</h2>
              <p className="text-muted-foreground text-sm">
                Whether you're a care home looking for staff or a worker seeking opportunities, our team is here to help.
              </p>
              <div className="space-y-4">
                {contactInfo.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm font-medium hover:text-primary transition-colors">{item.value}</a>
                      ) : (
                        <p className="text-sm font-medium">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              {submitted ? (
                <div className="bg-card rounded-lg border p-10 text-center space-y-4 animate-fade-in">
                  <CheckCircle className="h-14 w-14 text-success mx-auto" />
                  <h2 className="font-heading text-2xl font-bold">Message Sent!</h2>
                  <p className="text-muted-foreground">Thank you for reaching out. A confirmation email has been sent. We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-6 space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Your Name *</Label>
                      <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div>
                      <Label htmlFor="email">Your Email *</Label>
                      <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="How can we help?" />
                  </div>
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea id="message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us more..." rows={5} required />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default ContactPage;
