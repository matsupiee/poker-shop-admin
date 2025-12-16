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
        modelName: "Staff",
    },
    session: {
        modelName: "StaffSession",
        fields: {
            userId: 'staffId'
        }
    },
    account: {
        modelName: "StaffAccount",
        fields: {
            userId: 'staffId'
        }
    },
    verification: {
        modelName: "StaffVerification",
    },
});