export class ServiceError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, unknown>,
    public cause?: Error
  ) {
    if (!Object.values(ERROR_CODES).includes(code)) {
      throw new Error(`Code d'erreur invalide : ${code}`);
    }
    super(message);
    this.name = "ServiceError";
    this.cause = cause;
    Object.setPrototypeOf(this, ServiceError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details ?? null,
      cause: process.env.NODE_ENV === "development" && this.cause ? { message: this.cause.message } : null,
    };
  }

  static isServiceError(error: unknown): error is ServiceError {
    return error instanceof ServiceError;
  }

  static fromError(
    error: unknown,
    code: ErrorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
    message?: string,
    details?: Record<string, unknown>
  ): ServiceError {
    if (error instanceof ServiceError) {
      return error;
    }
    return new ServiceError(
      code,
      message ?? (error instanceof Error ? error.message : "Erreur inconnue"),
      details,
      error instanceof Error ? error : undefined
    );
  }

  static getHttpStatus(code: ErrorCode): number {
    const statusMap: Record<ErrorCode, number> = {
      [ERROR_CODES.VALIDATION_ERROR]: 400,
      [ERROR_CODES.INVALID_INPUT]: 400,
      [ERROR_CODES.MISSING_REQUIRED_FIELD]: 400,
      [ERROR_CODES.AUTHENTICATION_ERROR]: 401,
      [ERROR_CODES.METHOD_NOT_ALLOWED]: 405,
      [ERROR_CODES.NOT_FOUND]: 404,
      [ERROR_CODES.DATABASE_ERROR]: 500,
      [ERROR_CODES.FOREIGN_KEY_CONSTRAINT]: 400,
      [ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION]: 409,
      [ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
      [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
      [ERROR_CODES.TIMEOUT_ERROR]: 504,
    };
    return statusMap[code] || 500;
  }
}

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  NOT_FOUND: "NOT_FOUND",
  DATABASE_ERROR: "DATABASE_ERROR",
  FOREIGN_KEY_CONSTRAINT: "FOREIGN_KEY_CONSTRAINT",
  UNIQUE_CONSTRAINT_VIOLATION: "UNIQUE_CONSTRAINT_VIOLATION",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];