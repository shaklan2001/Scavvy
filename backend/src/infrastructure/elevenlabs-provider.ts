interface ElevenLabsResponse {
  ok: boolean;
  headers: { get(name: string): string | null };
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface ElevenLabsOptions {
  apiKey: string;
  voiceId: string;
  model?: string;
  fetchFn?: (input: string, init?: RequestInit) => Promise<ElevenLabsResponse>;
}

export class ElevenLabsProvider {
  private readonly fetchFn: NonNullable<ElevenLabsOptions['fetchFn']>;

  constructor(private readonly options: ElevenLabsOptions) {
    this.fetchFn = options.fetchFn ?? (fetch as unknown as NonNullable<ElevenLabsOptions['fetchFn']>);
  }

  async synthesize(text: string): Promise<string | null> {
    if (!this.options.apiKey || !this.options.voiceId) return null;
    const response = await this.fetchFn(`https://api.elevenlabs.io/v1/text-to-speech/${this.options.voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': this.options.apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ text, model_id: this.options.model ?? 'eleven_multilingual_v2' }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') ?? 'audio/mpeg';
    const audio = Buffer.from(await response.arrayBuffer()).toString('base64');
    return `data:${contentType};base64,${audio}`;
  }
}
