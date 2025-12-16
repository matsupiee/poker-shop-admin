export { auth as middleware } from "@/lib/better-auth/auth"

export const config = {
    // Matcher excluding static files and apis that don't need auth (unless strict)
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
