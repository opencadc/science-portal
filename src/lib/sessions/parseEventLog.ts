import type { EventReason, EventType, SessionEvent } from '@/app/types/EventsModalProps';

/**
 * Parse Skaha container events/logs plain-text into structured rows.
 */
export function parseEventLog(logData: string): { events: SessionEvent[]; hasParseErrors: boolean } {
  const lines = logData.trim().split('\n');
  if (lines.length < 2) return { events: [], hasParseErrors: false };

  const events: SessionEvent[] = [];
  let hasParseErrors = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(/^(\S+)\s+(\S+)\s+(.*?)\s+(\S+|<nil>)\s+(\S+|<nil>)$/);

    if (match) {
      const [, type, reason, message, firstTime, lastTime] = match;

      events.push({
        id: `event-${i}`,
        type: type as EventType,
        reason: reason as EventReason,
        message: message.trim(),
        firstTime: firstTime === '<nil>' ? null : firstTime,
        lastTime: lastTime === '<nil>' ? null : lastTime,
      });
    } else {
      hasParseErrors = true;
    }
  }

  return { events, hasParseErrors };
}
