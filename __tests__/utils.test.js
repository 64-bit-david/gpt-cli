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
  } = require('../utils');

  const openai = require('../config/open-ai.js');
  const fs = require('fs/promises');




  // Mock readline-sync
jest.mock('readline-sync');
const readlineSync = require('readline-sync');
readlineSync.question.mockReturnValue('mocked input');



describe('getUserInput', () => {
    it('should return user input', () => {
        
        const input = getUserInput();
        //Assertr
        expect(input).toEqual('mocked input');
        expect(readlineSync.question).toHaveBeenCalledWith('Query: ');
    });
});
  
  
describe('shouldExit', () => {
    it('should return true for exit-related inputs', () => {
        //Assert
        expect(shouldExit('exit')).toBeTruthy();
        expect(shouldExit('stop')).toBeTruthy();
        expect(shouldExit('end')).toBeTruthy();
        expect(shouldExit('EXIT')).toBeTruthy();
        expect(shouldExit('Stop')).toBeTruthy();
        expect(shouldExit('END')).toBeTruthy();
    });

    it('should return false for non-exit inputs', () => {
        //Assert
        expect(shouldExit('continue')).toBeFalsy();
        expect(shouldExit('go')).toBeFalsy();
        expect(shouldExit('')).toBeFalsy();
    });
});


describe('getAssistantResponse', () => {
    //Arrange
    const mockAssistantResponse = 'mocked assistant response';
    openai.createChatCompletion = jest.fn().mockResolvedValue({
        data: {
            choices: [{ message: { content: mockAssistantResponse } }]
        }
    });

    it('should return assistant response', async () => {
        const input = 'test input';
        const messages = [{ role: 'system', content: 'mocked system message' }];
        
        //Act
        const response = await getAssistantResponse(input, messages);
        
        //Assert
        expect(response).toEqual(mockAssistantResponse);
        expect(openai.createChatCompletion).toHaveBeenCalledWith({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'mocked system message' },
                { role: 'user', content: input }
            ]
        });
    });
});




describe('updateChatHistory', () => {
    it('should update chat history and messages', () => {

        //Arrange
        const chatHistory = [];
        const messages = [];

        //Act
        updateChatHistory(chatHistory, 'user input', 'assistant response', messages);

        //Assert
        expect(messages).toEqual([
            { role: 'user', content: 'user input' },
            { role: 'assistant', content: 'assistant response' }
        ]);

        expect(chatHistory).toEqual([
            { role: 'user', content: 'user input' },
            { role: 'assistant', content: 'assistant response' }
        ]);
    });
});


describe('createChatHistory', () => {
    it('should create a folder called chatHistory', async() => {
        //Arrange
        fs.access = jest.fn().mockRejectedValueOnce(); // Simulate folder not existing
        fs.mkdir = jest.fn();
        const chatHistoryFolderPath  = './chatHistory';

        //Act
        await createChatHistoryFolder(chatHistoryFolderPath);

        //Assert
        expect(fs.access).toHaveBeenCalledWith(chatHistoryFolderPath);
        expect(fs.mkdir).toHaveBeenCalledWith(chatHistoryFolderPath);
    })

    it('should not create chat history folder if it already exists', async () => {
        //Arrange

        fs.access = jest.fn().mockResolvedValueOnce(); // Simulate folder already existing
        fs.mkdir = jest.fn();

        const chatHistoryFolderPath = './chatHistory';

        //Act
        await createChatHistoryFolder(chatHistoryFolderPath);

        //Assert
        expect(fs.access).toHaveBeenCalledWith(chatHistoryFolderPath);
        expect(fs.mkdir).not.toHaveBeenCalled();
    });
});



