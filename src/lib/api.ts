const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

function getToken() {
    return localStorage.getItem("opsmind_token");
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = getToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (multipart)
    if (options.body instanceof FormData) {
        delete headers["Content-Type"];
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

    if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try {
            const data = await res.json();
            errMsg = data.message || errMsg;
        } catch { }
        throw new Error(errMsg);
    }

    return res.json();
}

// ─── Auth API ───────────────────────────────────────────────────────────────

export const authApi = {
    login: (email: string, password: string) =>
        apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

    signup: (name: string, email: string, password: string, role: string) =>
        apiFetch("/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password, role }) }),

    getMe: () => apiFetch("/auth/me"),

    getAllUsers: () => apiFetch("/auth/users"),
};

// ─── Chat API ────────────────────────────────────────────────────────────────

export const chatApi = {
    sendMessage: (message: string, conversationId?: string) =>
        apiFetch("/chat/send", {
            method: "POST",
            body: JSON.stringify({ message, conversationId }),
        }),

    getConversations: () => apiFetch("/chat/conversations"),

    getConversation: (id: string) => apiFetch(`/chat/conversations/${id}`),

    deleteConversation: (id: string) =>
        apiFetch(`/chat/conversations/${id}`, { method: "DELETE" }),
};

// ─── Documents API ───────────────────────────────────────────────────────────

export const documentsApi = {
    getDocuments: () => apiFetch("/documents"),

    getDocumentStatus: (id: string) => apiFetch(`/documents/${id}/status`),

    uploadDocuments: (files: File[]) => {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        return apiFetch("/documents/upload", { method: "POST", body: formData });
    },

    deleteDocument: (id: string) => apiFetch(`/documents/${id}`, { method: "DELETE" }),

    reindexDocument: (id: string) =>
        apiFetch(`/documents/${id}/reindex`, { method: "POST" }),
};

// ─── Dashboard API ───────────────────────────────────────────────────────────

export const dashboardApi = {
    getStats: () => apiFetch("/dashboard/stats"),
    getTopTopics: () => apiFetch("/dashboard/top-topics"),
    getTopDocuments: () => apiFetch("/dashboard/top-documents"),
    getQueryVolume: () => apiFetch("/dashboard/query-volume"),
    getRecentQueries: () => apiFetch("/dashboard/recent-queries"),
};
