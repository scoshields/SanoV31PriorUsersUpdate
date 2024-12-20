import { NOTE_FORMATS } from './formats';
import type { NoteFormatType } from './types';

import {
  GIRPNoteFormat,
  DAPNoteFormat,
  BIRPNoteFormat,
  SOAPNoteFormat,
  PIRPNoteFormat,
  RIFTNoteFormat,
  CARENoteFormat,
  STOPNoteFormat,
  MINTNoteFormat,
  FORTNoteFormat
} from '../prompts/basePrompt';

const NOTE_FORMAT_PROMPTS: Record<string, string> = {
  girp: GIRPNoteFormat,
  dap: DAPNoteFormat,
  birp: BIRPNoteFormat,
  soap: SOAPNoteFormat,
  pirp: PIRPNoteFormat,
  rift: RIFTNoteFormat,
  care: CARENoteFormat,
  stop: STOPNoteFormat,
  mint: MINTNoteFormat,
  fort: FORTNoteFormat
};

export function getNoteFormatPrompt(formatType: NoteFormatType): string {
  return NOTE_FORMAT_PROMPTS[formatType] || NOTE_FORMAT_PROMPTS.girp;
}