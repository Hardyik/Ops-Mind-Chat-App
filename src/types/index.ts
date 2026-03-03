export type UserRole = "admin" | "employee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Citation {
  documentName: string;
  pageNumber: number;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isGuardrail?: boolean;
  suggestedQuestions?: string[];
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentStatus = "uploading" | "parsing" | "chunking" | "embedding" | "indexed" | "error";

export interface Document {
  id: string;
  name: string;
  uploadDate: Date;
  pageCount: number;
  status: DocumentStatus;
  size: string;
}

export interface QueryStat {
  topic: string;
  count: number;
}

export interface DailyQueryVolume {
  date: string;
  queries: number;
}

export interface RecentQuery {
  id: string;
  query: string;
  user: string;
  timestamp: Date;
  documentsReferenced: string[];
}
