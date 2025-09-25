export type ServiceResult<T = any> = { success: true; data?: T } | { success: false; error: string };

export const handleServiceError = (error: any): ServiceResult => ({
  success: false,
  error: error?.message || "Unknown error occurred"
});