const AI_SERVICE_URL = process.env.AI_SERVICE_URL 
    ?? "http://127.0.0.1:8000";

async function generateAIResponse(message) {
    const response = await fetch(`${AI_SERVICE_URL}/generate`, 
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({message}),
            signal: AbortSignal.timeout(60000)
        }
    );

    if(!response.ok) {
        throw new Error(
            `AI service returned ${response.status}`
        );
    }
    return await response.json();
}

module.exports = { generateAIResponse };