"use client"

import { useState, useEffect, useRef } from "react"
import useSWRInfinite from "swr/infinite"
import Link from "next/link"
import { Loader2, AlertCircle, Inbox, Network, LayoutGrid, PlusCircle, LogOut, ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { IdeaList } from "@/components/idea-list"
import { IdeaMindmap } from "@/components/idea-mindmap"
import { LoginForm } from "@/components/LoginForm"
import { IdeaForm } from "@/components/IdeaForm" // 🟢 추가: 파일 업로드 폼 바인딩
import { IDEAS_KEY } from "@/lib/ideas"

type View = "mindmap" | "cards"

export default function IdeasPage() {
    const [user, setUser] = useState<string | null>(null)
    const [view, setView] = useState<View>("mindmap")

    // 📄 마인드맵 뷰 전용 현재 페이지 상태 추가 (0부터 시작)
    const [mindmapPage, setMindmapPage] = useState(0)

    // 🟢 [검색 상태] 실시간 입력값(keyword)과 0.3초 대기 후 적용될 최종 검색값(debouncedKeyword) 분리
    const [keyword, setKeyword] = useState('')
    const [debouncedKeyword, setDebouncedKeyword] = useState('')

    // 카드 뷰용 바닥 감지 Ref
    const observerTarget = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const savedUser = localStorage.getItem("username")
        if (savedUser) {
            setUser(savedUser)
        }
    }, [])

    // 🟢 디바운스 이펙트: 타이핑을 멈추고 300ms가 지나면 백엔드로 전송할 debouncedKeyword를 업데이트합니다.
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedKeyword(keyword)
        }, 300)

        return () => {
            clearTimeout(handler)
        }
    }, [keyword])

    // 🔄 useSWRInfinite 키 생성 함수
    const getKey = (pageIndex: number, previousPageData: any) => {
        if (!user) return null

        // 끝에 도달했으면 더 이상 요청하지 않음
        if (previousPageData && (!previousPageData.content || previousPageData.content.length === 0)) {
            return null
        }

        // 🟢 검색어가 있을 때 요청 주소 뒤에 안전하게 파라미터 조립 (공백 제거 및 인코딩 적용)
        const keywordParam = debouncedKeyword ? `&keyword=${encodeURIComponent(debouncedKeyword.trim())}` : ''

        // 💡 마인드맵 뷰일 때는 누적하지 않고 현재 선택된 단일 페이지만 긁어오도록 설정
        if (view === "mindmap") {
            return `${IDEAS_KEY}?page=${mindmapPage}&size=10${keywordParam}`
        }

        // 카드 뷰일 때는 원래대로 pageIndex에 맞춰 무한 누적 요청
        return `${IDEAS_KEY}?page=${pageIndex}&size=10${keywordParam}`
    }

    const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite(
        getKey,
        async (url: string) => {
            const currentToken = localStorage.getItem("token")
            const res = await fetch(url, {
                headers: {"Authorization": `Bearer ${currentToken}`}
            })
            if (!res.ok) throw new Error("데이터를 불러오지 못했습니다.")
            return await res.json()
        }
    )

    // 💡 뷰 모드 또는 검색어가 바뀔 때 데이터 요청 상태를 안전하게 초기화
    useEffect(() => {
        if (view === "mindmap") {
            setSize(1) // 마인드맵은 단일 페이지 배열만 유지
        } else {
            setMindmapPage(0) // 카드 뷰로 가면 마인드맵 페이지 리셋
            setSize(1)
        }
    }, [view, debouncedKeyword, setSize]) // 🟢 debouncedKeyword 조건도 감시 대상에 추가하여 검색 시 페이징 리셋

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("username")
        setUser(null)
    }

    // 💡 데이터 가공 분기 처리
    const ideas = data
        ? (view === "mindmap"
            ? (data[0]?.content || [])
            : data.flatMap((pageData) => pageData.content || []))
        : []

    const hasIdeas = ideas.length > 0

    // 백엔드 원본 page 구조에서 데이터 추출 (data.page.totalPages 경로 반영)
    const targetData = view === "mindmap" ? data?.[0] : data?.[data.length - 1]
    const currentBackendPage = data?.[0]?.page?.number ?? 0
    const totalPages = data?.[0]?.page?.totalPages ? Number(data[0].page.totalPages) : 1

    // 카드 뷰 무한 스크롤이 끝에 도달했는지 여부
    const isReachingEnd = data && (data[data.length - 1]?.content?.length < 10 || data.length >= totalPages)

    // 💡 카드 뷰 전용 무한 스크롤 바닥 감지 로직
    useEffect(() => {
        if (!user || isLoading || isValidating || isReachingEnd || view !== "cards") return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setSize((prevSize) => prevSize + 1)
                }
            },
            { threshold: 0.1 }
        )

        const currentTarget = observerTarget.current
        if (currentTarget) {
            observer.observe(currentTarget)
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget)
            }
        }
    }, [user, isLoading, isValidating, isReachingEnd, setSize, view])

    // 🔐 로그인이 안 되어 있을 때
    if (!user) {
        return (
            <main className="min-h-svh bg-background flex items-center justify-center px-4">
                <LoginForm
                    onLoginSuccess={(username) => {
                        setUser(username);
                        mutate();
                    }}
                />
            </main>
        )
    }

    // 🔓 로그인이 성공했을 때
    return (
        <main className="min-h-svh bg-background px-4 py-10">
            <div className="mx-auto w-full max-w-4xl">

                {/* 상단 웰컴 바 */}
                <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                    <p className="text-sm font-medium text-foreground">
                        ✨ <span className="font-semibold text-primary">{user}</span>님 환영합니다!
                    </p>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm hover:bg-accent transition-colors"
                    >
                        <LogOut className="size-3.5" /> 로그아웃
                    </button>
                </div>

                {/* 🟢 [추가 및 튜닝 지점]
                    아이디어 생성 시 파일 업로드 세션까지 연쇄 처리된 후, SWR 목록을 즉시 갱신(mutate)하도록 IdeaForm에 이벤트를 바인딩합니다.
                    (만약 이 폼이 모달 등 다른 탭에 배치되어 있다면, 해당 위치에 onCreated={mutate}를 꼭 전달해 주세요.) */}
                <div className="mb-10">
                    <IdeaForm onCreated={() => mutate()} />
                </div>

                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">아이디어 목록</h1>
                        <p className="text-sm text-muted-foreground">카테고리별로 아이디어를 살펴보세요.</p>
                    </div>

                    {/* 뷰 토글 */}
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                        <button
                            type="button"
                            onClick={() => setView("mindmap")}
                            aria-pressed={view === "mindmap"}
                            className={
                                view === "mindmap"
                                    ? "flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
                                    : "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            }
                        >
                            <Network className="size-4" aria-hidden="true" />
                            마인드맵
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("cards")}
                            aria-pressed={view === "cards"}
                            className={
                                view === "cards"
                                    ? "flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
                                    : "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            }
                        >
                            <LayoutGrid className="size-4" aria-hidden="true" />
                            카드
                        </button>
                    </div>
                </div>

                {/* 🟢 검색바 UI 영역 */}
                <div className="mb-6 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="제목이나 내용으로 검색..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background pl-9 pr-20 py-2 text-sm text-foreground placeholder-muted-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        {/* ⏳ 타이핑 중 백엔드 요청 대기 시간을 알려주는 인디케이터 */}
                        {keyword !== debouncedKeyword && (
                            <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground/75 animate-pulse select-none">
                            입력 중...
                          </span>
                        )}
                    </div>
                    {keyword && (
                        <button
                            type="button"
                            onClick={() => setKeyword('')}
                            className="flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm hover:bg-accent transition-colors"
                        >
                            <X className="size-3" /> 초기화
                        </button>
                    )}
                </div>

                {/* 🟢 검색 결과 정보 표시 (검색어가 있을 때만 노출) */}
                {debouncedKeyword && !error && !isLoading && (
                    <p className="mb-4 text-xs text-muted-foreground">
                        &apos;<span className="text-foreground font-semibold">{debouncedKeyword}</span>&apos; 검색 결과 : 총 <span className="text-foreground font-semibold">{ideas.length}</span>건의 아이디어가 발견되었습니다.
                    </p>
                )}

                {/* 로딩 상태 */}
                {isLoading && ideas.length === 0 && (
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-16 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        아이디어를 불러오는 중...
                    </div>
                )}

                {/* 오류 상태 */}
                {!isLoading && error && (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card py-16 text-center">
                        <AlertCircle className="size-6 text-destructive" />
                        <p className="text-sm font-medium text-foreground">목록을 불러올 수 없습니다.</p>
                        <p className="text-xs text-muted-foreground">백엔드가 실행 중인지 확인해 주세요.</p>
                    </div>
                )}

                {/* 빈 상태 */}
                {!isLoading && !error && !hasIdeas && (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                        <Inbox className="size-6 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">
                            {debouncedKeyword ? "검색 조건과 일치하는 아이디어가 없습니다." : "아직 등록된 아이디어가 없습니다."}
                        </p>
                        {!debouncedKeyword && (
                            <Link
                                href="/"
                                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                            >
                                <PlusCircle className="size-4" aria-hidden="true" />
                                아이디어 등록하러 가기
                            </Link>
                        )}
                    </div>
                )}

                {/* 콘텐츠 영역 */}
                {!error && hasIdeas && (
                    <div className="flex flex-col gap-6">
                        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
                            {view === "mindmap" ? (
                                <IdeaMindmap ideas={ideas} username={user} mutate={mutate}/>
                            ) : (
                                <IdeaList ideas={ideas} isLoading={false} error={undefined} mutate={mutate} />
                            )}
                        </div>

                        {/* 🟢 모드 1: [마인드맵 뷰] 전용 버튼식 페이징 바 노출 */}
                        {view === "mindmap" && totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 border border-border bg-card rounded-2xl py-4 shadow-sm select-none">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMindmapPage((p) => Math.max(0, p - 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={mindmapPage === 0}
                                    className="flex size-9 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground shadow-sm hover:bg-accent transition-colors disabled:opacity-30 disabled:hover:bg-background"
                                    aria-label="이전 페이지"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>

                                <span className="text-xs font-bold text-foreground tracking-wide">
                                    {mindmapPage + 1} / {totalPages} PAGE
                                </span>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMindmapPage((p) => Math.min(totalPages - 1, p + 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={mindmapPage === totalPages - 1}
                                    className="flex size-9 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground shadow-sm hover:bg-accent transition-colors disabled:opacity-30 disabled:hover:bg-background"
                                    aria-label="다음 페이지"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            </div>
                        )}

                        {/* 🔵 모드 2: [카드 뷰] 전용 무한 스크롤 바닥 감지선 */}
                        {view === "cards" && !isReachingEnd && (
                            <div ref={observerTarget} className="flex justify-center py-4">
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            </div>
                        )}

                        {/* 카드 뷰 모든 데이터 로드 완료 안내 */}
                        {view === "cards" && isReachingEnd && ideas.length > 10 && (
                            <p className="text-center text-xs text-muted-foreground py-4">
                                🎉 모든 아이디어를 확인했습니다!
                            </p>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}