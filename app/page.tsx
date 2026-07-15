"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSWRConfig } from "swr"
import { IdeaForm } from "@/components/idea-form"
import { LoginForm } from "@/components/LoginForm"
import { IDEAS_KEY } from "@/lib/ideas"

export default function RegisterPage() {
    const router = useRouter()
    const { mutate } = useSWRConfig()
    const [user, setUser] = useState<string | null>(null)

    // 1. 처음 화면이 켜질 때 브라우저 지갑에 기존 로그인 기록이 있는지 체크
    useEffect(() => {
        const savedUser = localStorage.getItem("username")
        if (savedUser) {
            setUser(savedUser)
        }
    }, [])

    // 🔐 [가드] 로그인이 안 되어 있다면 로그인 폼 띄우기
    if (!user) {
        return (
            <main className="min-h-svh bg-background flex items-center justify-center px-4">
                <LoginForm
                    onLoginSuccess={(username) => {
                        setUser(username)
                        // 로그인 성공하자마자 아이디어 목록 캐시를 미리 리셋(새로고침)해 둡니다.
                        mutate(IDEAS_KEY)
                    }}
                />
            </main>
        )
    }

    // 🔓 [메인 화면] 로그인이 성공시 기존의 아이디어 등록 폼 출력
    return (
        <main className="min-h-svh bg-background px-4 py-10">
            <div className="mx-auto w-full max-w-3xl">
                <IdeaForm
                    onCreated={() => {
                        mutate(IDEAS_KEY)
                        router.push("/ideas")
                    }}
                />
            </div>
        </main>
    )
}