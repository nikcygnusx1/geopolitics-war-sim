export interface StructuredEvent {
  id: string;
  tick: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SYSTEM';
  type: 'STRIKE' | 'SANCTION' | 'DIPLOMACY' | 'COVERT_OP' | 'RESEARCH' | 'FISCAL' | 'MARKET' | 'SYSTEM' | 'OTHER';
  title: string;
  description: string;
  sourceCountryId?: string;
  targetCountryId?: string;
  tags: string[];
}

const COUNTRY_IDS = [
  'US', 'RU', 'CN', 'GB', 'FR', 'JP', 'DE', 'IN', 'PK', 'IR', 'KP', 'IL', 'SA', 'BR',
  'UA', 'TW', 'SY', 'YE', 'VE', 'LY', 'SO', 'AF', 'IQ', 'KR', 'TR', 'EG'
];

export function parseGlobalEvent(
  event: { tick: number; text: string; severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SYSTEM' },
  index: number
): StructuredEvent {
  const id = `evt-${event.tick}-${index}-${event.text.slice(0, 15).replace(/[^a-zA-Z0-9]/g, '')}`;
  const text = event.text;
  let type: StructuredEvent['type'] = 'OTHER';
  let title = 'Global Situation Intelligence';
  let tags: string[] = [];

  // Categorization Rules
  if (
    text.includes('Tactical Warning') ||
    text.includes('WAR CLERK') ||
    text.includes('Strike target locked') ||
    text.includes('Launch order authorized') ||
    text.includes('Ballistic target trace') ||
    text.includes('paystrike') ||
    text.includes('drone')
  ) {
    type = 'STRIKE';
    title = 'Tactical Missile / Strike Command';
    tags = ['military', 'strike', 'combat'];
  } else if (
    text.includes('Sanctions:') ||
    text.includes('full unilateral sanctions') ||
    text.includes('BLOCKADE DECREE') ||
    text.includes('embargo')
  ) {
    type = 'SANCTION';
    title = 'Economic Trade Sanctions';
    tags = ['economic', 'sanction', 'blockade'];
  } else if (
    text.includes('Diplomacy:') ||
    text.includes('aid') ||
    text.includes('AID') ||
    text.includes('TREATY') ||
    text.includes('Alliance Proposal') ||
    text.includes('Mutual Defense Alliance')
  ) {
    type = 'DIPLOMACY';
    title = 'Diplomatic Accord / Treaty';
    tags = ['diplomacy', 'alliance', 'bi-lateral'];
  } else if (
    text.includes('Signals command') ||
    text.includes('Covert') ||
    text.includes('Signals desk') ||
    text.includes('COVERT SECTOR') ||
    text.includes('covert op') ||
    text.includes('Signals scanning')
  ) {
    type = 'COVERT_OP';
    title = 'Covert Signals & Espionage';
    tags = ['intelligence', 'covert', 'espionage'];
  } else if (
    text.includes('Technology upgrade') ||
    text.includes('Sovereign researchers') ||
    text.includes('unlocked')
  ) {
    type = 'RESEARCH';
    title = 'Research / Technological Breakthrough';
    tags = ['technology', 'cyber', 'strategic'];
  } else if (
    text.includes('Fiscal Command') ||
    text.includes('budget plan') ||
    text.includes('Constitutional Core') ||
    text.includes('decree:') ||
    text.includes('Federal martial') ||
    text.includes('Cabinet reshuffle')
  ) {
    type = 'FISCAL';
    title = 'Sovereign Policy Decree';
    tags = ['government', 'fiscal', 'decree'];
  } else if (
    text.includes('Financial desk') ||
    text.includes('Central Bank') ||
    text.includes('Policy rate') ||
    text.includes('Bond Desk') ||
    text.includes('DEFAULT PROTOCOL') ||
    text.includes('futures') ||
    text.includes('Bazaar') ||
    text.includes('spot index')
  ) {
    type = 'MARKET';
    title = 'Global Market Activity';
    tags = ['finance', 'markets', 'economic'];
  } else if (
    text.includes('systems loaded') ||
    text.includes('systems reset') ||
    text.includes('Sovereign Command Simulator systems') ||
    event.severity === 'SYSTEM'
  ) {
    type = 'SYSTEM';
    title = 'Operational System Log';
    tags = ['workstation', 'telemetry', 'system'];
  }

  // Extract Source and Target Countries
  let sourceCountryId: string | undefined = undefined;
  let targetCountryId: string | undefined = undefined;

  // Arrow patterns: sourceCountryId → targetCountryId
  const arrowMatch = text.match(/([A-Z]{2,4})\s*(?:→|->)\s*([A-Z]{2,4})/);
  if (arrowMatch) {
    const s = arrowMatch[1].toUpperCase();
    const t = arrowMatch[2].toUpperCase();
    if (COUNTRY_IDS.includes(s)) sourceCountryId = s;
    if (COUNTRY_IDS.includes(t)) targetCountryId = t;
  }

  // Preposition patterns: from US to RU
  const fromToMatch = text.match(/(?:from|by|at)\s+([A-Z]{2,4})\s+(?:to|against|with)\s+([A-Z]{2,4})/i);
  if (fromToMatch) {
    const s = fromToMatch[1].toUpperCase();
    const t = fromToMatch[2].toUpperCase();
    if (COUNTRY_IDS.includes(s) && !sourceCountryId) sourceCountryId = s;
    if (COUNTRY_IDS.includes(t) && !targetCountryId) targetCountryId = t;
  }

  // Fallbacks: search for any listed country identifiers
  if (!sourceCountryId) {
    for (const cId of COUNTRY_IDS) {
      if (text.includes(` ${cId} `) || text.includes(`${cId}:`) || text.startsWith(cId) || text.includes(`in ${cId}`)) {
        sourceCountryId = cId;
        break;
      }
    }
  }

  if (!targetCountryId) {
    for (const cId of COUNTRY_IDS) {
      if (cId !== sourceCountryId && (text.includes(`targeting ${cId}`) || text.includes(`against ${cId}`) || text.includes(`with ${cId}`) || text.includes(`to ${cId}`))) {
        targetCountryId = cId;
        break;
      }
    }
  }

  return {
    id,
    tick: event.tick,
    severity: event.severity,
    type,
    title,
    description: text,
    sourceCountryId,
    targetCountryId,
    tags,
  };
}
