import Joi from 'joi';
import validateRequest from '../middleware/validateRequest';

export const searchValidationSchema = Joi.object({
  LocationSearch: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
  }).xor('latitude', 'longitude'),

  AddressSearch: Joi.string().min(1).max(200),
  NameSearch: Joi.string().min(1).max(200),
})
  .or('LocationSearch', 'AddressSearch', 'NameSearch')
  .nand('LocationSearch', 'AddressSearch', 'NameSearch')
  .messages({
    'object.missing': 'You must provide either LocationSearch, AddressSearch, or NameSearch.',
    'object.nand': 'Only one of LocationSearch, AddressSearch, or NameSearch is allowed at a time.',
  });

export const validateSearchRequest = validateRequest(searchValidationSchema, 'body');
