import Joi from 'joi';
import validateRequest from '../middleware/validateRequest';
import validateFilter from '../middleware/validateFilter';

export const searchValidationSchema = Joi.object({
  LocationSearch: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
  }).and('latitude', 'longitude'),

  AddressSearch: Joi.object({
    address: Joi.string().min(1).max(200).required(),
  }),

  NameSearch: Joi.object({
    name: Joi.string().min(1).max(200).required(),
  }),
})
  .xor('LocationSearch', 'AddressSearch', 'NameSearch') // Only one allowed at a time
  .messages({
    'object.missing': 'You must provide either LocationSearch, AddressSearch, or NameSearch.',
    'object.xor': 'Only one of LocationSearch, AddressSearch, or NameSearch is allowed at a time.',
  });

export const validateSearchRequest = validateRequest(searchValidationSchema, 'body');

export const filterValidationSchema = Joi.object({
  keyword: Joi.string().min(1).max(200),
  
  userLocation: Joi.array().length(2).items(
    Joi.number().required(),
    Joi.number().required()
  ),
  
  maxDistance: Joi.number().min(1).max(10)
    .when('userLocation', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
}).custom((value, helpers) => {
  if (!value.keyword && !value.userLocation) {
    return helpers.error('object.min', { 
      message: 'At least one search filter (keyword or location) must be provided' 
    });
  }
  return value;
});


export const validateFilterRequest = validateFilter(filterValidationSchema, 'query');