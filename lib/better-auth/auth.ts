import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        modelName: "StaffUser",
    },
    session: {
        modelName: "StaffUserSession",
        fields: {
            userId: 'staffId'
        }
    },
    account: {
        modelName: "StaffUserAccount",
        fields: {
            userId: 'staffId'
        }
    },
    verification: {
        modelName: "StaffUserVerification",
    },
});