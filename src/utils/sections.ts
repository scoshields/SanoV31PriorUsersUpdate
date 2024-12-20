import { ASSESSMENT_SECTIONS } from './responseProcessor/constants';
import { NOTE_FORMATS } from './noteFormats/formats';
import type { NoteFormatType } from './noteFormats/types';
import type { NoteSection } from '../types';

function cleanContent(content: string, isAssessment: boolean, noteFormat: NoteFormatType = 'girp'): string {
  const sections = isAssessment ? ASSESSMENT_SECTIONS : NOTE_FORMATS[noteFormat].sections;
  return content
    .replace(/^\s+|\s+$/g, '')     // Trim start/end whitespace
    .replace(/\n{3,}/g, '\n\n')    // Normalize multiple newlines
    .replace(/\[\s*|\s*\]/g, '')   // Remove square brackets
    .trim();
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findSectionContent(content: string, heading: string, sections: readonly string[]): string | null {
  const headingRegex = new RegExp(`${escapeRegExp(heading)}:[ \\t]*(?:\\r?\\n|\\r|$)`, 'i');
  const startMatch = content.match(headingRegex);
  
  if (!startMatch) return null;
  
  const startIndex = startMatch.index! + startMatch[0].length;
  const remainingContent = content.slice(startIndex);
  
  // Find the next section heading
  const nextHeadingPattern = sections
    .map(section => `${escapeRegExp(section)}:`)
    .join('|');
  const nextHeadingRegex = new RegExp(`(?:^|\\n|\\r)(${nextHeadingPattern})`, 'i');
  const endMatch = remainingContent.match(nextHeadingRegex);
  
  const endIndex = endMatch 
    ? startIndex + endMatch.index! 
    : content.length;
  
  return content
    .slice(startIndex, endIndex)
    .trim()
    .replace(/\[\s*|\s*\]/g, '');  // Remove any remaining brackets
}

export function parseSections(
  content: string, 
  isAssessment: boolean,
  noteFormat: NoteFormatType = 'girp'
): NoteSection[] {
  const sections = isAssessment ? ASSESSMENT_SECTIONS : NOTE_FORMATS[noteFormat].sections;
  const cleanedContent = cleanContent(content, isAssessment);
  const result: NoteSection[] = [];

  sections.forEach(heading => {
    const sectionContent = findSectionContent(cleanedContent, heading, sections);

    if (sectionContent) {
      const formattedContent = sectionContent.replace(/\n{2,}/g, '\n\n');
      
      const initialVersion = {
        id: 0,
        content: formattedContent,
        timestamp: Date.now()
      };

      result.push({
        id: heading.toLowerCase().replace(/\s+/g, '-'),
        heading,
        versions: [initialVersion],
        currentVersion: 0,
        isProcessing: false
      });
    }
  });

  return result;
}