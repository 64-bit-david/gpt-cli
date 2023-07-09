const { Configuration, OpenAIApi } = require("openai");
const dotenv = require('dotenv');




dotenv.config();

const config = new Configuration({
    apiKey: process.env.GPT_API_KEY
});

const openai = new OpenAIApi(config);


module.exports = openai;