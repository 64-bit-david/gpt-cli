const openai = require("./config/open-ai.js");
const readlineSync = require('readline-sync');
const fs = require('fs/promises');
const { readdir } = require('fs/promises');
const colors = require('colors');



//Function to get user input
const getUserInput = () => {
    return readlineSync.question("Query: ");
}

//Function to check if user want's to exit
const shouldExit = (input) => {
    return input.toLowerCase() === 'exit' || input.toLowerCase() === 'stop' || input.toLowerCase() === 'end';

}


//Function to gte assistant response from openai
const getAssistantResponse = async(input, messages) => {
    // Add user input
    messages.push({ role: 'user', content: input });

    const assistant = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages
    });

    return assistant.data.choices[0].message.content;
}

// Function to update chatHistory
function updateChatHistory(chatHistory, userInput, assistantResponse, messages) {
    messages.push({ role: 'user', content: userInput });
    messages.push({ role: 'assistant', content: assistantResponse });
    chatHistory.push({ role: 'user', content: userInput });
    chatHistory.push({ role: 'assistant', content: assistantResponse });
}



//Display a welcome message
const welcomeMessage = () => {
    const asciiArt = `     /$$$$$$  /$$$$$$$  /$$$$$$$$        /$$$$$$  /$$       /$$$$$$
    /$$__  $$| $$__  $$|__  $$__/       /$$__  $$| $$      |_  $$_/
   | $$  \\__/| $$  \\ $$   | $$         | $$  \\__/| $$        | $$  
   | $$ /$$$$| $$$$$$$/   | $$         | $$      | $$        | $$  
   | $$|_  $$| $$____/    | $$         | $$      | $$        | $$  
   | $$  \\ $$| $$         | $$         | $$    $$| $$        | $$  
   |  $$$$$$/| $$         | $$         |  $$$$$$/| $$$$$$$$ /$$$$$$
    \\______/ |__/         |__/          \\______/ |________/|______/`;

    console.log(colors.bold.green(asciiArt));
    console.log(colors.bold.blue('#####################################################################'));
    console.log('');
    console.log('🤖: ' + "Welcome to the GPT-CLI, an application to interact with chat-gpt.");
    console.log('🤖: ' + "Enter 'stop' to exit.");
}


//Create a folder in the local directory for holdiing previous chat history files
const createChatHistoryFolder = async (chatHistoryFolderPath) => {
    try {
        const folderExists = await fs.access(chatHistoryFolderPath).then(() => true).catch(() => false);

        if (!folderExists) {
            await fs.mkdir(chatHistoryFolderPath);
            console.log("Created chat history folder");
        }
    } catch (err) {
        console.log(err);
    }
}


// Allow user to select a previous chat history or create a new one
async function handleSelectPreviousHistory(chatHistoryFolderPath) {
    let chatHistoryFilePath = null;

    while (true) {
        console.log('');
        const input = readlineSync.question("Select previous chat history? (Y/N): ");

        if (input.toLowerCase() === 'y' || input.toLowerCase() === 'yes') {
            chatHistoryFilePath = await listChatHistoryFiles(chatHistoryFolderPath);
            console.log(chatHistoryFilePath);
            break;
        } else if (input.toLowerCase() === 'n' || input.toLowerCase() === 'no') {
            chatHistoryFilePath = await createNewChatHistoryFile(chatHistoryFolderPath, chatHistoryFilePath);
            break;
        }
    }

    return chatHistoryFilePath;
}


//Creates new chat history file
async function createNewChatHistoryFile(chatHistoryFolderPath, chatHistoryFilePath) {
    try {
        // Create a new chat history file
        const files = await readdir(chatHistoryFolderPath);
        const newFileName = `chatHistory${files.length + 1}.json`;
        chatHistoryFilePath = `${chatHistoryFolderPath}/${newFileName}`;
        await fs.writeFile(chatHistoryFilePath, '[]', 'utf8');
        console.log(`Created new chat history file: ${newFileName}`);
        return chatHistoryFilePath;
    } catch (err) {
        console.log(err);
    }
}

//construct the chathistory file
const constructChatHistory = async(chatHistoryFilePath) => {

    let chatHistory = [];

    if (chatHistoryFilePath) {
        const fileContent = await fs.readFile(chatHistoryFilePath, 'utf8');
        chatHistory = JSON.parse(fileContent);
    }


    return chatHistory;


}

//build up the messages from the chathistory file
const generateMessages = (chatHistory) => {
    const messages = [
        { role: "system", content: "You are a helpful assistant." },
        ...chatHistory.map(({ role, content }) => ({ role, content }))
    ];
    return messages;
}


//list files in the chathistory folder
async function listChatHistoryFiles(chatHistoryFolderPath) {
    try {
        while (true) {
            const files = await readdir(chatHistoryFolderPath);
            if (files.length === 0) {
                console.log('No chat history files exist.');
                const chatHistoryFilePath = createNewChatHistoryFile(chatHistoryFolderPath);
                return chatHistoryFilePath;
            }

            // List the chat history files to the user
            console.log('Available chat history files:');
            files.forEach((file, index) => {
                console.log(`${index + 1}. ${file}`);
            });

            // Prompt the user to select a chat history file
            const selectedFileIndex = readlineSync.questionInt('Select a chat history file (enter the corresponding number): ') - 1;

            if (selectedFileIndex < 0 || selectedFileIndex >= files.length) {
                console.log("Error: That file does not exist, please try again.");
                continue;
            }

            return `${chatHistoryFolderPath}/${files[selectedFileIndex]}`;
        }
    } catch (error) {
        console.error('Error reading chat history:', error);
    }
}

//update the chat history file
async function writeChatHistoryToFile(filePath, chatHistory) {
    if (filePath) {
        try{
            await fs.writeFile(filePath, JSON.stringify(chatHistory), 'utf8');

        }catch(err){
            console.log(err);
        }
    }
}



module.exports = {
    getUserInput,
    shouldExit,
    getAssistantResponse,
    updateChatHistory,
    welcomeMessage,
    createChatHistoryFolder,
    handleSelectPreviousHistory,
    createNewChatHistoryFile,
    constructChatHistory,
    generateMessages,
    listChatHistoryFiles,
    writeChatHistoryToFile
};