
export interface JournalEntry {
  id: string;
  filename: string;
  content: string;
  timestamp: Date; // Timestamp of file read/upload
}

export interface AIAnalysisResult {
  emotion: string;
  qualities: string[]; // e.g., ["achievement", "stress", "gratitude"]
  summary?: string; // A brief summary, if generated
}

export interface AnalyzedEntry extends AIAnalysisResult {
  id: string;
  journalEntry: JournalEntry;
  timestamp: Date; // Timestamp of analysis
}

export interface CheckInSuggestionItem {
  id: string;
  question: string;
  basedOnAnalyzedEntryId: string;
  relatedEmotion: string;
  relatedQualities: string[];
}

export interface CheckInResponse {
    id: string;
    text: string;
    respondedAt: Date;
    // Potentially, this response could also be analyzed by AI later
    // analysis?: AIAnalysisResult; 
}

export interface CheckIn {
  id: string;
  question: string;
  basedOnAnalyzedEntryId?: string; // Link to the entry that inspired this check-in
  createdAt: Date;
  status: 'pending' | 'responded' | 'dismissed'; // 'dismissed' could be for user-cancelled ones
  responses: CheckInResponse[];
}

// For Gemini API service
export interface GeminiEmotionAnalysis {
    emotion: string;
    qualities: string[];
}
