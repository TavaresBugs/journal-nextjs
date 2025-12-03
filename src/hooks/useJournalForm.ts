import { useState, useCallback } from 'react';
import dayjs from 'dayjs';

export interface JournalFormData {
  date: string;
  title: string;
  asset: string;
  emotion: string;
  analysis: string;
  technicalWins: string;
  improvements: string;
  errors: string;
}

export interface EntrySubmissionData {
  date: string;
  title: string;
  asset: string;
  emotion: string;
  analysis: string;
  notes: string; // JSON stringified review sections
}

export interface UseJournalFormReturn {
  formData: JournalFormData;
  updateField: (field: keyof JournalFormData, value: string) => void;
  resetForm: (defaults?: Partial<JournalFormData>) => void;
  prepareSubmission: () => EntrySubmissionData;
}

/**
 * Custom hook for managing journal entry form state.
 * 
 * @param initialData - Initial form data (optional)
 * @returns Form state and utilities
 */
export function useJournalForm(
  initialData?: Partial<JournalFormData>
): UseJournalFormReturn {
  const defaultFormData: JournalFormData = {
    date: dayjs().format('YYYY-MM-DD'),
    title: `Diário - ${dayjs().format('DD/MM/YYYY')}`,
    asset: '',
    emotion: '',
    analysis: '',
    technicalWins: '',
    improvements: '',
    errors: '',
    ...initialData
  };

  const [formData, setFormData] = useState<JournalFormData>(defaultFormData);

  const updateField = useCallback((field: keyof JournalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback((defaults?: Partial<JournalFormData>) => {
    setFormData({
      date: dayjs().format('YYYY-MM-DD'),
      title: `Diário - ${dayjs().format('DD/MM/YYYY')}`,
      asset: '',
      emotion: '',
      analysis: '',
      technicalWins: '',
      improvements: '',
      errors: '',
      ...defaults
    });
  }, []);

  const prepareSubmission = useCallback((): EntrySubmissionData => {
    return {
      date: formData.date,
      title: formData.title,
      asset: formData.asset || 'Diário',
      emotion: formData.emotion,
      analysis: formData.analysis,
      notes: JSON.stringify({
        technicalWins: formData.technicalWins,
        improvements: formData.improvements,
        errors: formData.errors
      })
    };
  }, [formData]);

  return {
    formData,
    updateField,
    resetForm,
    prepareSubmission
  };
}
