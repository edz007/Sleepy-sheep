interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class GroqService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';
  private models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
  private currentModelIndex = 0;
  private maxMessages = 10; // Keep last 10 messages for context

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Groq API key not found. AI Sleep Coach will not be available.');
    }
  }

  private getSystemPrompt(userContext?: {
    bedtime?: string;
    wakeTime?: string;
    currentStreak?: number;
    sheepStage?: string;
  }): string {
    let contextInfo = '';
    if (userContext) {
      contextInfo = `\n\nUser's current sleep schedule:\n- Bedtime: ${userContext.bedtime || 'Not set'}\n- Wake time: ${userContext.wakeTime || 'Not set'}\n- Current streak: ${userContext.currentStreak || 0} days\n- Sleep progress: ${userContext.sheepStage || 'Just starting'}`;
    }

    return `You are a friendly and knowledgeable sleep coach helping users improve their sleep quality. You provide evidence-based advice on:
- Sleep hygiene practices
- Relaxation techniques
- Managing anxiety and stress before bed
- Creating optimal sleep environments
- Understanding sleep cycles and chronotypes
- Dealing with insomnia and sleep disorders

Keep responses:
- Warm and empathetic
- Concise (2-4 sentences typically)
- Actionable and practical
- Based on sleep science
- Encouraging and non-judgmental

If users mention serious medical issues, gently suggest consulting a healthcare professional.${contextInfo}`;
  }

  private formatMessages(messages: ChatMessage[], userContext?: any): ChatMessage[] {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: this.getSystemPrompt(userContext)
    };

    // Keep only the last maxMessages-1 messages (excluding system)
    const recentMessages = messages.slice(-(this.maxMessages - 1));
    
    return [systemMessage, ...recentMessages];
  }

  async sendMessage(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    userContext?: {
      bedtime?: string;
      wakeTime?: string;
      currentStreak?: number;
      sheepStage?: string;
    }
  ): Promise<{ response: string; error?: string }> {
    if (!this.apiKey) {
      return {
        response: '',
        error: 'AI Sleep Coach is not available. Please check your API configuration.'
      };
    }

    try {
      // Add user message to history
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user' as const, content: userMessage }
      ];

      // Format messages with system prompt
      const formattedMessages = this.formatMessages(updatedHistory, userContext);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.models[this.currentModelIndex],
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 500,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Unknown error';
        
        // If model is decommissioned or not found, try next model
        if (errorMessage.includes('decommissioned') || errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
          this.currentModelIndex++;
          if (this.currentModelIndex < this.models.length) {
            console.log(`Model ${this.models[this.currentModelIndex - 1]} failed, trying ${this.models[this.currentModelIndex]}`);
            // Retry with next model
            return this.sendMessage(userMessage, conversationHistory, userContext);
          }
        }
        
        throw new Error(`API Error: ${response.status} - ${errorMessage}`);
      }

      const data: GroqResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI');
      }

      const aiResponse = data.choices[0].message.content;

      return { response: aiResponse };
    } catch (error) {
      console.error('Groq API Error:', error);
      
      // Provide fallback suggestions based on common sleep issues
      const fallbackResponses = [
        "I'm having trouble connecting right now, but here are some general tips: Try the 4-7-8 breathing technique or progressive muscle relaxation. Both are proven to help with sleep.",
        "I'm experiencing technical difficulties, but you might find relief with gentle stretching or writing down your thoughts in a journal before bed.",
        "I can't respond right now, but consider trying visualization techniques - imagine yourself in a peaceful place like a beach or forest.",
        "I'm temporarily unavailable, but counting backwards from 100 or listening to calming sounds often helps quiet the mind for sleep."
      ];

      const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      return {
        response: randomFallback,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get a welcome message for new conversations
  getWelcomeMessage(): string {
    const welcomeMessages = [
      "Hi! I'm your sleep coach. What's keeping you awake tonight? I'm here to help you find peace and rest. 🌙",
      "Hello! I'm here to help you sleep better. What's on your mind that might be affecting your rest? 💤",
      "Good evening! I'm your AI sleep coach. Tell me what's troubling your sleep tonight, and I'll do my best to help. ✨",
      "Hi there! I specialize in helping people sleep better. What's preventing you from getting the rest you need? 🛌"
    ];

    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  }

  // Check if the service is properly configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const groqService = new GroqService();
export type { ChatMessage };
