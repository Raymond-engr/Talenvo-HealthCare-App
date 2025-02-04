import express from 'express';
import { validateSearchRequest, validateFilterRequest } from '../../validators/search.validator';
import { healthcareController } from '../controllers/HealthcareSearch.controller';

const router = express.Router();

router.route('/').get(validateSearchRequest, healthcareController.search);
router.route('/filter').get(validateFilterRequest, healthcareController.getProvidersByFilters);
// Will implement this accuracy route better later
router.route('/accuracy').get(healthcareController.validateProvider);

export default router;
