import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ScavvyStore } from '../domain/ports.js';
import type { Adventure, EnvironmentContext, GeneratedQuest, LocationType, Quest, VerificationResult } from '../domain/types.js';

type Row = Record<string, unknown>;

function requireData<T>(data: T | null, error: { message?: string } | null): T {
  if (error) throw new Error(error.message ?? 'Supabase request failed');
  if (data === null) throw new Error('Supabase returned no data');
  return data;
}

function toAdventure(row: Row): Adventure {
  return {
    id: String(row.id),
    locationType: row.location_type as LocationType,
    status: row.status as Adventure['status'],
    xp: Number(row.xp),
    createdAt: String(row.created_at),
    ...(row.completed_at ? { completedAt: String(row.completed_at) } : {}),
  };
}

function toQuest(row: Row): Quest {
  return {
    id: String(row.id), adventureId: String(row.adventure_id), type: row.type as Quest['type'],
    title: String(row.title), description: String(row.description), difficulty: row.difficulty as Quest['difficulty'],
    xp: Number(row.xp), status: row.status as Quest['status'],
  };
}

export class SupabaseRepository implements ScavvyStore {
  constructor(private readonly client: SupabaseClient) {}

  async createAdventure(locationType: LocationType): Promise<Adventure> {
    const { data, error } = await this.client.from('adventures').insert({ location_type: locationType }).select('*').single();
    return toAdventure(requireData(data as Row | null, error));
  }

  async findAdventure(id: string): Promise<Adventure | null> {
    const { data, error } = await this.client.from('adventures').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toAdventure(data as Row) : null;
  }

  async updateAdventure(id: string, patch: Partial<Adventure>): Promise<Adventure> {
    const updates: Row = {};
    if (patch.status) updates.status = patch.status;
    if (patch.xp !== undefined) updates.xp = patch.xp;
    if (patch.completedAt !== undefined) updates.completed_at = patch.completedAt;
    const { data, error } = await this.client.from('adventures').update(updates).eq('id', id).select('*').single();
    return toAdventure(requireData(data as Row | null, error));
  }

  async saveEnvironmentScan(adventureId: string, context: EnvironmentContext): Promise<void> {
    const { error } = await this.client.from('environment_scans').upsert({ adventure_id: adventureId, image_count: 3, context }, { onConflict: 'adventure_id' });
    if (error) throw new Error(error.message);
  }

  async findEnvironmentScan(adventureId: string): Promise<EnvironmentContext | null> {
    const { data, error } = await this.client.from('environment_scans').select('context').eq('adventure_id', adventureId).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? data.context as EnvironmentContext : null;
  }

  async saveQuests(adventureId: string, quests: GeneratedQuest[]): Promise<Quest[]> {
    const rows = quests.map((quest, orderIndex) => ({ adventure_id: adventureId, ...quest, order_index: orderIndex }));
    const { data, error } = await this.client.from('quests').upsert(rows, { onConflict: 'adventure_id,order_index' }).select('*').order('order_index');
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => toQuest(row as Row));
  }

  async listQuests(adventureId: string): Promise<Quest[]> {
    const { data, error } = await this.client.from('quests').select('*').eq('adventure_id', adventureId).order('order_index');
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => toQuest(row as Row));
  }

  async findQuest(id: string): Promise<Quest | null> {
    const { data, error } = await this.client.from('quests').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toQuest(data as Row) : null;
  }

  async saveAttempt(questId: string, result: VerificationResult): Promise<void> {
    const { error } = await this.client.from('quest_attempts').insert({
      quest_id: questId,
      success: result.success,
      confidence: result.confidence,
      explanation: result.explanation,
      scavvy_reaction: result.scavvyReaction,
    });
    if (error) throw new Error(error.message);
  }

  async completeQuestIfPending(id: string): Promise<boolean> {
    const { data, error } = await this.client.from('quests').update({ status: 'completed' }).eq('id', id).eq('status', 'available').select('id');
    if (error) throw new Error(error.message);
    return (data ?? []).length === 1;
  }

  async addXp(adventureId: string, xp: number): Promise<void> {
    const { error } = await this.client.rpc('increment_adventure_xp', { adventure_id: adventureId, xp_amount: xp });
    if (error) throw new Error(error.message);
  }

  async saveHint(questId: string, level: number, text: string, audioUrl: string | null): Promise<void> {
    const { error } = await this.client.from('hints').insert({ quest_id: questId, level, text, audio_url: audioUrl });
    if (error) throw new Error(error.message);
  }
}

export function createSupabaseRepository(url: string, serviceRoleKey: string): SupabaseRepository {
  return new SupabaseRepository(createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } }));
}
