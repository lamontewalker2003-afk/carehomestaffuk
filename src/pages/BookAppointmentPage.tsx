import { useEffect, useMemo, useState } from "react";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { CalendarIcon, CheckCircle2, MessageCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  createAppointment,
  buildAppointmentEmail,
  sendEmail,
  getBookedSlots,
  getSiteSettings,
  type SiteSettings,
  type Appointment,
} from "@/lib/store";

// Build the next N working days (Mon–Fri) starting from tomorrow.
function nextWorkingDays(count: number): Date[] {
  const days: Date[] = [];
  let d = addDays(startOfDay(new Date()), 1);
  while (days.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) days.push(d);
    d = addDays(d, 1);
  }
  return days;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

export default function BookAppointmentPage() {
  const allowedDays = useMemo(() => nextWorkingDays(7), []);
  const minDay = allowedDays[0];
  const maxDay = allowedDays[allowedDays.length - 1];

  const [date, setDate] = useState<Date | undefined>(allowedDays[0]);
  const [time, setTime] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookedISO, setBookedISO] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);
  const [site, setSite] = useState<SiteSettings | null>(null);

  useEffect(() => {
    void getBookedSlots().then(setBookedISO);
    void getSiteSettings().then(setSite);
  }, []);

  const isWorkingDay = (d: Date) => {
    const day = d.getDay();
    if (day === 0 || day === 6) return false;
    return allowedDays.some(a => isSameDay(a, d));
  };

  const slotsForDay = useMemo(() => {
    if (!date) return [];
    return TIME_SLOTS.map(t => {
      const [h, m] = t.split(":").map(Number);
      const d = new Date(date);
      d.setHours(h, m, 0, 0);
      const taken = bookedISO.some(iso => Math.abs(new Date(iso).getTime() - d.getTime()) < 60_000);
      return { label: t, iso: d.toISOString(), taken };
    });
  }, [date, bookedISO]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      toast({ title: "Please pick a date and time", variant: "destructive" });
      return;
    }
    const slot = slotsForDay.find(s => s.label === time);
    if (!slot || slot.taken) {
      toast({ title: "That time is no longer available", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const created = await createAppointment({
      fullName, email, phone, scheduledAt: slot.iso, notes,
    });
    if (!created) {
      setSubmitting(false);
      toast({ title: "Could not save your booking. Please try again.", variant: "destructive" });
      return;
    }
    // Confirmation email — fire and forget.
    void buildAppointmentEmail(created, "appointmentConfirmation").then(({ subject, html }) =>
      sendEmail(email, subject, html, { kind: "appointment_confirmation" }),
    );
    setConfirmed(created);
    setSubmitting(false);
    setBookedISO(prev => [...prev, slot.iso]);
  };

  const whatsappNumber = site?.whatsappNumber || "";
  const whatsappLink = confirmed && whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hello ${site?.siteName || ""}, I just booked an appointment for ${format(new Date(confirmed.scheduledAt), "EEE d MMM yyyy 'at' HH:mm")}. My name is ${confirmed.fullName}.`,
      )}`
    : "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Book an Appointment | {site?.siteName || "CareHomeStaffUK"}</title>
        <meta name="description" content="Book a free 30-minute appointment with our recruitment team. Choose any working day in the next 7 days." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.origin + "/book-appointment" : ""} />
      </Helmet>

      <SiteHeader />

      <main className="flex-1 container py-12 max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl sm:text-4xl text-primary">Book an Appointment</h1>
          <p className="text-muted-foreground mt-2">Pick a working day and time within the next 7 working days.</p>
        </div>

        {confirmed ? (
          <div className="bg-card border rounded-xl p-8 text-center space-y-5">
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
            <div>
              <h2 className="font-heading text-2xl text-primary">Appointment requested!</h2>
              <p className="text-muted-foreground mt-2">
                We've received your booking for{" "}
                <span className="font-semibold text-foreground">
                  {format(new Date(confirmed.scheduledAt), "EEEE d MMMM yyyy 'at' HH:mm")}
                </span>
                . A confirmation email is on its way to <span className="font-semibold">{confirmed.email}</span>. Our team will accept or update the slot shortly.
              </p>
            </div>

            {whatsappLink && (
              <div className="bg-muted/40 rounded-lg p-5 space-y-3">
                <p className="text-sm">Want to start a conversation now? Message us on WhatsApp:</p>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#25D366] hover:bg-[#1ebe5b] text-white">
                    <MessageCircle className="h-4 w-4 mr-2" /> Chat on WhatsApp ({whatsappNumber})
                  </Button>
                </a>
              </div>
            )}

            <Button variant="outline" onClick={() => { setConfirmed(null); setTime(""); }}>
              Book another time
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-6 sm:p-8 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Full name *</Label>
                <Input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="sm:col-span-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 ..." />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => { setDate(d); setTime(""); }}
                      disabled={(d) => !isWorkingDay(d)}
                      fromDate={minDay}
                      toDate={maxDay}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground mt-1">Working days only · up to 7 days ahead.</p>
              </div>

              <div>
                <Label>Time *</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {slotsForDay.map(s => (
                    <button
                      key={s.label}
                      type="button"
                      disabled={s.taken}
                      onClick={() => setTime(s.label)}
                      className={cn(
                        "px-2 py-1.5 rounded-md text-sm border transition",
                        s.taken && "opacity-40 line-through cursor-not-allowed",
                        time === s.label
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything we should know before the call?" rows={3} />
            </div>

            <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting ? "Booking…" : "Book appointment"}
            </Button>
          </form>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
