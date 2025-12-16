import { authClient } from "./auth-client";

export const signOut = async () => {
    await authClient.signOut({
        fetchOptions: {
            onSuccess: () => {
                router.push("/login"); // redirect to login page
            },
        },
    });
}