"use client"

import { useState } from "react"
import { Lock, User, Loader2 } from "lucide-react"
import { AUTH_KEY } from "@/lib/ideas"

export function LoginForm({ onLoginSuccess }: { onLoginSuccess: (username: string) => void }) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const res = await fetch(`${AUTH_KEY}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "로그인에 실패했습니다.")
            }

            // ⭐ 백엔드가 준 토큰과 유저 이름을 브라우저 지갑(localStorage)에 안전하게 저장!
            localStorage.setItem("token", data.token)
            localStorage.setItem("username", data.username)

            // 상위 컴포넌트에 로그인 성공 알림
            onLoginSuccess(data.username)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 text-center">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">아이디어 노트 로그인</h2>
                <p className="text-xs text-muted-foreground mt-1">나만의 아이디어를 안전하게 기록하세요.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <User className="size-3" /> 아이디
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="아이디를 입력하세요"
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Lock className="size-3" /> 비밀번호
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="비밀번호를 입력하세요"
                        required
                    />
                </div>

                {error && <p className="text-xs font-medium text-destructive text-center">{error}</p>}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : "로그인"}
                </button>
            </form>
        </div>
    )
}