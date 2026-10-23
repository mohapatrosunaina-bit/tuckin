import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4003;
const app = createApp();

app.listen(port, () => {
  console.log(`[delivery-service] listening on port ${port}`);
});
