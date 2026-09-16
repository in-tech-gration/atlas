import { describe, expect, test } from '@jest/globals';
import { hhmmssToSeconds, secondsToHHMMSS } from "./converter.plugin";

describe('hhmmssToSeconds', () => {

  test('converts HH:MM:SS to seconds', () => {
    expect(hhmmssToSeconds('01:30:45')).toBe(5445);
  });

  test('converts MM:SS to seconds', () => {
    expect(hhmmssToSeconds('30:45')).toBe(1845);
  });

  test('converts SS to seconds', () => {
    expect(hhmmssToSeconds('45')).toBe(45);
  });

  test('handles invalid input format', () => {
    expect(() => hhmmssToSeconds('invalid')).toThrow();
  });

  test('handles empty string input', () => {
    expect(hhmmssToSeconds('')).toBe(0);
  });

  test('handles negative values', () => {
    expect(() => hhmmssToSeconds('-01:30:45')).toThrow();
  });

  test('handles non-numeric values', () => {
    expect(() => hhmmssToSeconds('01:30:xx')).toThrow();
  });

});

describe('secondsToHHMMSS', () => {
  test('converts 0 seconds to "00:00:00"', () => {
    expect(secondsToHHMMSS(0)).toBe("00:00:00");
  });

  test('converts 59 seconds to "00:00:59"', () => {
    expect(secondsToHHMMSS(59)).toBe("00:00:59");
  });

  test('converts 60 seconds to "00:01:00"', () => {
    expect(secondsToHHMMSS(60)).toBe("00:01:00");
  });

  test('converts 3600 seconds to "01:00:00"', () => {
    expect(secondsToHHMMSS(3600)).toBe("01:00:00");
  });

  test('converts 3661 seconds to "01:01:01"', () => {
    expect(secondsToHHMMSS(3661)).toBe("01:01:01");
  });

  test('converts 86399 seconds to "23:59:59"', () => {
    expect(secondsToHHMMSS(86399)).toBe("23:59:59");
  });

  test('converts 86400 seconds to "00:00:00" (next day)', () => {
    expect(secondsToHHMMSS(86400)).toBe("00:00:00");
  });

  test('converts 90061 seconds to "01:01:01" (next day)', () => {
    expect(secondsToHHMMSS(90061)).toBe("01:01:01");
  });
});