import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="bg-hero text-hero-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-1 mb-4">
              <span className="font-heading text-xl font-bold text-hero-foreground">CareHomeStaff</span>
              <span className="font-heading text-xl font-bold text-hero-accent">UK</span>
            </Link>
            <p className="text-sm text-hero-foreground/70">
              Connecting care homes with compassionate, qualified healthcare professionals across the United Kingdom.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-hero-foreground/70">
              <li><Link to="/jobs" className="hover:text-hero-accent transition-colors">Browse Jobs</Link></li>
              <li><Link to="/apply" className="hover:text-hero-accent transition-colors">Apply Now</Link></li>
              <li><Link to="/visa-info" className="hover:text-hero-accent transition-colors">Visa Information</Link></li>
              <li><Link to="/about" className="hover:text-hero-accent transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-hero-foreground/70">
              <li><Link to="/faq" className="hover:text-hero-accent transition-colors">FAQ</Link></li>
              <li><Link to="/testimonials" className="hover:text-hero-accent transition-colors">Testimonials</Link></li>
              <li><Link to="/contact" className="hover:text-hero-accent transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">SOC Codes We Recruit</h4>
            <ul className="space-y-2 text-sm text-hero-foreground/70">
              <li>6131 — Nursing Auxiliaries & Assistants</li>
              <li>6135 — Care Workers & Home Carers</li>
              <li>6136 — Senior Care Workers</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-hero-foreground/10 mt-8 pt-8 text-center text-xs text-hero-foreground/50">
          © {new Date().getFullYear()} CareHomeStaffUK. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
