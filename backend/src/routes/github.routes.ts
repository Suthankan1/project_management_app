import { Router } from 'express';

import { getRepositories } from '../controllers/github.controller';
import { authenticate } from '../middleware/auth.middleware';

const githubRouter = Router();

githubRouter.get('/repositories', authenticate, getRepositories);

export default githubRouter;
