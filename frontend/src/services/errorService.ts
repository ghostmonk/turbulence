/**
 * Centralized error handling service for the frontend
 */

import { ApiRequestError, ErrorCode, StandardErrorResponse, ErrorSeverity, ERROR_SEVERITY_MAP, RequestDetails } from '@/types/error';
import { appLogger } from '@/utils/logger';

export class ErrorService {
  static async parseApiError(response: Response, requestDetails?: RequestDetails): Promise<ApiRequestError> {
    let data: any;
    let message = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
        
        if (data && typeof data === 'object') {
          if ('error_code' in data && 'user_message' in data) {
            message = data.user_message;
          } else if ('detail' in data) {
            if (typeof data.detail === 'string') {
              message = data.detail;
            } else if (typeof data.detail === 'object' && 'user_message' in data.detail) {
              message = data.detail.user_message;
              data = data.detail;
            }
          }
        }
      }
    } catch (parseError) {
      appLogger.warn('Failed to parse error response as JSON', parseError as Error);
      data = { detail: message };
    }

    return new ApiRequestError(message, response.status, data, requestDetails);
  }

  static getUserMessage(error: any): string {
    if (error instanceof ApiRequestError) {
      return error.getUserMessage();
    }
    
    if (error && typeof error === 'object') {
      if ('user_message' in error) {
        return error.user_message;
      }
      if ('message' in error) {
        return error.message;
      }
      if ('detail' in error) {
        return error.detail;
      }
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'An unexpected error occurred';
  }

  static getErrorSeverity(error: any): ErrorSeverity {
    if (error instanceof ApiRequestError && error.errorResponse?.error_code) {
      return ERROR_SEVERITY_MAP[error.errorResponse.error_code] || ErrorSeverity.ERROR;
    }
    
    if (error instanceof ApiRequestError) {
      if (error.status >= 500) return ErrorSeverity.CRITICAL;
      if (error.status >= 400) return ErrorSeverity.ERROR;
      if (error.status >= 300) return ErrorSeverity.WARNING;
    }
    
    return ErrorSeverity.ERROR;
  }

  static isErrorCode(error: any, code: ErrorCode): boolean {
    if (error instanceof ApiRequestError) {
      return error.isErrorCode(code);
    }
    
    if (error && typeof error === 'object' && 'error_code' in error) {
      return error.error_code === code;
    }
    
    return false;
  }

  static getErrorSuggestions(error: any): string[] {
    if (error instanceof ApiRequestError && error.errorResponse?.details?.suggestions) {
      return error.errorResponse.details.suggestions;
    }
    
    if (error instanceof ApiRequestError) {
      if (error.status === 401) {
        return ['Please log in again', 'Check if your session has expired'];
      }
      if (error.status === 403) {
        return ['Check your permissions', 'Contact an administrator if needed'];
      }
      if (error.status >= 500) {
        return ['Try again in a few moments', 'Contact support if the problem persists'];
      }
      if (error.status === 0) {
        return ['Check your internet connection', 'Try refreshing the page'];
      }
    }
    
    return [];
  }

  static logError(error: any, context?: string, additionalData?: any) {
    const severity = this.getErrorSeverity(error);
    const message = this.getUserMessage(error);
    const logData = {
      context,
      severity,
      ...additionalData
    };

    switch (severity) {
      case ErrorSeverity.CRITICAL:
        appLogger.error(`Critical error${context ? ` in ${context}` : ''}: ${message}`, error, logData);
        break;
      case ErrorSeverity.ERROR:
        appLogger.error(`Error${context ? ` in ${context}` : ''}: ${message}`, error, logData);
        break;
      case ErrorSeverity.WARNING:
        appLogger.warn(`Warning${context ? ` in ${context}` : ''}: ${message}`, logData);
        break;
      case ErrorSeverity.INFO:
        appLogger.info(`Info${context ? ` in ${context}` : ''}: ${message}`, logData);
        break;
    }
  }

  static handleAuthError(error: any): string {
    if (this.isErrorCode(error, ErrorCode.AUTHENTICATION_EXPIRED)) {
      return 'Your session has expired. Please log in again.';
    }
    
    if (this.isErrorCode(error, ErrorCode.AUTHENTICATION_REQUIRED)) {
      return 'You need to be logged in to perform this action.';
    }
    
    if (this.isErrorCode(error, ErrorCode.AUTHENTICATION_INVALID)) {
      return 'Your authentication is invalid. Please log in again.';
    }
    
    if (error instanceof ApiRequestError) {
      if (error.status === 401) {
        return 'Your session has expired. Please log in again.';
      }
      if (error.status === 403) {
        return 'You do not have permission to perform this action.';
      }
    }
    
    return this.getUserMessage(error);
  }

  static handleUploadError(error: any, fileName?: string): string {
    const fileContext = fileName ? ` for "${fileName}"` : '';
    
    if (this.isErrorCode(error, ErrorCode.UPLOAD_FILE_TOO_LARGE)) {
      return this.getUserMessage(error);
    }
    
    if (this.isErrorCode(error, ErrorCode.UPLOAD_INVALID_FORMAT)) {
      return this.getUserMessage(error);
    }
    
    if (this.isErrorCode(error, ErrorCode.UPLOAD_PROCESSING_FAILED)) {
      return this.getUserMessage(error);
    }
    
    if (error instanceof ApiRequestError) {
      if (error.status === 413) {
        return `File${fileContext} is too large. Please choose a smaller file.`;
      }
      if (error.status === 415) {
        return `File format not supported${fileContext}. Please choose a different file type.`;
      }
    }
    
    return `Failed to upload file${fileContext}. ${this.getUserMessage(error)}`;
  }

  static createDisplayError(error: any): StandardErrorResponse | string {
    if (error instanceof ApiRequestError && error.errorResponse) {
      return error.errorResponse;
    }
    
    return this.getUserMessage(error);
  }
}
