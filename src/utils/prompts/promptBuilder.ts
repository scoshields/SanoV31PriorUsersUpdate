import { GUIDED_QUESTIONS } from '../guidedQuestions';
import { ASSESSMENT_QUESTIONS } from '../assessmentQuestions';
import { THERAPY_PROMPTS } from '../therapy/prompts';
import { CLIENT_CONCERNS } from '../concerns';
import { OBSERVATION_CATEGORIES } from '../observations';
import { RESPONSE_CATEGORIES } from '../responses';
import { PLAN_CATEGORIES } from '../plans';
import { THERAPY_CATEGORIES } from '../therapy/categories';
import type { NoteFormatType } from '../noteFormats/types';
import { getNoteFormatPrompt } from '../noteFormats/prompts';
import { basePromptTemplate, assessmentPromptTemplate, GIRPNoteFormat, assessmentNoteFormat } from './basePrompt';
import type { NoteFormData } from '../../types';

function getTherapyName(typeId: string): string {
  for (const category of THERAPY_CATEGORIES) {
    const type = category.types.find(t => t.id === typeId);
    if (type) return type.name;
  }
  return typeId;
}

function getConcernLabel(id: string): string {
  const concern = CLIENT_CONCERNS.find(c => c.id === id);
  return concern ? concern.label : id;
}

function getObservationLabel(id: string): string {
  for (const category of OBSERVATION_CATEGORIES) {
    const option = category.options.find(opt => opt.id === id);
    if (option) return option.label;
  }
  return id;
}

function getResponseLabel(id: string): string {
  for (const category of RESPONSE_CATEGORIES) {
    const option = category.options.find(opt => opt.id === id);
    if (option) return option.label;
  }
  return id;
}

function getPlanLabel(id: string): string {
  for (const category of PLAN_CATEGORIES) {
    const option = category.options.find(opt => opt.id === id);
    if (option) return option.label;
  }
  return id;
}

function buildSelectedItemsContent({
  selectedTherapies,
  selectedConcerns,
  selectedObservations,
  selectedResponses,
  selectedPlans
}: NoteFormData): string {
  const sections: string[] = [];

  if (selectedTherapies.length > 0) {
    sections.push('Therapy Approaches Used:\n' + 
      selectedTherapies.map(id => `- ${getTherapyName(id)}`).join('\n'));
  }

  if (selectedConcerns.length > 0) {
    sections.push('Client Concerns:\n' + 
      selectedConcerns.map(id => `- ${getConcernLabel(id)}`).join('\n'));
  }

  if (selectedObservations.length > 0) {
    sections.push('Clinical Observations:\n' + 
      selectedObservations.map(id => `- ${getObservationLabel(id)}`).join('\n'));
  }

  if (selectedResponses.length > 0) {
    sections.push('Client Responses:\n' + 
      selectedResponses.map(id => `- ${getResponseLabel(id)}`).join('\n'));
  }

  if (selectedPlans.length > 0) {
    sections.push('Treatment Plans:\n' + 
      selectedPlans.map(id => `- ${getPlanLabel(id)}`).join('\n'));
  }

  return sections.length > 0 ? sections.join('\n\n') : '';
}

export function buildPrompt(
  selectedTherapies: string[],
  noteType: 'session' | 'assessment',
  noteFormat: NoteFormatType = 'girp',
  customInstructions?: string,
  guidedResponses?: Record<string, string>,
  formData?: NoteFormData
): string {
  // Select the appropriate base template and format
  let finalPrompt = noteType === 'assessment' ? assessmentPromptTemplate : basePromptTemplate;
  let formatTemplate = noteType === 'assessment' 
    ? assessmentNoteFormat 
    : getNoteFormatPrompt(noteFormat);
  const questions = noteType === 'assessment' ? ASSESSMENT_QUESTIONS : GUIDED_QUESTIONS;

  // Add selected items if available
  if (formData) {
    const selectedItemsContent = buildSelectedItemsContent(formData);
    if (selectedItemsContent) {
      finalPrompt = `Selected Note Items:\n\n${selectedItemsContent}\n\n${finalPrompt}`;
    }
  }

  // Add therapy-specific instructions for selected therapies
  if (noteType === 'session' && selectedTherapies.length > 0) {
    const therapyInstructions = selectedTherapies
      .map(typeId => THERAPY_PROMPTS[typeId])
      .filter(Boolean)
      .join('\n\n');
    
    if (therapyInstructions) {
      finalPrompt += `\n\nTherapy-Specific Requirements:\n${therapyInstructions}`;
    }
  }

  // Add guided responses if provided
  if (guidedResponses) {
    let guidedContent = '';
    Object.entries(guidedResponses).forEach(([id, response]) => {
      if (response.trim()) {
        const question = questions.find(q => q.id === id);
        if (question) {
          guidedContent += `\n${question.category}:\n${response.trim()}\n`;
        }
      }
    });
    
    if (guidedContent) {
      const prefix = noteType === 'assessment' 
        ? 'Please generate a clinical assessment based on the following information:'
        : 'Please generate clinical notes based on the following structured information:';
      finalPrompt = `${prefix}\n${guidedContent}\n${finalPrompt}`;
    }
  }

  // Add custom instructions if provided
  if (customInstructions?.trim()) {
    finalPrompt += `\n\nAdditional Custom Requirements:\n${customInstructions.trim()}`;
  }

  // Add the response format at the end
  finalPrompt += `\n\nFormat the response EXACTLY in the following structure:\n${formatTemplate}`;

  return finalPrompt;
}