// Sends the user's message to Llama 3.1 8B Instruct on Amazon Bedrock.
// On EC2 the credentials come from the instance's IAM role, so no keys are needed.
const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');

const REGION = process.env.AWS_REGION || 'us-east-2';
// Swap this one setting later to point at the fine-tuned model.
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.meta.llama3-1-8b-instruct-v1:0';
const MAX_TOKENS = Number(process.env.BEDROCK_MAX_TOKENS) || 400;

// Same system prompt used for training and for the blind tests.
const SYSTEM_PROMPT =
  'You are Baymax, a friendly health information assistant. ' +
  'Give general, plain-language information only. You are not a doctor ' +
  'and cannot diagnose. For emergencies or serious symptoms, tell the ' +
  'user to contact a doctor or emergency services.';

const client = new BedrockRuntimeClient({ region: REGION, maxAttempts: 2 });

async function generateAIResponse(message) {
  const res = await client.send(
    new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: SYSTEM_PROMPT }],
      messages: [{ role: 'user', content: [{ text: message }] }],
      inferenceConfig: { maxTokens: MAX_TOKENS, temperature: 0 },
    })
  );

  const text = res.output?.message?.content?.[0]?.text;
  if (!text) throw new Error('Bedrock returned no text');

  // Same shape the front end already expects.
  return { message: text.trim(), model: MODEL_ID, status: 'completed' };
}

module.exports = { generateAIResponse };