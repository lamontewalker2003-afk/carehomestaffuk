import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { CalendarIcon, MessageCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  getAppointmentById,
  getAppointmentsByEmail,
  rescheduleAppointment,
  updateAppointmentStatus,
  buildAppointmentRescheduledEmail,
  buildAppointmentCancelledByApplicantEmail,
  sendEmail,
  getBookedSlots,
  getSiteSettings,
  type Appointment,
  type SiteSettings,
} from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30",
];

export default function AppointmentManagePage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [bookedISO, setBookedISO] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>("");
  const [cancelled, setCancelled] = useState(false);

  const allowedDays = useMemo(() => nextWorkingDays(7), []);
  const minDay = allowedDays[0];
  const maxDay = allowedDays[allowedDays.length - 1];

  // Email lookup (when no id in URL)
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupResults, setLookupResults] = useState<Appointment[] | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSiteSettings();
      setSite(s);
      if (!id) { setLoading(false); return; }
      const [a, slots] = await Promise.all([getAppointmentById(id), getBookedSlots()]);
      setAppt(a); setBookedISO(slots);
      setLoading(false);
    })();
  }, [id]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupBusy(true);
    const list = await getAppointmentsByEmail(lookupEmail);
    setLookupResults(list);
    setLookupBusy(false);
  };


  const isWorkingDay = (d: Date) => allowedDays.some(a => isSameDay(a, d));

  const slotsForDay = useMemo(() => {
    if (!date) return [];
    return TIME_SLOTS.map(t => {
      const [h, m] = t.split(":").map(Number);
      const d = new Date(date); d.setHours(h, m, 0, 0);
      const taken = bookedISO.some(iso => Math.abs(new Date(iso).getTime() - d.getTime()) < 60_000)
        && (!appt || appt.scheduledAt !== d.toISOString());
      return { label: t, iso: d.toISOString(), taken };
    });
  }, [date, bookedISO, appt]);

  const handleReschedule = async () => {
    if (!appt || !date || !time) { toast({ title: "Pick a date and time", variant: "destructive" }); return; }
    const slot = slotsForDay.find(s => s.label === time);
    if (!slot || slot.taken) { toast({ title: "That slot is no longer available", variant: "destructive" }); return; }
    setBusy(true);
    const previousISO = appt.scheduledAt;
    const updated = await rescheduleAppointment(appt.id, slot.iso);
    if (!updated) {
      setBusy(false);
      toast({ title: "Failed to reschedule. Please try again.", variant: "destructive" });
      return;
    }
    const built = await buildAppointmentRescheduledEmail(updated, previousISO);
    await sendEmail(updated.email, built.subject, built.html, { kind: "appointment_rescheduled" });
    setAppt(updated); setMode("view"); setBusy(false);
    toast({ title: "Appointment rescheduled — confirmation email sent." });
  };

  const handleCancel = async () => {
    if (!appt) return;
    if (!confirm("Cancel this appointment? You can always book a new one later.")) return;
    setBusy(true);
    await updateAppointmentStatus(appt.id, "revoked");
    const built = await buildAppointmentCancelledByApplicantEmail(appt);
    await sendEmail(appt.email, built.subject, built.html, { kind: "appointment_cancelled_by_applicant" });
    setBusy(false);
    setCancelled(true);
    toast({ title: "Appointment cancelled." });
  };

  const whatsappAvailable = !!(site?.whatsappNumber || "").replace(/\D/g, "");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet><title>Manage Appointment | {site?.siteName || "CareHomeStaffUK"}</title></Helmet>
      <SiteHeader />

      <main className="flex-1 container py-12 max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !id ? (
          <div className="bg-card border rounded-xl p-6 sm:p-8 space-y-5">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl text-primary">Find your appointment</h1>
              <p className="text-muted-foreground text-sm mt-1">Enter the email you used to book. We'll show your appointment so you can reschedule or cancel it.</p>
            </div>
            <form onSubmit={handleLookup} className="space-y-3">
              <Label htmlFor="lookup-email">Your email</Label>
              <Input id="lookup-email" type="email" required placeholder="you@example.com" value={lookupEmail} onChange={(e) => setLookupEmail(e.target.value)} />
              <Button type="submit" disabled={lookupBusy} className="bg-primary text-primary-foreground">
                {lookupBusy ? "Searching…" : "Find my appointment"}
              </Button>
            </form>
            {lookupResults && (
              lookupResults.length === 0 ? (
                <div className="text-sm text-muted-foreground border-t pt-4">
                  No appointments found for that email. <Link to="/book-appointment" className="text-primary underline">Book a new one</Link>.
                </div>
              ) : (
                <ul className="space-y-2 border-t pt-4">
                  {lookupResults.map(a => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30">
                      <div className="text-sm">
                        <p className="font-semibold">{format(new Date(a.scheduledAt), "EEE d MMM yyyy 'at' HH:mm")}</p>
                        <p className="text-xs text-muted-foreground capitalize">Status: {a.status}</p>
                      </div>
                      <Link to={`/appointments/manage/${a.id}`}>
                        <Button size="sm" variant="outline">Open / reschedule</Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        ) : !appt ? (
          <div className="bg-card border rounded-xl p-8 text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="font-heading text-2xl text-primary">Appointment not found</h1>
            <p className="text-muted-foreground">This link may be invalid or the booking was deleted.</p>
            <Link to="/book-appointment"><Button>Book a new appointment</Button></Link>
          </div>
        ) : cancelled || appt.status === "revoked" ? (
          <div className="bg-card border rounded-xl p-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h1 className="font-heading text-2xl text-primary">Appointment cancelled</h1>
            <p className="text-muted-foreground">Your slot has been released. You're welcome to book a new time whenever you're ready.</p>
            <Link to="/book-appointment"><Button>Book a new appointment</Button></Link>
          </div>
        ) : (
          <div className="bg-card border rounded-xl p-6 sm:p-8 space-y-6">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl text-primary">Manage your appointment</h1>
              <p className="text-muted-foreground text-sm mt-1">Booked under <span className="font-semibold text-foreground">{appt.email}</span></p>
            </div>

            <div className="bg-muted/40 rounded-lg p-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Name:</span> <span className="font-semibold">{appt.fullName}</span></p>
              <p><span className="text-muted-foreground">Current slot:</span>{" "}
                <span className="font-semibold">{format(new Date(appt.scheduledAt), "EEEE d MMMM yyyy 'at' HH:mm")}</span>
              </p>
              <p><span className="text-muted-foreground">Status:</span> <span className="capitalize font-semibold">{appt.status}</span></p>
            </div>

            {mode === "view" ? (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setMode("reschedule")} className="bg-primary text-primary-foreground">
                  <CalendarIcon className="h-4 w-4 mr-2" /> Reschedule
                </Button>
                <Button variant="destructive" onClick={handleCancel} disabled={busy}>
                  <XCircle className="h-4 w-4 mr-2" /> Cancel appointment
                </Button>
                {whatsappAvailable && (
                  <WhatsAppLink className="inline-flex">
                    <Button variant="outline" className="bg-[#25D366] hover:bg-[#1ebe5b] text-white border-transparent" asChild={false}>
                      <span className="inline-flex items-center"><MessageCircle className="h-4 w-4 mr-2" /> Chat on WhatsApp</span>
                    </Button>
                  </WhatsAppLink>
                )}
              </div>
            ) : (
              <div className="space-y-4 border-t pt-5">
                <div>
                  <label className="text-sm font-medium">Pick a new date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !date && "text-muted-foreground")}>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={date}
                        onSelect={(d) => { setDate(d); setTime(""); }}
                        disabled={(d) => !isWorkingDay(d)}
                        fromDate={minDay} toDate={maxDay} initialFocus
                        className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
                {date && (
                  <div>
                    <label className="text-sm font-medium">Pick a new time</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {slotsForDay.map(s => (
                        <button key={s.label} type="button" disabled={s.taken}
                          onClick={() => setTime(s.label)}
                          className={cn("px-2 py-1.5 rounded-md text-sm border transition",
                            s.taken && "opacity-40 line-through cursor-not-allowed",
                            time === s.label ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted")}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleReschedule} disabled={busy || !date || !time} className="bg-primary text-primary-foreground">
                    {busy ? "Saving…" : "Confirm reschedule"}
                  </Button>
                  <Button variant="outline" onClick={() => setMode("view")} disabled={busy}>Back</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
