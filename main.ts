import {GoogleGenAI, createUserContent, createPartFromUri} from "@google/genai";
import readline from "readline";
import * as dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

const rl = readline.createInterface({
    input:process.stdin,
    output: process.stdout
});

function getUserInput(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer: string) => {
            resolve(answer);
        })
    })
}

function showLoadingAnimation(){
    const frames = ["|", "/", "--", "\\", "|"];
    let i = 0;
    const loadingInterval = setInterval(() => {
        process.stdout.write(`\r${frames[i]} Generating response...`);
        i = (i + 1) % frames.length;
    }, 80);

    return loadingInterval;
}

async function main(){
    // const image = await ai.files.upload({
    //     file: "",
    // })
    console.log("\n🤖 What do you want to ask Dario?: Type `exit` to end the conversation.\n");
    
    const conversationHistory = [];

    const systemPrompt = "You are an agent that works for Dario Labrador, a computer science student. You have great knowledge about recruitment, job searching, and software engineering. Therefore, you'll help Dario by helping employers who may need assistance when navigating Dario's portfolio website."

    let conversationActive=true;

    while(conversationActive){

        const userQuestion = await getUserInput("\n: ");

        if(userQuestion.toLowerCase() === "exit"){
            console.log("\n 🤖 Thank you for chatting. Goodbye!");
            conversationActive = false;
            break;
        }

        const userMessage = {
            role: "user",
            parts: [{text: userQuestion}],
        };

        conversationHistory.push(userMessage);

        const loadingAnimation = showLoadingAnimation();

        try{
            const response = await ai.models.generateContentStream({
                model: "gemini-2.0-flash",
                contents: conversationHistory,
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.5,
                },
            });

            clearInterval(loadingAnimation);
            process.stdout.write('\r\x1b[K'); 
            console.log("\n 🤖: \n");

            let fullResponse = "";

            for await(const part of response) {
                process.stdout.write(part.text);
                fullResponse += part.text;
            }

            const aiMessage = {
                role: "model",
                parts: [{text: fullResponse}],
            };
            conversationHistory.push(aiMessage);

            console.log("\n");
        } catch (error) {
            clearInterval(loadingAnimation);
            console.error("Error:", error);
        }
    }
    rl.close();
}
await main();