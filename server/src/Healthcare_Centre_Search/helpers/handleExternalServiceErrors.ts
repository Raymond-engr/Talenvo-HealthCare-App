import axios from 'axios';
import logger from '../../utils/logger';
import { ExternalServiceAPIError } from '../../utils/customErrors';

export function handleExternalServiceError(serviceName: string, error: any): never {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Handle specific HTTP error responses
      logger.error(`${serviceName} API HTTP Error`, {
        status: error.response.status,
        data: error.response.data
      });

      throw new ExternalServiceAPIError(
        `${serviceName} API Error ${error.response.status}`,
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      // Handle request errors (no response received)
      logger.error(`${serviceName} API Request Error`, {
        request: error.request
      });

      throw new ExternalServiceAPIError(
        `${serviceName} API Request Error`,
        0,
        error.request
      );
    } else {
      // Handle other axios errors
      logger.error(`${serviceName} API Error`, {
        message: error.message
      });

      throw new ExternalServiceAPIError(
        `Error in ${serviceName} API call`,
        500,
        error.message
      );
    }
  }

  // Handle non-axios errors
  logger.error(`Unexpected error in ${serviceName} API`, {
    error: error
  });

  throw new ExternalServiceAPIError(
    `Unexpected error in ${serviceName} API call`,
    500,
    error
  );
}

export function validateApiKey(apiKey?: string, serviceName?: string): void {
  if (!apiKey) {
    logger.error(`Missing API key for ${serviceName}`, {
      service: serviceName
    });
    throw new ExternalServiceAPIError(
      `API key is not set for ${serviceName}`,
      500,
      { missingApiKey: true }
    );
  }
}