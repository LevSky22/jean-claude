import { get, set, keys, del } from 'idb-keyval';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatTranscript {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

class TranscriptStore {
  private readonly keyPrefix = 'transcript:';

  private generateTranscriptKey(id: string): string {
    return `${this.keyPrefix}${id}`;
  }

  private generateTranscriptId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  async saveTranscript(transcript: Omit<ChatTranscript, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatTranscript> {
    const id = this.generateTranscriptId();
    const now = new Date();
    
    const fullTranscript: ChatTranscript = {
      ...transcript,
      id,
      createdAt: now,
      updatedAt: now
    };

    await set(this.generateTranscriptKey(id), fullTranscript);
    return fullTranscript;
  }

  async updateTranscript(id: string, updates: Partial<ChatTranscript>): Promise<ChatTranscript | null> {
    const existing = await this.getTranscript(id);
    if (!existing) return null;

    const updated: ChatTranscript = {
      ...existing,
      ...updates,
      id: existing.id, // Ensure ID doesn't change
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date()
    };

    await set(this.generateTranscriptKey(id), updated);
    return updated;
  }

  async getTranscript(id: string): Promise<ChatTranscript | null> {
    try {
      const transcript = await get(this.generateTranscriptKey(id));
      return transcript || null;
    } catch (error) {
      // Error loading transcript
      return null;
    }
  }

  async getAllTranscripts(): Promise<ChatTranscript[]> {
    try {
      const allKeys = await keys();
      const transcriptKeys = allKeys.filter(key => 
        typeof key === 'string' && key.startsWith(this.keyPrefix)
      );

      const transcripts: ChatTranscript[] = [];
      for (const key of transcriptKeys) {
        const transcript = await get(key);
        if (transcript) {
          transcripts.push(transcript);
        }
      }

      // Sort by creation date (newest first)
      return transcripts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      // Error loading all transcripts
      return [];
    }
  }

  async deleteTranscript(id: string): Promise<boolean> {
    try {
      await del(this.generateTranscriptKey(id));
      return true;
    } catch (error) {
      // Error deleting transcript
      return false;
    }
  }

  async deleteAllTranscripts(): Promise<boolean> {
    try {
      const allKeys = await keys();
      const transcriptKeys = allKeys.filter(key => 
        typeof key === 'string' && key.startsWith(this.keyPrefix)
      );

      for (const key of transcriptKeys) {
        await del(key);
      }

      return true;
    } catch (error) {
      // Error deleting all transcripts
      return false;
    }
  }

  async exportTranscriptsAsMarkdown(): Promise<string> {
    const transcripts = await this.getAllTranscripts();
    
    if (transcripts.length === 0) {
      return '# Jean-Claude Chat Transcripts\n\nNo transcripts available.';
    }

    let markdown = '# Jean-Claude Chat Transcripts\n\n';
    markdown += `Exported on: ${new Date().toLocaleString()}\n\n`;

    for (const transcript of transcripts) {
      markdown += `## ${transcript.title}\n\n`;
      markdown += `**Created:** ${new Date(transcript.createdAt).toLocaleString()}\n`;
      markdown += `**Updated:** ${new Date(transcript.updatedAt).toLocaleString()}\n\n`;

      for (const message of transcript.messages) {
        const role = message.role === 'user' ? 'User' : 'Jean-Claude';
        markdown += `### ${role}\n\n`;
        markdown += `${message.content}\n\n`;
        markdown += `*${new Date(message.timestamp).toLocaleString()}*\n\n`;
        markdown += '---\n\n';
      }

      markdown += '\n';
    }

    return markdown;
  }

  async downloadTranscriptsAsMarkdown(): Promise<void> {
    const markdown = await this.exportTranscriptsAsMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `jean-claude-transcripts-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async getTranscriptCount(): Promise<number> {
    try {
      const allKeys = await keys();
      return allKeys.filter(key => 
        typeof key === 'string' && key.startsWith(this.keyPrefix)
      ).length;
    } catch (error) {
      // Error getting transcript count
      return 0;
    }
  }

  generateTitleFromMessage(message: string): string {
    const maxLength = 50;
    const cleanMessage = message.trim();
    
    if (cleanMessage.length <= maxLength) {
      return cleanMessage;
    }
    
    // Truncate at word boundary
    const truncated = cleanMessage.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.6) {
      return truncated.slice(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  async createNewSession(firstMessage?: string): Promise<ChatTranscript> {
    const now = new Date();
    const title = firstMessage 
      ? this.generateTitleFromMessage(firstMessage)
      : `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    
    return await this.saveTranscript({
      title,
      messages: []
    });
  }

  async addMessageToSession(sessionId: string, message: ChatMessage): Promise<ChatTranscript | null> {
    const session = await this.getTranscript(sessionId);
    if (!session) return null;

    const updatedMessages = [...session.messages, message];
    
    // Auto-update title if this is the first user message
    let title = session.title;
    if (session.messages.length === 0 && message.role === 'user') {
      title = this.generateTitleFromMessage(message.content);
    }

    return await this.updateTranscript(sessionId, {
      messages: updatedMessages,
      title
    });
  }
}

export const transcriptStore = new TranscriptStore();