import { AppSidebar } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";

export default async function AuthenticatedLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth();

    return (
        <div className="flex h-screen overflow-hidden">
            <AppSidebar userEmail={session?.user?.email ?? ""} />
            <main className="flex-1 overflow-y-auto relative p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
