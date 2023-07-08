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



    await handleSelectPreviousHistory(chatHistoryFilePath, chatHistoryFolderPath);
    
   
    const chatHistory = await constructChatHistory(chatHistoryFilePath);

    


    // Construct messages by iterating over the history
    const messages = [
        { role: "system", content: "You are a helpful assistant." },
        ...chatHistory.map(({ role, content }) => ({ role, content }))
    ];

    while (true) {
        console.log('');
        const input = readlineSync.question("Query: ");
        console.log('');

        try {
            // Add user input
            messages.push({ role: 'user', content: input });

            const assistant = await openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages
            });

            if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'stop' || input.toLowerCase() === 'end') {
                console.log(colors.yellow('🤖: Goodbye.'));
                // Write chat history back to file before exiting
                await writeChatHistoryToFile(chatHistoryFilePath, chatHistory);
                return;
            }

            const assistantResponse = assistant.data.choices[0].message.content;

            console.log('');
            console.log('🤖: ' + assistantResponse);
            console.log('');

            // Add assistant response to chat history
            messages.push({ role: 'assistant', content: assistantResponse });
            chatHistory.push({ role: 'user', content: input });
            chatHistory.push({ role: 'assistant', content: assistantResponse });

            console.log(chatHistory);

            // Write updated chat history to file
            await writeChatHistoryToFile(chatHistoryFilePath, chatHistory);
        } catch (err) {
            console.log(colors.red(err));
        }
    }
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

const handleSelectPreviousHistory = async (chatHistoryFilePath, chatHistoryFolderPath) => {
    while (true) {
        console.log('');
        const input = readlineSync.question("Select previous chat history? (Y/N): " );
    
        if (input.toLowerCase() === 'y' || input.toLowerCase() === 'yes') {
            chatHistoryFilePath = await listChatHistoryFiles(chatHistoryFolderPath);
            console.log(chatHistoryFilePath);
            break;
        } else if (input.toLowerCase() === 'n' || input.toLowerCase() === 'no') {
            await createNewChatHistoryFile(chatHistoryFolderPath);
            break;
        }
    }
}

async function createNewChatHistoryFile(chatHistoryFolderPath) {
    try {
        // Create a new chat history file
        const files = await readdir(chatHistoryFolderPath);
        const newFileName = `chatHistory${files.length + 1}.json`;
        const chatHistoryFilePath = `${chatHistoryFolderPath}/${newFileName}`;
        await fs.writeFile(chatHistoryFilePath, '[]', 'utf8');
        console.log(`Created new chat history file: ${newFileName}`);
        return chatHistoryFilePath;
    } catch (err) {
        console.log(err);
        console.log('err here')
    }
}

const constructChatHistory = async(chatHistoryFilePath) => {

    const chatHistory = [];

    if (chatHistoryFilePath) {
        const fileContent = await fs.readFile(chatHistoryFilePath, 'utf8');
        chatHistory = JSON.parse(fileContent);
    }

    console.log(chatHistory)

    return chatHistory;


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
    if (filePath) {
        try{
            await fs.writeFile(filePath, JSON.stringify(chatHistory), 'utf8');

        }catch(err){
            console.log(err);
        }
    }
}

main();

