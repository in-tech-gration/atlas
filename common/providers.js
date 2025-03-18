export const providers = [
  {
    title: 'Ollama (local)',
    description: 'Run local/offline inference',
    value: 'provider_ollama'
  },
  {
    title: 'Groq AI',
    description: 'https://groq.com',
    value: 'provider_groq'
  },
  // {
  //   title: 'Anthropic',
  //   description: 'https://anthropic.com',
  //   value: 'provider_anthropic'
  // },
  {
    title: 'Together AI',
    description: 'https://together.ai',
    value: 'provider_together_ai'
  },
  // {
  //   title: 'OpenAI',
  //   description: 'https://openai.com',
  //   value: 'provider_open_ai'
  // },
];;

export const models = {

  provider_together_ai: [
    "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    "meta-llama/Llama-Vision-Free",
    "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
  ],

  provider_groq: [
    "deepseek-r1-distill-llama-70b",
    "llama3-70b-8192",
    "gemma2-9b-it",
  ],

}