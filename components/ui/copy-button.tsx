"use client"

import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { toast } from "sonner"

interface CopyButtonProps {
    text: string
    successMessage?: string
    errorMessage?: string
    className?: string
    iconClassName?: string
    onClick?: (e: React.MouseEvent) => void
}

export function CopyButton({
    text,
    successMessage = "コピーしました",
    errorMessage = "コピーに失敗しました",
    className = "h-6 w-6 p-0",
    iconClassName = "h-3 w-3",
    onClick
}: CopyButtonProps) {
    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation()

        if (onClick) {
            onClick(e)
        }

        try {
            await navigator.clipboard.writeText(text)
            toast.success(successMessage)
        } catch (err) {
            toast.error(errorMessage)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className={className}
            onClick={handleCopy}
        >
            <Copy className={iconClassName} />
        </Button>
    )
}
