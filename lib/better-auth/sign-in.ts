import { authClient } from "./auth-client"

type SignInParams = {
    email: string;
    password: string;
    callbackURL?: string;
    rememberMe?: boolean;
}

export const signIn = async ({ email, password, callbackURL, rememberMe }: SignInParams) => {
    await authClient.signIn.email({
        /**
         * The user email
         */
        email,
        /**
         * The user password
         */
        password,
        /**
         * A URL to redirect to after the user verifies their email (optional)
         */
        callbackURL: "/",
        /**
         * remember the user session after the browser is closed. 
         * @default true
         */
        rememberMe: false
    }, {
        onSuccess: () => {
            window.location.href = "/";
        },
        onError: (ctx) => {
            alert(ctx.error.message);
        }
    })
}