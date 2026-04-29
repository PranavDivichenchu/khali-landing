require('dotenv').config();
const OpenAI = require('openai');

const apiKey = process.env.OPENAI_API_KEY;

console.log("--- OpenAI Connectivity Test ---");
console.log(`Key loaded: ${apiKey ? 'Yes' : 'No'}`);
if (apiKey) {
    console.log(`Key pattern: ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`);
}

const openai = new OpenAI({ apiKey: apiKey });

async function testOpenAI() {
    try {
        console.log("\nSending prompt to OpenAI (gpt-4o-mini)...");
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Respond with 'Connectivity Confirmed'." }],
            model: "gpt-4o-mini",
        });

        console.log("✅ Success!");
        console.log("Response:", completion.choices[0].message.content);
    } catch (error) {
        console.error("❌ OpenAI Request Failed");
        console.error("Error Message:", error.message);
        console.error("Error Code:", error.code);
        console.error("Error Type:", error.type);
        if (error.response) {
            console.error("Response Data:", error.response.data);
        }
    }
}

testOpenAI();
