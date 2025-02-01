import express from 'express';
import { validateSearchRequest } from '../../validators/search.validator';

const router = express.Router();

router.post('/', validateSearchRequest, (req, res) => {
  res.json({ message: 'Validation passed!', data: req.body });
});

export default router;
