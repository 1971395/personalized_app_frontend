// Spring Boot 백엔드 주소
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://15.165.157.82:8080"

// 자바 백엔드 데이터 규격 (id, title, content, category, tags)
export interface Idea {
    id: number
    title: string
    content: string
    category: string
    tags: string | string[]
}

// 신규 등록 시 서버로 보내는 페이로드 (id는 서버가 생성)
export type IdeaPayload = Omit<Idea, "id">

// 카테고리 선택지
export const CATEGORIES = ["개발", "디자인", "기획", "마케팅", "음식", "보안", "기타"] as const

export const IDEAS_KEY = `${API_BASE_URL}/api/ideas`

export const AUTH_KEY = `${API_BASE_URL}/api/auth`

// 콤마로 구분된 tags 문자열을 배열로 변환
export function parseTags(tags: string | string[] | undefined | null): string[] {
    if (!tags) return []
    if (Array.isArray(tags)) return tags.filter(Boolean)
    return tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
}

// SWR fetcher: GET /api/ideas
export async function fetchIdeas(page: number = 0, size: number = 10) {
    const token = localStorage.getItem("token") // 👈 여기서 직접 토큰을 꺼냅니다.

    const res = await fetch(`${IDEAS_KEY}?page=${page}&size=${size}`, {
        headers: {
            "Authorization": `Bearer ${token}` // 명함 첨부
        }
    })

    if (!res.ok) {
        throw new Error("아이디어 목록을 가져오는데 실패했습니다.")
    }

    return res.json()
}

// POST /api/ideas
export async function createIdea(ideaData: { title: string; content: string; category: string; tags: string[] }) {

    // 1. 브라우저 지갑(localStorage)에서 로그인할 때 저장해둔 토큰을 꺼냅니다.
    const token = localStorage.getItem("token")

    // 2. fetch 요청을 보낼 때 headers에 Authorization 명함을 꽂아줍니다.
    const res = await fetch(IDEAS_KEY, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // ⭐ 자바 백엔드가 기다리는 바로 그 토큰 명함!
        },
        body: JSON.stringify(ideaData),
    })

    if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "아이디어 등록에 실패했습니다.")
    }

    return res.json()
}

export async function deleteIdea(id: number) {
    const token = localStorage.getItem("token");

    const targetUrl = IDEAS_KEY.endsWith('/') ? `${IDEAS_KEY}${id}` : `${IDEAS_KEY}/${id}`

    const res = await fetch(targetUrl, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "아이디어 삭제에 실패했습니다.");
    }

    return res.json();
}


export async function updateIdea(id: number, title: string, content: string) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${IDEAS_KEY}${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, content })
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "아이디어 수정에 실패했습니다.");
    }

    return res.json();
}


export interface IdeaFile {
    id: number
    originalFileName: string
    fileUrl: string
}

// 🟢 파일 업로드 API 호출 함수
export async function uploadIdeaFile(ideaId: number, file: File): Promise<IdeaFile> {
    const token = localStorage.getItem("token")

    // Multipart 전송을 위한 FormData 객체 생성
    const formData = new FormData()
    formData.append("file", file) // 컨트롤러 @RequestParam("file") 매핑 이름 일치

    const res = await fetch(`${IDEAS_KEY}/${ideaId}/files`, {
        method: "POST",
        headers: {
            // 🚨 중요: "Content-Type" 헤더를 명시하지 않아야 브라우저가 boundary 값을 정상적으로 밀어 넣습니다.
            "Authorization": `Bearer ${token}`
        },
        body: formData,
    })

    if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "파일 업로드에 실패했습니다.")
    }

    return res.json()
}

// 🟢 파일 다운로드 API 호출 함수 (Blob 처리)
export async function downloadIdeaFile(ideaId: number, fileId: number, originalFileName: string) {
    const token = localStorage.getItem("token")

    const res = await fetch(`${IDEAS_KEY}/${ideaId}/files/${fileId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })

    if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "파일 다운로드에 실패했습니다.")
    }

    // 1. 응답 스트림을 메모리 상의 이진 데이터 객체(Blob)로 파싱합니다.
    const blob = await res.blob()

    // 2. 가상의 다운로드 트리거용 <a> 태그를 만들어 브라우저 액션을 실행합니다.
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = originalFileName // 다운로드 시 저장될 파일명 지정
    document.body.appendChild(link)
    link.click()

    // 3. 메모리 누수 방지를 위한 브라우저 리소스 해제 및 가상 엘리먼트 제거
    link.remove()
    window.URL.revokeObjectURL(url)
}

