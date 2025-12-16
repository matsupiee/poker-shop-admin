import { AppSidebar } from "@/components/app-sidebar";

export default function AuthenticatedLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex h-screen overflow-hidden">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto relative p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
