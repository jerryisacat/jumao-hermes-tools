import { query } from '../db/client.js';

export async function logAgentAction(
  agentId: string,
  action: string,
  resourceType: string | null,
  resourceId: string | null,
  payloadSummary: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO agent_audit_log (agent_id, action, resource_type, resource_id, payload_summary)
       VALUES ($1, $2, $3, $4, $5)`,
      [agentId, action, resourceType, resourceId, payloadSummary]
    );
  } catch (err) {
    console.error('[audit] Failed to log agent action:', err instanceof Error ? err.message : err);
  }
}
