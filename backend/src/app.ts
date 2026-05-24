// Run: npm install express cors && npm install -D @types/express @types/cors

import express from 'express';
import cors from 'cors';

import githubRouter from './routes/github.routes';

const app = express();

app.use(express.json());
app.use(cors());
app.use('/api/github', githubRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Planora backend running on port ${port}`);
});

export default app;
