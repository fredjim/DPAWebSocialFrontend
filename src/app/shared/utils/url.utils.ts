// Rango Unicode que cubre la mayoría de emojis modernos, symbols y pictographs
const EMOJI_RANGE = '\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2190}-\\u{21FF}\\u{2B00}-\\u{2BFF}';

// URL: con o sin protocolo (http/https), o iniciando en www.
const URL_REGEX = new RegExp(
  `((https?:\\/\\/|www\\.)[^\\s<>"'${EMOJI_RANGE}]+)`,
  'giu'
);

// Email básico: usuario@dominio.tld
const EMAIL_REGEX = new RegExp(
  `([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})`,
  'giu'
);

const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface Match {
  start: number;
  end: number;
  raw: string;
  type: 'url' | 'email';
}

function findMatches(text: string): Match[] {
  const matches: Match[] = [];

  URL_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_REGEX.exec(text)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, raw: m[0], type: 'url' });
  }

  EMAIL_REGEX.lastIndex = 0;
  while ((m = EMAIL_REGEX.exec(text)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, raw: m[0], type: 'email' });
  }

  // ordenar por posición y eliminar solapamientos (prioriza URL sobre email si chocan)
  matches.sort((a, b) => a.start - b.start || b.end - a.end);

  const resolved: Match[] = [];
  let lastEnd = -1;
  for (const match of matches) {
    if (match.start >= lastEnd) {
      resolved.push(match);
      lastEnd = match.end;
    }
  }

  return resolved;
}

/**
 * Convierte el texto plano en HTML, envolviendo URLs y correos detectados
 * en <a>. Escapa todo lo demás para evitar inyección de HTML.
 */
export function buildLinkedHtml(
  text: string,
  urlClass = 'detected-url',
  emailClass = 'detected-email'
): string {
  if (!text) return '';

  const matches = findMatches(text);
  if (matches.length === 0) {
    return escapeHtml(text);
  }

  let result = '';
  let lastIndex = 0;

  for (const match of matches) {
    result += escapeHtml(text.slice(lastIndex, match.start));

    if (match.type === 'email') {
      result += `<a href="mailto:${escapeHtml(match.raw)}" class="${emailClass}">${escapeHtml(match.raw)}</a>`;
    } else {
      let cleanUrl = match.raw;
      let trailing = '';
      const trailingMatch = cleanUrl.match(TRAILING_PUNCTUATION);
      if (trailingMatch) {
        trailing = trailingMatch[0];
        cleanUrl = cleanUrl.slice(0, -trailing.length);
      }

      const href = cleanUrl.startsWith('www.') ? `https://${cleanUrl}` : cleanUrl;

      result += `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="${urlClass}">${escapeHtml(cleanUrl)}</a>${escapeHtml(trailing)}`;
    }

    lastIndex = match.end;
  }

  result += escapeHtml(text.slice(lastIndex));
  return result;
}

export function containsUrl(text: string): boolean {
  URL_REGEX.lastIndex = 0;
  return URL_REGEX.test(text);
}

export function containsEmail(text: string): boolean {
  EMAIL_REGEX.lastIndex = 0;
  return EMAIL_REGEX.test(text);
}