import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Button } from "@/components/ui/button";
import { AuthActions } from "@/components/auth/auth-actions";

export default async function Home() {
  const session = await getServerSession(authOptions);
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              Internships
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Find the right internship faster
            </h1>
          </div>
          <AuthActions isAuthed={!!session} />
        </header>

        <section className="rounded-xl border bg-card p-8 text-card-foreground">
          <h2 className="text-xl font-semibold">Popular cities</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse curated internship listings in top student hubs.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {["Amsterdam", "Utrecht", "Rotterdam", "Eindhoven", "Groningen", "Leiden"].map(
              (city) => (
                <div
                  key={city}
                  className="rounded-lg border border-dashed p-4 text-sm"
                >
                  {city}
                </div>
              )
            )}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-8 text-card-foreground">
          <h2 className="text-xl font-semibold">Get notified</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Save your preferences and get new internship alerts by email.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button>Set up profile</Button>
            <Button variant="secondary">Notify me</Button>
          </div>
        </section>
      </main>
    </div>
  );
}
