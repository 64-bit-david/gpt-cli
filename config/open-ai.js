import { Configuration, OpenAIApi } from "openai";
import dotenv from 'dotenv';
dotenv.config();

const config = new Configuration({
    apiKey: process.env.GPT_API_KEY
});

const openai = new OpenAIApi(config);

export default openai;