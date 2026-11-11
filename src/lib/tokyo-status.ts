// The homepage's live status line: "☾  it's 22:30 in tokyo. winding down."
//
// Always Tokyo time, whatever the visitor's timezone -- it says where
// *I* probably am, not what time it is for them. Edit the copy freely:
// each row is [untilHour, caption], read top to bottom, and the first
// row whose untilHour is greater than the current hour wins.

type CaptionTable = ReadonlyArray<readonly [untilHour: number, caption: string]>;

export const WEEKDAY_CAPTIONS: CaptionTable = [
  [4, 'should be asleep.'],
  [5, "alarm's about to go off."],
  [7, 'probably at the gym.'],
  [9, 'coffee first.'],
  [12, 'probably writing code.'],
  [13, 'lunch, probably.'],
  [18, 'probably in a meeting. or writing code.'],
  [21, 'done for the day. maybe.'],
  [24, 'winding down. probably offline.'],
];

export const WEEKEND_CAPTIONS: CaptionTable = [
  [4, 'should be asleep.'],
  [8, "sleeping in. it's the weekend."],
  [10, 'slow morning.'],
  [12, 'family time.'],
  [13, 'lunch, probably.'],
  [18, 'out with the family, probably.'],
  [21, 'home. family time.'],
  [24, 'winding down. probably offline.'],
];

// sun from 05:00 to 18:59, moon otherwise. U+FE0E forces the text
// presentation so iOS never swaps these for color emoji.
const SUN = '☀︎';
const MOON = '☾︎';
const SUN_FROM = 5;
const SUN_UNTIL = 19;

export interface TokyoStatus {
  glyph: string;
  time: string; // HH:MM, 24h
  caption: string;
  sentence: string; // the whole line as plain text, for screen readers
}

const tokyoParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tokyo',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function tokyoStatus(now: Date = new Date()): TokyoStatus {
  const parts = tokyoParts.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  const hour = Number(get('hour')) % 24;
  const minute = get('minute').padStart(2, '0');
  const weekend = get('weekday') === 'Sat' || get('weekday') === 'Sun';

  const table = weekend ? WEEKEND_CAPTIONS : WEEKDAY_CAPTIONS;
  const caption = (table.find(([until]) => hour < until) ?? table[table.length - 1])[1];
  const glyph = hour >= SUN_FROM && hour < SUN_UNTIL ? SUN : MOON;
  const time = `${String(hour).padStart(2, '0')}:${minute}`;

  return { glyph, time, caption, sentence: `it's ${time} in tokyo. ${caption}` };
}
