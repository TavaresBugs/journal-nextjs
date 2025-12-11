import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/lib/errors';
import { useCallback } from 'react';

export function useError() {
  const { showToast } = useToast();

  const handleError = useCallback((error: unknown) => {
    const message = getErrorMessage(error);

    // Log error for debugging purposes
    console.error('[ErrorHandler]', error);

    showToast(message, 'error');
  }, [showToast]);

  return { handleError };
}
