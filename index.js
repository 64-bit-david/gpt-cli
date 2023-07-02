import openai from "./config/open-ai.js";
import readlineSync from 'readline-sync';
import colors from 'colors';
import fs, { readdir } from 'fs/promises';

async function main() {
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



    //check if a chatHistory folder exists, if not then create it
    const chatHistoryPath = './chatHistory';
    const folderExists = await fs.access(chatHistoryPath).then(() => true).catch(() => false);

    if (!folderExists) {
        await fs.mkdir(chatHistoryPath);
        console.log("Created chat history folder");
    }

    let chatHistoryFilePath = null;

    while (true) {
        console.log('');
        const input = readlineSync.question("Select previous chat history? (Y/N)" );
    
        if (input.toLowerCase() === 'y' || input.toLowerCase() === 'yes') {
            chatHistoryFilePath = await listChatHistoryFiles(chatHistoryPath);
            console.log(chatHistoryFilePath);
            break;
        } else if (input.toLowerCase() === 'n' || input.toLowerCase() === 'no') {
            createNewChatHistoryFile(chatHistoryPath);
            break;
        }
    }
    
   

    let chatHistory = [];

    if (chatHistoryFilePath) {
        const fileContent = await fs.readFile(chatHistoryFilePath, 'utf8');
        chatHistory = JSON.parse(fileContent);
    }


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

            // Write updated chat history to file
            await writeChatHistoryToFile(chatHistoryFilePath, chatHistory);
        } catch (err) {
            console.log(colors.red(err));
        }
    }
}

async function createNewChatHistoryFile(chatHistoryPath) {
    try {
        // Create a new chat history file
        const files = await readdir(chatHistoryPath);
        const newFileName = `chatHistory${files.length + 1}.json`;
        const chatHistoryFilePath = `${chatHistoryPath}/${newFileName}`;
        await fs.writeFile(chatHistoryFilePath, '[]', 'utf8');
        console.log(`Created new chat history file: ${newFileName}`);
        return chatHistoryFilePath;
    } catch (err) {
        console.log(err);
    }
}


async function listChatHistoryFiles(chatHistoryPath) {

    try {
 
        const files = await readdir(chatHistoryPath);
        if(files.length === 0){
            console.log('No chat history files exist.');
            const chatHistoryFilePath = createNewChatHistoryFile(chatHistoryPath);
            return chatHistoryFilePath;
        }

        // List the chat history files to the user
        console.log('Available chat history files:');
        files.forEach((file, index) => {
            console.log(`${index + 1}. ${file}`);
        });

        // Prompt the user to select a chat history file
        const selectedFileIndex = readlineSync.questionInt('Select a chat history file (enter the corresponding number): ') - 1;
        return `${chatHistoryPath}/${files[selectedFileIndex]}`;
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

