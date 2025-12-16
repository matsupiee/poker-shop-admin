"use client"

import { useState } from "react"
import { signUp } from "@/lib/better-auth/sign-up"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const name = formData.get("name") as string
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        try {
            await signUp({ name, email, password })
        } catch (err: any) {
            setError(err.message || "An error occurred during sign up")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <UserPlus className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">新規登録</CardTitle>
                    <CardDescription>
                        新しいアカウントを作成します
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">お名前</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Taro Yamada"
                                required
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@example.com"
                                required
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">パスワード</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-background"
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-destructive font-medium text-center bg-destructive/10 p-2 rounded-md">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 mt-4">
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? "登録中..." : "登録する"}
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            すでにアカウントをお持ちの方は{" "}
                            <Link href="/sign-in" className="text-primary hover:underline">
                                ログイン
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
