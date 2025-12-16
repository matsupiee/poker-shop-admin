import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

// 本当はbetter-authを使いたかったが、prisma v7に対応してなかったので断念
// next-authを使うことにする
export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const email = credentials?.email as string | undefined
                const password = credentials?.password as string | undefined

                if (!email || !password) {
                    return null
                }

                const adminEmail = process.env.ADMIN_EMAIL
                const adminPassword = process.env.ADMIN_PASSWORD

                if (email === adminEmail && password === adminPassword) {
                    return { id: "admin", name: "Admin User", email: adminEmail }
                }

                return null
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized: async ({ auth, request: { nextUrl } }) => {
            const isLoggedIn = !!auth
            const isOnLoginPage = nextUrl.pathname.startsWith('/login')

            if (isOnLoginPage) {
                if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
                return true
            }

            return isLoggedIn
        },
    },
})