export interface ChatRecord {
  id: string;
  clientName: string;
  processingMethod: string;
  processedContent: string;
  date: string;
  keywords?: string[];
  createdAt: string;
  originalChatImage?: string;
  originalChatText?: string;
}
