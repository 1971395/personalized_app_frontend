"use client"

import { useState } from "react"
import { Loader2, AlertCircle, Inbox, Tag, Trash2 } from "lucide-react"
import { type Idea, parseTags, deleteIdea, updateIdea } from "@/lib/ideas"

// 카테고리별 배지 색상
const CATEGORY_STYLES: Record<string, string> = {
    개발: "bg-primary/10 text-primary",
    디자인: "bg-brand/20 text-brand-foreground",
    기획: "bg-secondary text-secondary-foreground",
    마케팅: "bg-accent text-accent-foreground",
    음식: "bg-red-100 text-red-700",
    보안: "bg-emerald-100 text-emerald-700",
    기타: "bg-muted text-muted-foreground",
}

function categoryStyle(category: string) {
    return CATEGORY_STYLES[category] ?? "bg-muted text-muted-foreground"
}

export function IdeaList({
                             ideas,
                             isLoading,
                             error,
                             mutate,
                         }: {
    ideas: Idea[] | undefined
    isLoading: boolean
    error: Error | undefined
    mutate: any // useSWRInfinite mutate 연동용
}) {
    // 현재 어떤 아이디어가 삭제 중인지 ID를 기록하는 상태
    const [deletingId, setDeletingId] = useState<number | null>(null)

    // 삭제 처리 함수
    const handleDelete = async (id: number) => {
        if (!confirm("정말 이 아이디어를 삭제하시겠습니까?")) return

        setDeletingId(id)
        try {
            await deleteIdea(id)
            mutate() // 실시간 동기화
        } catch (err: any) {
            alert(err.message || "삭제 중 오류가 발생했습니다.")
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <section className="w-full">
            <div className="mb-5 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    내가 등록한 아이디어
                </h2>
                {ideas && ideas.length > 0 && (
                    <span className="text-sm text-muted-foreground">{ideas.length}개</span>
                )}
            </div>

            {/* 로딩 */}
            {isLoading && (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-16 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    아이디어를 불러오는 중...
                </div>
            )}

            {/* 오류 */}
            {!isLoading && error && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card py-16 text-center">
                    <AlertCircle className="size-6 text-destructive" />
                    <p className="text-sm font-medium text-foreground">목록을 불러올 수 없습니다.</p>
                    <p className="text-xs text-muted-foreground">
                        백엔드가 실행 중인지 확인해 주세요.
                    </p>
                </div>
            )}

            {/* 빈 상태 */}
            {!isLoading && !error && ideas && ideas.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                    <Inbox className="size-6 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">아직 등록된 아이디어가 없습니다.</p>
                    <p className="text-xs text-muted-foreground">위 양식으로 첫 아이디어를 등록해 보세요.</p>
                </div>
            )}

            {/* 💡 카드 목록 출력 */}
            {!isLoading && !error && ideas && ideas.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* 💡 ID 중복을 체크하여 이미 고유 ID가 맵에 존재하면 렌더링에서 제외시킵니다. */}
                    {(() => {
                        const seenIds = new Set();
                        return ideas
                            .filter((idea) => {
                                if (seenIds.has(idea.id)) return false;
                                seenIds.add(idea.id);
                                return true;
                            })
                            .map((idea) => {
                                const tagList = parseTags(idea.tags)
                                const isCurrentDeleting = deletingId === idea.id

                                return (
                                    <IdeaCardNode
                                        key={idea.id}
                                        idea={idea}
                                        tagList={tagList}
                                        isCurrentDeleting={isCurrentDeleting}
                                        handleDelete={handleDelete}
                                        mutate={mutate}
                                    />
                                )
                            });
                    })()}
                </div>
            )}
        </section>
    )
}

// 개별 카드 노드 컴포넌트
function IdeaCardNode({ idea, tagList, isCurrentDeleting, handleDelete, mutate }: any) {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(idea.title)
    const [editContent, setEditContent] = useState(idea.content)
    const [isSaving, setIsSaving] = useState(false)

    const handleDoubleClick = () => {
        setIsEditing(true)
    }

    const handleSave = async () => {
        if (!editTitle.trim() || !editContent.trim()) return

        if (editTitle === idea.title && editContent === idea.content) {
            setIsEditing(false)
            return
        }

        setIsSaving(true)
        try {
            await updateIdea(idea.id, editTitle.trim(), editContent.trim())
            setIsEditing(false)
            mutate()
        } catch (err: any) {
            alert(err.message || "수정 중 오류가 발생했습니다.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <article
            onDoubleClick={handleDoubleClick}
            className={`relative flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-all select-none ${
                isEditing ? "border-primary ring-2 ring-primary/20" : "border-border hover:shadow-md"
            }`}
            title="더블클릭하여 수정하기"
        >
            {!isEditing && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(idea.id)
                    }}
                    disabled={isCurrentDeleting}
                    className="absolute right-4 bottom-4 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                    aria-label="아이디어 삭제"
                >
                    {isCurrentDeleting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                        <Trash2 className="size-3.5" />
                    )}
                </button>
            )}

            {isEditing ? (
                <div className="flex flex-col gap-2 w-full">
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-semibold text-foreground outline-none focus:border-primary"
                        placeholder="제목을 입력하세요"
                    />
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground outline-none resize-none focus:border-primary"
                        placeholder="내용을 입력하세요"
                    />
                    <div className="flex justify-end gap-1.5 pt-1">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="rounded-lg bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80"
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 flex items-center gap-1"
                        >
                            {isSaving && <Loader2 className="size-3 animate-spin" />}
                            저장
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-start justify-between gap-3 pr-6">
                        <h3 className="text-base font-semibold leading-snug text-card-foreground text-pretty">
                            {idea.title}
                        </h3>
                        <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${categoryStyle(
                                idea.category
                            )}`}
                        >
                            {idea.category}
                        </span>
                    </div>

                    <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground pr-6">
                        {idea.content}
                    </p>

                    {tagList.length > 0 && (
                        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                            <Tag className="size-3.5 text-muted-foreground" aria-hidden="true" />
                            {tagList.map((tag: string) => (
                                <span
                                    key={tag}
                                    className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </>
            )}
        </article>
    )
}