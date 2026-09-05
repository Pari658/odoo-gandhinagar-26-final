// Environment helpers — dotenv.config() is called once in server.js
import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  SUPABASE_CONNECTION_STRING: process.env.SUPABASE_CONNECTION_STRING,
};
