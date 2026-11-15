/**
 * Small models often slip into Simplified Chinese. Everything Chinese the model writes
 * goes through OpenCC (Simplified → Taiwan Traditional, with Taiwan phrasing).
 * The converter is built on first use because its dictionary is about 1 MB.
 */
import { Converter } from 'opencc-js/cn2t';

let convert: ((s: string) => string) | null = null;

export function toTaiwan(text: string): string {
  if (!text || !/[一-鿿]/.test(text)) return text;
  if (!convert) convert = Converter({ from: 'cn', to: 'twp' });
  return convert(text);
}
