import { authClient } from "./auth-client";
export const signOut = async () => {
    await authClient.signOut({
        fetchOptions: {
            onSuccess: () => {
                window.location.href = "/sign-in";
            },
        },
    });
}