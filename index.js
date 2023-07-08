import openai from "./config/open-ai.js";
import readlineSync from 'readline-sync';
import colors from 'colors';
import fs, { readdir } from 'fs/promises';

async function main() {
    

    welcomeMessage();

    //check if a chatHistory folder exists, if not then create it
    const chatHistoryFolderPath = './chatHistory';
    await createChatHistoryFolder(chatHistoryFolderPath);

    let chatHistoryFilePath = null;

    chatHistoryFilePath = await handleSelectPreviousHistory(chatHistoryFolderPath);

       
    const chatHistory = await constructChatHistory(chatHistoryFilePath);


    // Construct messages by iterating over the history
    const messages = generateMessages(chatHistory);
    while (true) {
        console.log('');
        const input = getUserInput();
        console.log('');

        try {
            if (shouldExit(input)) {
                console.log(colors.yellow('🤖: Goodbye.'));
                await writeChatHistoryToFile(chatHistoryFilePath, chatHistory);
                return;
            }

            console.log("CHAT HISTORY")
            console.log('-----------------');
            console.log(chatHistory)

            console.log("MESSAGES")
            console.log('-----------------');
            console.log(messages)


            const assistantResponse = await getAssistantResponse(input, messages);

            console.log('');
            console.log('🤖: ' + assistantResponse);
            console.log('');

            updateChatHistory(chatHistory, input, assistantResponse, messages);

            // Write updated chat history to file
            await writeChatHistoryToFile(chatHistoryFilePath, chatHistory);
        } catch (err) {
            console.log(colors.red(err));
        }
    }
}



const getUserInput = () => {
    return readlineSync.question("Query: ");
}

const shouldExit = (input) => {
    return input.toLowerCase() === 'exit' || input.toLowerCase() === 'stop' || input.toLowerCase() === 'end';

}


const getAssistantResponse = async(input, messages) => {
    // Add user input
    messages.push({ role: 'user', content: input });

    const assistant = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages
    });

    return assistant.data.choices[0].message.content;
}

function updateChatHistory(chatHistory, userInput, assistantResponse, messages) {
    messages.push({ role: 'user', content: userInput });
    messages.push({ role: 'assistant', content: assistantResponse });
    chatHistory.push({ role: 'user', content: userInput });
    chatHistory.push({ role: 'assistant', content: assistantResponse });
}




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
        console.log('err here')
    }
}

const constructChatHistory = async(chatHistoryFilePath) => {

    let chatHistory = [];

    if (chatHistoryFilePath) {
        const fileContent = await fs.readFile(chatHistoryFilePath, 'utf8');
        chatHistory = JSON.parse(fileContent);
    }

    console.log(chatHistory)

    return chatHistory;


}


const generateMessages = (chatHistory) => {
    const messages = [
        { role: "system", content: "You are a helpful assistant." },
        ...chatHistory.map(({ role, content }) => ({ role, content }))
    ];
    return messages;
}


async function listChatHistoryFiles(chatHistoryFolderPath) {

    try {
 
        const files = await readdir(chatHistoryFolderPath);
        if(files.length === 0){
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
        return `${chatHistoryFolderPath}/${files[selectedFileIndex]}`;
    } catch (error) {
        console.error('Error reading chat history:', error);
    }
}

async function writeChatHistoryToFile(filePath, chatHistory) {
    console.log('file path: ' + filePath)
    if (filePath) {
        try{
            await fs.writeFile(filePath, JSON.stringify(chatHistory), 'utf8');

        }catch(err){
            console.log(err);
        }
    }
}

main();

