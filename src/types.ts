export interface ChatRecord {
  id: string;
  clientName: string;
  processingMethod: string;
  processedContent: string;
  date: string;
  keywords?: string[];
  userId: string;
  createdAt: any; // Firestore Timestamp
  originalChatImage?: string;
  originalChatText?: string;
}
