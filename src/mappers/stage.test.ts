import { describe, expect, it } from 'vitest';
import { groupLabel, roundToStage, statusToState } from './stage';

describe('roundToStage', () => {
  it.each([
    ['Group Stage - 1', 'group'],
    ['Group Stage - 3', 'group'],
    ['Round of 32', 'r32'],
    ['Round of 16', 'r16'],
    ['Quarter-finals', 'qf'],
    ['Semi-finals', 'sf'],
    ['3rd Place Final', 'third'],
    ['Final', 'final'],
  ] as const)('%s → %s', (round, stage) => {
    expect(roundToStage(round)).toBe(stage);
  });

  it('מבדיל "Round of 32" מ-"Round of 16"', () => {
    expect(roundToStage('Round of 32')).toBe('r32');
    expect(roundToStage('Round of 16')).toBe('r16');
  });
});

describe('statusToState', () => {
  it('מסיים', () => {
    expect(statusToState('FT')).toBe('finished');
    expect(statusToState('AET')).toBe('finished');
    expect(statusToState('PEN')).toBe('finished');
  });
  it('חי', () => {
    expect(statusToState('1H')).toBe('live');
    expect(statusToState('HT')).toBe('live');
    expect(statusToState('ET')).toBe('live');
  });
  it('מתוכנן', () => {
    expect(statusToState('NS')).toBe('scheduled');
    expect(statusToState('TBD')).toBe('scheduled');
    expect(statusToState('PST')).toBe('scheduled');
  });
});

describe('groupLabel', () => {
  it('"Group A" → "A"', () => expect(groupLabel('Group A')).toBe('A'));
  it('שומר קלט ללא קידומת', () => expect(groupLabel('H')).toBe('H'));
});
