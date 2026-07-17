"use client"

import { useMemo, useState } from "react"
import {ChevronDown, ChevronRight, Lightbulb, Tag, Trash2, Loader2, Download} from "lucide-react"
import { type Idea, parseTags, deleteIdea, updateIdea, downloadIdeaFile } from "@/lib/ideas"

// 카테고리별 강조 색 (점/연결선)
const CATEGORY_COLORS: Record<string, string> = {
    개발: "bg-primary",
    디자인: "bg-brand",
    기획: "bg-emerald-500",
    마케팅: "bg-orange-500",
    음식: "bg-red-500",
    보안: "bg-sky-500",
    기타: "bg-muted-foreground",
}

function categoryColor(category: string) {
    return CATEGORY_COLORS[category] ?? "bg-muted-foreground"
}

type CategoryGroup = { category: string; ideas: Idea[] }

export function IdeaMindmap({
                                ideas,
                                mutate,
                                username
                            }: {
    ideas: Idea[]
    mutate: () => void
    username: string | null
}) {
    // 현재 삭제 중인 아이디어 ID 상태 관리
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const groups = useMemo<CategoryGroup[]>(() => {
        const map = new Map<string, Idea[]>()
        for (const idea of ideas) {
            const key = idea.category?.trim() || "기타"
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(idea)
        }
        return Array.from(map.entries()).map(([category, list]) => ({
            category,
            ideas: list,
        }))
    }, [ideas])

    // 기본적으로 모든 카테고리를 펼친 상태
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

    function toggle(category: string) {
        setCollapsed((prev) => ({ ...prev, [category]: !prev[category] }))
    }

    // 마인드맵 전용 삭제 핸들러 함수
    const handleDelete = async (id: number) => {
        if (!confirm("정말 이 아이디어를 삭제하시겠습니까?")) return

        setDeletingId(id)
        try {
            await deleteIdea(id)
            mutate()
        } catch (err: any) {
            alert(err.message || "삭제 중 오류가 발생했습니다.")
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="w-full overflow-x-auto">
            <div className="flex min-w-fit items-start gap-0 py-4">
                {/* 루트 노드 */}
                <div className="flex shrink-0 items-center pt-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <Lightbulb className="size-4" aria-hidden="true" />
            </span>
                        <div className="leading-tight">
                            <p className="text-sm font-semibold text-card-foreground">{username ? `${username}의 아이디어` : "내 아이디어"}</p>
                            <p className="text-xs text-muted-foreground">{ideas.length}개</p>
                        </div>
                    </div>
                    {/* 루트 → 카테고리 연결선 */}
                    <div className="h-px w-8 bg-border" aria-hidden="true" />
                </div>

                {/* 카테고리 가지들 */}
                <div className="flex flex-col gap-4 border-l border-border pl-8">
                    {groups.map((group) => {
                        const isCollapsed = collapsed[group.category]
                        return (
                            <div key={group.category} className="relative flex items-start gap-0">
                                {/* 세로 가지에서 뻗어나온 가로선 */}
                                <div
                                    className="absolute -left-8 top-6 h-px w-8 bg-border"
                                    aria-hidden="true"
                                />

                                {/* 카테고리 노드 */}
                                <div className="flex shrink-0 items-center pt-3">
                                    <button
                                        type="button"
                                        onClick={() => toggle(group.category)}
                                        aria-expanded={!isCollapsed}
                                        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-left shadow-sm transition-colors hover:border-ring"
                                    >
                    <span
                        className={`size-2.5 shrink-0 rounded-full ${categoryColor(group.category)}`}
                        aria-hidden="true"
                    />
                                        <span className="text-sm font-semibold text-card-foreground">
                      {group.category}
                    </span>
                                        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {group.ideas.length}
                    </span>
                                        {isCollapsed ? (
                                            <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                                        ) : (
                                            <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                                        )}
                                    </button>
                                    {!isCollapsed && group.ideas.length > 0 && (
                                        <div className="h-px w-8 bg-border" aria-hidden="true" />
                                    )}
                                </div>

                                {/* 아이디어 잎 노드들 */}
                                {!isCollapsed && (
                                    <div className="flex flex-col gap-3 border-l border-border pl-8">
                                        {group.ideas.map((idea) => {
                                            const tags = parseTags(idea.tags)
                                            const isCurrentDeleting = deletingId === idea.id // 👈 여기서 변수를 똑바로 정의해서 노드로 전달합니다.

                                            return (
                                                <MindmapNode
                                                    key={idea.id}
                                                    idea={idea}
                                                    tags={tags}
                                                    isCurrentDeleting={isCurrentDeleting} // 👈 바인딩 전달 확인
                                                    handleDelete={handleDelete}
                                                    mutate={mutate}
                                                />
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// 🟢 더블클릭 제어가 가능한 마인드맵 개별 카드 노드 컴포넌트
function MindmapNode({ idea, tags, isCurrentDeleting, handleDelete, mutate }: any) {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(idea.title)
    const [editContent, setEditContent] = useState(idea.content)
    const [isSaving, setIsSaving] = useState(false)
    const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null)

    const handleDownload = async (fileId: number, originalFileName: string) => {
        setDownloadingFileId(fileId)
        try {
            await downloadIdeaFile(idea.id, fileId, originalFileName)
        } catch (err: any) {
            alert(err.message || "다운로드에 실패했습니다.")
        } finally {
            setDownloadingFileId(null)
        }
    }

    // 카드 더블클릭 핸들러
    const handleDoubleClick = () => {
        setIsEditing(true)
    }

    // 변경사항 저장 통신 함수
    const handleSave = async () => {
        if (!editTitle.trim() || !editContent.trim()) return

        // 변경된 게 없다면 서버 통신 안 하고 바로 편집모드 종료
        if (editTitle === idea.title && editContent === idea.content) {
            setIsEditing(false)
            return
        }

        setIsSaving(true)
        try {
            await updateIdea(idea.id, editTitle.trim(), editContent.trim())
            setIsEditing(false)
            mutate() // SWR 실시간 리프레시
        } catch (err: any) {
            alert(err.message || "수정 중 오류가 발생했습니다.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="relative flex items-start">
            <div className="absolute -left-8 top-6 h-px w-8 bg-border" aria-hidden="true" />

            <article
                onDoubleClick={handleDoubleClick}
                className={`relative w-64 shrink-0 rounded-xl border bg-card p-4 shadow-sm transition-all select-none ${
                    isEditing ? "border-primary ring-2 ring-primary/20" : "border-border hover:shadow-md"
                }`}
                title="더블클릭하여 수정하기"
            >
                {/* 삭제 휴지통 버튼 (수정 중이 아닐 때만 노출) */}
                {!isEditing && (
                    <button
                        type="button"
                        onClick={() => handleDelete(idea.id)}
                        disabled={isCurrentDeleting}
                        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                        aria-label="아이디어 삭제"
                    >
                        {/* ⭐ 에러 지점 해결: 현재 노드의 삭제 상태에 맞게 스피너 혹은 휴지통이 정확히 렌더링되도록 수정 */}
                        {isCurrentDeleting ? (
                            <Loader2 className="size-3 animate-spin" />
                        ) : (
                            <Trash2 className="size-3" />
                        )}
                    </button>
                )}

                {isEditing ? (
                    /* 📝 수정 양식 활성화 상태 */
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full rounded border border-input bg-background px-2 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary"
                            placeholder="제목을 입력하세요"
                        />
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="w-full rounded border border-input bg-background px-2 py-1 text-xs text-muted-foreground outline-none resize-none focus:border-primary"
                            placeholder="내용을 입력하세요"
                        />
                        <div className="flex justify-end gap-1 pt-1">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/80"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="rounded bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground hover:opacity-90 flex items-center gap-1"
                            >
                                {isSaving && <Loader2 className="size-2.5 animate-spin" />}
                                저장
                            </button>
                        </div>
                    </div>
                ) : (
                    /* 👁️ 일반 조회 상태 */
                    <>
                        <h3 className="text-sm font-semibold leading-snug text-card-foreground text-pretty pr-5">
                            {idea.title}
                        </h3>
                        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground pr-5">
                            {idea.content}
                        </p>

                        {idea.files && idea.files.length > 0 && (
                            <div className="mt-2.5 flex flex-col gap-1 border-t border-border/40 pt-2">
                                {idea.files.map((file: any) => {
                                    const isDownloading = downloadingFileId === file.id
                                    return (
                                        <button
                                            key={file.id}
                                            type="button"
                                            onClick={() => handleDownload(file.id, file.originalFileName)}
                                            disabled={isDownloading}
                                            className="flex w-full items-center justify-between rounded bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground transition-all hover:bg-muted/70"
                                        >
                                            <span className="truncate pr-1 font-medium text-left max-w-[150px]">
                                                {file.originalFileName}
                                            </span>
                                            {isDownloading ? (
                                                <Loader2 className="size-3 animate-spin shrink-0 text-primary" />
                                            ) : (
                                                <Download className="size-3 shrink-0 text-primary" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                <Tag className="size-3 text-muted-foreground" aria-hidden="true" />
                                {tags.map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </article>
        </div>
    )
}