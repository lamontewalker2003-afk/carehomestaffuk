import { Link } from "react-router-dom";
import { MapPin, Clock, PoundSterling } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Job } from "@/lib/store";

export function JobCard({ job }: { job: Job }) {
  return (
    <div className="border rounded-lg p-6 bg-card hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading text-lg font-semibold text-card-foreground">{job.title}</h3>
          <span className="inline-block mt-1 text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
            SOC {job.socCode}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{job.description}</p>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {job.type}</span>
        <span className="flex items-center gap-1"><PoundSterling className="h-3.5 w-3.5" /> {job.salary}</span>
      </div>

      {(job.hourlyRate || job.sponsorshipFee) && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
          {job.hourlyRate && (
            <span className="bg-secondary px-2 py-1 rounded">Hourly: {job.hourlyRate}</span>
          )}
          {job.sponsorshipFee && (
            <span className="bg-secondary px-2 py-1 rounded">Sponsorship: {job.sponsorshipFee}</span>
          )}
        </div>
      )}

      <Link to={`/apply?job=${job.id}`}>
        <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
          Apply Now
        </Button>
      </Link>
    </div>
  );
}
