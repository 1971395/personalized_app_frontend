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

