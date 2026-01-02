import { AppSidebar } from "@/components/app-sidebar";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar userEmail={session.user.email} />
      <main className="flex-1 overflow-y-auto relative p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
