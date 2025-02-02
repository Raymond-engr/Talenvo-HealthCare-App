import type { Request, Response, NextFunction } from 'express';
import type { Schema } from 'joi';
import { BadRequestError } from '../utils/customErrors';
import logger from '../utils/logger';

export interface FilterValidatedRequest {
    keyword?: string;
    maxDistance?: number;
    userLocation?: [number, number];
  }
  
  
const validateFilter = (schema: Schema, source: 'query' | 'body' | 'params' = 'query') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[source]);
      
    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return next(new BadRequestError(error.details[0].message));
    }
      
    (req as Request & { validatedQuery: FilterValidatedRequest }).validatedQuery = value;
    next();
  };
};
  
export default validateFilter;