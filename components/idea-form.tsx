"use client"

import type React from "react"
import { useState } from "react"
import { CATEGORIES, createIdea, uploadIdeaFile } from "@/lib/ideas"
import { Lightbulb, X, Loader2, Check, AlertCircle, Paperclip, FileIcon } from "lucide-react"

type SubmitStatus =
    | { state: "idle" }
    | { state: "loading" }
    | { state: "success" }
    | { state: "error"; message: string }

export function IdeaForm({ onCreated }: { onCreated?: () => void }) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [status, setStatus] = useState<SubmitStatus>({ state: "idle" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function addTag(raw: string) {
    const value = raw.trim().replace(/,$/, "").trim()
    if (!value) return
    if (tags.includes(value)) {
      setTagInput("")
      return
    }
    if (tags.length >= 10) return
    setTags((prev) => [...prev, value])
    setTagInput("")
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // 확장자 및 크기 클라이언트 측 1차 사전 필터링 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        alert("파일 용량은 최대 10MB를 초과할 수 없습니다.")
        return
      }
      setSelectedFile(file)
    }
  }

  function removeSelectedFile() {
    setSelectedFile(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setStatus({ state: "error", message: "제목과 내용을 모두 입력해 주세요." })
      return
    }

    setStatus({ state: "loading" })
    try {
      // 1. 아이디어 본문 우선 등록
      const newIdea = await createIdea({
        title: title.trim(),
        content: content.trim(),
        category,
        tags: tags,
      })

      // 2. 첨부 파일이 있는 경우 발행된 아이디어 ID를 활용해 연쇄 업로드 진행
      if (selectedFile && newIdea.id) {
        await uploadIdeaFile(newIdea.id, selectedFile)
      }

      setStatus({ state: "success" })
      setTitle("")
      setContent("")
      setCategory(CATEGORIES[0])
      setTags([])
      setTagInput("")
      setSelectedFile(null) // 파일 초기화
      onCreated?.()
    } catch (err) {
      const message =
          err instanceof TypeError
              ? "서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요."
              : err instanceof Error
                  ? err.message
                  : "알 수 없는 오류가 발생했습니다."
      setStatus({ state: "error", message })
    }
  }

  const isLoading = status.state === "loading"

  return (
      <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="mb-8 flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground">
          <Lightbulb className="size-5" aria-hidden="true" />
        </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-card-foreground text-balance">
              아이디어 등록
            </h1>
            <p className="text-sm text-muted-foreground">
              새로운 아이디어를 기록하고 팀과 공유하세요.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* 제목 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="text-sm font-medium text-card-foreground">
              제목 <span className="text-destructive">*</span>
            </label>
            <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="아이디어의 제목을 입력하세요"
                maxLength={120}
                className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>

          {/* 카테고리 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-card-foreground">
              카테고리 <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = category === c
                return (
                    <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        aria-pressed={active}
                        className={
                          active
                              ? "rounded-lg border border-primary bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors"
                              : "rounded-lg border border-input bg-background px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                        }
                    >
                      {c}
                    </button>
                )
              })}
            </div>
          </div>

          {/* 내용 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="content" className="text-sm font-medium text-card-foreground">
              내용 <span className="text-destructive">*</span>
            </label>
            <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="아이디어에 대해 자세히 설명해 주세요"
                rows={6}
                className="resize-y rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>

          {/* 🟢 첨부파일 UI 영역 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-card-foreground">파일 첨부</label>
            <div className="flex items-center gap-3">
              <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-ring hover:text-foreground">
                <Paperclip className="size-4" />
                파일 선택
                <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.zip"
                />
              </label>

              {/* 선택된 파일 칩 표시 */}
              {selectedFile && (
                  <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1">
                    <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="max-w-[150px] truncate text-xs font-medium text-foreground sm:max-w-[240px]">
                    {selectedFile.name}
                  </span>
                    <span className="text-[10px] text-muted-foreground">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                    <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        aria-label="선택된 파일 제거"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, PDF, TXT, ZIP 형식의 파일을 최대 10MB까지 첨부할 수 있습니다.
            </p>
          </div>

          {/* 태그 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="tags" className="text-sm font-medium text-card-foreground">
              태그
            </label>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
              {tags.map((tag) => (
                  <span
                      key={tag}
                      className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                  >
                {tag}
                    <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={`${tag} 태그 삭제`}
                    >
                  <X className="size-3" />
                </button>
              </span>
              ))}
              <input
                  id="tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => addTag(tagInput)}
                  placeholder={tags.length === 0 ? "태그 입력 후 Enter (예: 신규기능)" : ""}
                  className="h-7 min-w-[8rem] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter 또는 쉼표(,)로 태그를 구분해 최대 10개까지 추가할 수 있습니다.
            </p>
          </div>

          {/* 상태 메시지 */}
          {status.state === "success" && (
              <div className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm bg-yellow-50 text-yellow-600">
                <Check className="size-4 shrink-0" />
                아이디어가 성공적으로 등록되었습니다.
              </div>
          )}
          {status.state === "error" && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {status.message}
              </div>
          )}

          {/* 제출 버튼 */}
          <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {isLoading ? "등록 중..." : "제출하기"}
          </button>
        </div>
      </form>
  )
}