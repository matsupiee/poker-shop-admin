import { authClient } from "./auth-client";


type SignUpParams = {
    email: string;
    password: string;
    name: string;
    image?: string;
}

export const signUp = async ({ email, password, name, image }: SignUpParams) => {
    return await authClient.signUp.email({
        email,
        password,
        name,
        image,
        callbackURL: "/dashboard"
    }, {
        onRequest: (ctx) => {
            //show loading
        },
        onSuccess: (ctx) => {
            //redirect to the dashboard or sign in page
            window.location.href = "/dashboard";
        },
        onError: (ctx) => {
            // display the error message
            alert(ctx.error.message);
        },
    });
};