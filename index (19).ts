import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4001;
const app = createApp();

app.listen(port, () => {
  console.log(`[restaurant-service] listening on port ${port}`);
});
