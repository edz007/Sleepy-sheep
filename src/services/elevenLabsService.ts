import AsyncStorage from '@react-native-async-storage/async-storage';

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;

// Voice ID mapping for different gender and accent combinations
// These are well-known ElevenLabs voice IDs with distinct male/female characteristics
const VOICE_IDS: Record<string, string> = {
  'female-american': 'lLgB6ZeIe84FSJa9pO1a', // Sarah - Clear female voice
  'female-british': '4BWwbsA70lmV7RMG0Acs', // Replace with actual British female voice ID
  'female-indian': 'iWq9tCtTw1SYmVpvsRjY', // Replace with actual Indian female voice ID
  'female-singaporean': '6qpxBH5KUSDb40bij36w', // Replace with actual Singaporean female voice ID
  'male-american': 'pwMBn0SsmN1220Aorv15', // Adam - Clear male voice
  'male-british': 'av1BMOR1GPgThz9p4fLo', // Replace with actual British male voice ID
  'male-indian': 'lyPbHf3pO5t4kYZYenaY', // Your Indian male voice
  'male-singaporean': 'ZyIwtt7dzBKVYuXxaRw7', // Your Singaporean male voice
};

export interface VoiceSettings {
  gender: 'male' | 'female';
  accent: 'american' | 'british' | 'indian' | 'singaporean';
  similarityBoost?: number; // 0.0 to 1.0 (voice consistency)
}

export interface AudioGenerationOptions {
  text: string;
  voiceSettings: VoiceSettings;
  modelId?: string;
  voiceSettings_eleven?: {
    stability: number;
    similarity_boost: number;
  };
}

export class ElevenLabsService {
  private static instance: ElevenLabsService;
  private cache: Map<string, string> = new Map();

  static getInstance(): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService();
    }
    return ElevenLabsService.instance;
  }

  private getVoiceId(voiceSettings: VoiceSettings): string {
    const key = `${voiceSettings.gender}-${voiceSettings.accent}`;
    return VOICE_IDS[key] || VOICE_IDS['female-american']; // Fallback to default
  }

  private getCacheKey(text: string, voiceSettings: VoiceSettings): string {
    const stability = 0.9; // Always use most calm setting
    const similarityBoost = voiceSettings.similarityBoost ?? 0.5;
    return `${voiceSettings.gender}-${voiceSettings.accent}-${stability}-${similarityBoost}-${text.length}`;
  }

  async generateAudio(options: AudioGenerationOptions): Promise<string> {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
      throw new Error('ElevenLabs API key not configured. Please add your API key to the .env file.');
    }

    const cacheKey = this.getCacheKey(options.text, options.voiceSettings);
    
    // Check cache first
    const cachedAudio = await this.getCachedAudio(cacheKey);
    if (cachedAudio) {
      console.log('🎵 Playing cached audio');
      return cachedAudio;
    }

    console.log('🎵 Generating new audio with ElevenLabs...');
    
    const voiceId = this.getVoiceId(options.voiceSettings);
    
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          body: JSON.stringify({
            text: options.text,
            model_id: options.modelId || 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.9, // Always use most calm setting
              similarity_boost: options.voiceSettings.similarityBoost ?? 0.5
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache the audio
      await this.cacheAudio(cacheKey, audioUrl);
      
      console.log('🎵 Audio generated successfully');
      return audioUrl;
    } catch (error) {
      console.error('Error generating audio:', error);
      throw error;
    }
  }

  async generatePreviewAudio(text: string, voiceSettings: VoiceSettings): Promise<string> {
    // Use a shorter text for preview to save API calls
    const previewText = text.length > 100 ? text.substring(0, 100) + '...' : text;
    return this.generateAudio({
      text: previewText,
      voiceSettings,
      voiceSettings_eleven: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    });
  }

  private async getCachedAudio(cacheKey: string): Promise<string | null> {
    try {
      const cached = await AsyncStorage.getItem(`elevenlabs_audio_${cacheKey}`);
      return cached;
    } catch (error) {
      console.error('Error getting cached audio:', error);
      return null;
    }
  }

  private async cacheAudio(cacheKey: string, audioUrl: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`elevenlabs_audio_${cacheKey}`, audioUrl);
    } catch (error) {
      console.error('Error caching audio:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const elevenLabsKeys = keys.filter(key => key.startsWith('elevenlabs_audio_'));
      await AsyncStorage.multiRemove(elevenLabsKeys);
      console.log('🎵 ElevenLabs cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  getAvailableVoices(): VoiceSettings[] {
    return [
      { gender: 'female', accent: 'american' },
      { gender: 'female', accent: 'british' },
      { gender: 'female', accent: 'indian' },
      { gender: 'female', accent: 'singaporean' },
      { gender: 'male', accent: 'american' },
      { gender: 'male', accent: 'british' },
      { gender: 'male', accent: 'indian' },
      { gender: 'male', accent: 'singaporean' },
    ];
  }

  // Method to update voice IDs (for when user gets their own voice IDs)
  updateVoiceIds(newVoiceIds: Record<string, string>): void {
    Object.assign(VOICE_IDS, newVoiceIds);
  }

  // Method to get available voices from ElevenLabs API
  async getAvailableVoices(): Promise<any[]> {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
      throw new Error('ElevenLabs API key not configured.');
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  // Helper method to find voices by accent keywords
  async findVoicesByAccent(accentKeywords: string[]): Promise<any[]> {
    const voices = await this.getAvailableVoices();
    return voices.filter(voice => 
      accentKeywords.some(keyword => 
        voice.name?.toLowerCase().includes(keyword.toLowerCase()) ||
        voice.labels?.accent?.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }
}

export default ElevenLabsService.getInstance();
