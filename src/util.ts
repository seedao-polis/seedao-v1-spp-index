declare namespace Intl {
  class Segmenter {
    public segment: (name: string) => string;
  }
}

export function getSegmentLength(name: string): number {
  return [...new Intl.Segmenter().segment(name)].length;
}

export function getCodePointLength(name: string): number {
  // spread operator will split string into its codepoints
  return [...name].length;
}

// 'alphanumeric' | 'digit' | 'letter' | 'mixed';
export function findCharacterSet(name: string): string {
  // regex digit only
  if (/^[0-9]+$/.test(name)) return "digit";
  // regex latin letters only
  if (/^[a-zA-Z]+$/.test(name)) return "letter";
  // regex unicode mode, alphanumeric
  // \p{L} or \p{Letter}: any kind of letter from any language.
  // \p{N} or \p{Number}: any kind of numeric character in any script.
  if (/^[\p{L}\p{N}]*$/u.test(name)) return "alphanumeric";

  return "mixed";
}
