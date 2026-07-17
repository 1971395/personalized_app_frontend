"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, UserPlus, AlertCircle } from "lucide-react"
import { AUTH_KEY } from "@/lib/ideas";

export default function SignupPage() {
    const router = useRouter()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            // 스프링 부트 회원가입 API 연동
            const res = await fetch(`${AUTH_KEY}/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                    email,
                }),
            })

            if (res.ok) {
                alert("회원가입이 완료되었습니다! 로그인해 주세요.")
                router.push("/ideas") // 가입 완료 후 메인/아이디어 리스트로 이동하여 로그인 유도
            } else {
                const data = await res.json()
                setError(data.message || "회원가입에 실패했습니다.")
            }
        } catch (err) {
            setError("서버와 통신하는 중 오류가 발생했습니다. 백엔드가 가동 중인지 확인해 주세요.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="min-h-svh bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">

                {/* 헤더 */}
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                        <UserPlus className="size-5" />
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">새로운 계정 생성</h2>
                    <p className="text-xs text-muted-foreground mt-1">아이디어 노트를 시작하기 위한 정보를 입력해 주세요.</p>
                </div>

                {/* 에러 알림 */}
                {error && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive mb-4">
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* 입력 폼 */}
                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">아이디</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="사용할 아이디 입력"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="비밀번호 입력"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">이메일</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="이메일"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                가입 요청 중...
                            </>
                        ) : (
                            "회원가입 완료"
                        )}
                    </button>
                </form>

                {/* 로그인 화면으로 회항 */}
                <div className="mt-6 text-center text-xs text-muted-foreground">
                    이미 계정이 있으신가요?{" "}
                    <Link href="/ideas" className="font-semibold text-primary hover:underline">
                        로그인하기
                    </Link>
                </div>

            </div>
        </main>
    )
}