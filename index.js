import openai  from "./config/open-ai.js";
import readlineSync from 'readline-sync';
import colors from 'colors';


async function main(){

    // console.log('🤖');
    const asciiArt = `     /$$$$$$  /$$$$$$$  /$$$$$$$$        /$$$$$$  /$$       /$$$$$$
    /$$__  $$| $$__  $$|__  $$__/       /$$__  $$| $$      |_  $$_/
   | $$  \\__/| $$  \\ $$   | $$         | $$  \\__/| $$        | $$  
   | $$ /$$$$| $$$$$$$/   | $$         | $$      | $$        | $$  
   | $$|_  $$| $$____/    | $$         | $$      | $$        | $$  
   | $$  \\ $$| $$         | $$         | $$    $$| $$        | $$  
   |  $$$$$$/| $$         | $$         |  $$$$$$/| $$$$$$$$ /$$$$$$
    \\______/ |__/         |__/          \\______/ |________/|______/`;
   
   


    console.log(colors.bold.green(asciiArt));
    console.log(colors.bold.blue('#####################################################################'))

    const chatHistory = [];


    while(true){
        console.log('');
        const input = readlineSync.question("Query: ");
        console.log('');
        
        

        try{

            //Construct msgs by iterating over the history
            const messages = chatHistory.map(([role, content]) => ({role, content}));
            
            
            //add user input
            messages.push({role: 'user', content: input});
            
            const assistant = await openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages
            });

            
            if(input.toLowerCase() === 'exit' || input.toLowerCase() === 'stop' || input.toLowerCase() === 'end'){
                console.log(colors.yellow('🤖: Goodbye.'));
                return;
            }

            const assistantResponse = assistant.data.choices[0].message.content;

            console.log('');           
            console.log('🤖: ' + assistantResponse);
            console.log('');
            
            chatHistory.push(['user', input])
            chatHistory.push(['assistant', assistantResponse])




        }catch(err){
            console.log(colors.red(err));
        }
    }
}

main();

