const colors = require('colors');

const {
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
} = require('./utils');


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

            // console.log("CHAT HISTORY")
            // console.log('-----------------');
            // console.log(chatHistory)

            // console.log("MESSAGES")
            // console.log('-----------------');
            // console.log(messages)


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





main();

