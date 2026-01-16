import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Your profile</h1>
        <p className="text-sm text-muted-foreground">
          Update your location, education, and interests.
        </p>
      </div>
      <div className="mt-8 rounded-xl border bg-card p-8 text-card-foreground">
        <ProfileForm initialValues={profile ?? undefined} />
      </div>
    </main>
  );
}
