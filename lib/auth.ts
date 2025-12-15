import NextAuth from "next-auth"

// 本当はbetter-authを使いたかったが、prisma v7に対応してなかったので断念
export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [],
})