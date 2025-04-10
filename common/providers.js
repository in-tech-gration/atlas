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
  {
    title: 'Anthropic',
    description: 'https://anthropic.com',
    value: 'provider_anthropic'
  },
  {
    title: 'Together AI',
    description: 'https://together.ai',
    value: 'provider_together_ai'
  },
  {
    title: 'OpenAI',
    description: 'https://openai.com',
    value: 'provider_open_ai'
  },
  {
    title: 'Gemini AI',
    description: 'https://gemini.google.com',
    value: 'provider_gemini'
  },
];

export const models = {

  // Source: https://docs.anthropic.com/en/docs/about-claude/models/all-models
  provider_anthropic:[
    {
      name: "claude-3-7-sonnet-latest",
      description: "Our most intelligent model",
      context_window: 200_000,
      max_output_tokens: 8192,
      modality: ["text","images"],
    },
    {
      name: "claude-3-5-sonnet-latest",
      description: "Our previous most intelligent model",
      context_window: 200_000,
      max_output_tokens: 8192,
      modality: ["text","images"],
    },
    {
      name: "claude-3-5-haiku-latest",
      description: "Our fastest model",
      context_window: 200_000,
      max_output_tokens: 8192,
      modality: ["text","images"],
    },
    {
      name: "claude-3-opus-latest",
      description: "Powerful model for complex tasks",
      context_window: 200_000,
      max_output_tokens: 4096,
      modality: ["text","images"],
    },
    {
      name: "claude-3-haiku-20240307",
      description: "Fastest and most compact model for near-instant responsiveness",
      context_window: 200_000,
      max_output_tokens: 4096,
      modality: ["text","images"],
    },
  ],

  provider_open_ai: [
    { name: "gpt-4o" },
    { name: "gpt-3.5-turbo" },
  ],

  provider_together_ai: [
    { name: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free" },
    { name: "meta-llama/Llama-Vision-Free" },
    { name: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free" },
  ],

  provider_groq: [
    { name: "deepseek-r1-distill-llama-70b" },
    { name: "llama3-70b-8192" },
    { name: "gemma2-9b-it" },
  ],

  // https://ai.google.dev/gemini-api/docs/models
  provider_gemini: [
    { 
      name: "gemini-1.5-pro",
      description: "Complex reasoning tasks requiring more intelligence", 
      modality: ["text"],
    },
    {
      name: "gemini-1.5-flash",
      description: "Fast and versatile performance across a diverse variety of tasks",
      modality: ["text", "images", "video", "audio"],
    },
    {
      name:"gemini-2.0-flash-lite",
      description: "Cost efficiency and low latency",
      modality: ["text", "images", "video", "audio"],
    }
  ],

  provider_ollama: [
    { 
      name: "llama3.2-vision:latest",
      context_window: 131_072,
      // max_output_tokens: 4096,
      modality: ["text", "images"],
     },
     {
      name: "llama3.2-vision:11b",
      context_window: 131_072,
      // max_output_tokens: 4096,
      modality: ["text", "images"],
     },
     {
      name: "llava:13b",
      modality: ["text", "images"],
     },
     {
      name: "bakllava:latest",
      modality: ["text", "images"],
     }
  ]

}