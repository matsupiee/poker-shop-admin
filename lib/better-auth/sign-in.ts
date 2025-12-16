import { authClient } from "./auth-client"

type SignInParams = {
    email: string;
    password: string;
    callbackURL?: string;
    rememberMe?: boolean;
}

export const signIn = async ({ email, password, callbackURL, rememberMe }: SignInParams) => {
    const { data, error } = await authClient.signIn.email({
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
        callbackURL: "/dashboard",
        /**
         * remember the user session after the browser is closed. 
         * @default true
         */
        rememberMe: false
    }, {
        //callbacks
    })
}