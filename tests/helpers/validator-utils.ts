import { z } from 'zod';

// Definimos un tipo local que represente lo que queremos
type ZodResult = { success: true; data: any } | { success: false; error: z.ZodError };

export const getZodErrorMessages = (result: ZodResult): string => {
  if (result.success) return '';
  return result.error.issues.map((i) => i.message).join(' ');
};