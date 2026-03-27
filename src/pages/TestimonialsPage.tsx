import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Grace Okonkwo",
    role: "Care Worker",
    location: "London",
    rating: 5,
    text: "CareHomeStaffUK helped me secure my Health and Care Worker visa and find an amazing care home to work in. The process was smooth, and the team supported me every step of the way. I'm now settled in London and love my job!",
    date: "March 2026",
  },
  {
    name: "James Patterson",
    role: "Care Home Manager",
    location: "Manchester",
    rating: 5,
    text: "We've been working with CareHomeStaffUK for over a year now. They consistently provide us with well-qualified, compassionate care workers. Their screening process is thorough, and the candidates always hit the ground running.",
    date: "February 2026",
  },
  {
    name: "Maria Santos",
    role: "Senior Care Worker",
    location: "Birmingham",
    rating: 5,
    text: "After years of experience in the Philippines, I wanted to continue my career in the UK. CareHomeStaffUK connected me with a care home that sponsored my visa. I was promoted to Senior Care Worker within 8 months!",
    date: "January 2026",
  },
  {
    name: "David Richardson",
    role: "Nursing Home Director",
    location: "Leeds",
    rating: 4,
    text: "The quality of candidates we receive is exceptional. CareHomeStaffUK understands our needs and only sends applicants who genuinely care about residents' wellbeing. It has transformed our recruitment process entirely.",
    date: "December 2025",
  },
  {
    name: "Priya Sharma",
    role: "Nursing Auxiliary",
    location: "Bristol",
    rating: 5,
    text: "I was nervous about moving to a new country, but the team at CareHomeStaffUK made everything so easy. From visa paperwork to finding accommodation advice, they truly go above and beyond for their workers.",
    date: "November 2025",
  },
  {
    name: "Sarah Mitchell",
    role: "Care Home Owner",
    location: "Edinburgh",
    rating: 5,
    text: "As a small care home owner, finding reliable staff was always a challenge. Since partnering with CareHomeStaffUK, we've had a steady stream of dedicated carers. Their service is professional, quick, and affordable.",
    date: "October 2025",
  },
];

const TestimonialsPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="bg-hero py-12">
          <div className="container">
            <h1 className="font-heading text-3xl font-bold text-hero-foreground">Testimonials</h1>
            <p className="text-hero-foreground/70 mt-2">Hear from the workers and care homes we've helped</p>
          </div>
        </div>

        <div className="container py-10">
          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { value: "500+", label: "Workers Placed" },
              { value: "120+", label: "Partner Care Homes" },
              { value: "98%", label: "Satisfaction Rate" },
              { value: "4.9/5", label: "Average Rating" },
            ].map((stat, i) => (
              <div key={i} className="bg-card border rounded-lg p-5 text-center">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonial Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-card border rounded-lg p-6 flex flex-col animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <Quote className="h-6 w-6 text-accent mb-3" />
                <p className="text-sm text-muted-foreground flex-1 mb-4 leading-relaxed">{t.text}</p>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className={`h-3.5 w-3.5 ${si < t.rating ? "text-accent fill-accent" : "text-muted"}`} />
                  ))}
                </div>
                <div className="border-t pt-3">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role} · {t.location}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{t.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default TestimonialsPage;
