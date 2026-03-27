import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JobCard } from "@/components/JobCard";
import { getJobs } from "@/lib/store";

const JobsPage = () => {
  const jobs = getJobs().filter(j => j.isActive);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="bg-hero py-12">
          <div className="container">
            <h1 className="font-heading text-3xl font-bold text-hero-foreground">Available Positions</h1>
            <p className="text-hero-foreground/70 mt-2">Browse our current care home vacancies across the UK</p>
          </div>
        </div>
        <div className="container py-10">
          {jobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No positions available at the moment. Please check back later.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default JobsPage;
