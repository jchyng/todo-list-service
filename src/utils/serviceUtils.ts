export type ServiceResult<T = unknown> = { success: true; data?: T } | { success: false; error: string };

interface ErrorWithMessage {
  message: string;
}

interface ErrorWithName {
  name: string;
  message?: string;
}

type ErrorLike = ErrorWithMessage | ErrorWithName | string | null | undefined;

function getErrorMessage(error: ErrorLike): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    if ('message' in error && error.message) return error.message;
    if ('name' in error && error.name) return error.name;
  }
  return "Unknown error occurred";
}

export const handleServiceError = <T = unknown>(error: ErrorLike): ServiceResult<T> => ({
  success: false,
  error: getErrorMessage(error)
});