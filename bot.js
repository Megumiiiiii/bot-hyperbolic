require("dotenv").config();
const fs = require("fs/promises");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");
const OpenAI = require("openai");
const { v4: uuidv4 } = require("uuid");

// Validasi environment variables
if (!process.env.BOT_TOKEN || !process.env.HYPERBOLIC_API_URL || !process.env.API_KEY) {
  throw new Error("Missing required environment variables");
}

// Konfigurasi
const CONFIG = {
  DEFAULT_TEXT_MODEL: "Qwen/QwQ-32B",
  DEFAULT_IMAGE_MODEL: "SDXL1.0-base",
  DEFAULT_AUDIO_LANGUAGE: "EN",
  DEFAULT_AUDIO_SPEAKER: "EN-US",
  IMAGE_SETTINGS: {
    steps: 30,
    cfg_scale: 5,
    enable_refiner: false,
    height: 1024,
    width: 1024,
    backend: "auto",
    lora: { Pixel_Art: 0.5, Logo: 0.5, Paint_Splash: 0.9 }
  },
  API_TIMEOUT: 30000,
  TEMP_DIR: "./temp"
};

// Daftar model
const textModels = [
  { name: "Qwen/QwQ-32B", value: "Qwen/QwQ-32B" },
  { name: "DeepSeek-R1", value: "deepseek-ai/DeepSeek-R1" },
  { name: "Llama-3.3-70B", value: "meta-llama/Llama-3.3-70B-Instruct" },
  { name: "Qwen2.5-72B", value: "Qwen/Qwen2.5-72B-Instruct" },
];

const imageModels = [
  { name: "FLUX.1-dev", value: "FLUX.1-dev" },
  { name: "SDXL1.0-base", value: "SDXL1.0-base" },
  { name: "SD1.5", value: "SD1.5" },
  { name: "SSD", value: "SSD" },
  { name: "SD2", value: "SD2" },
  { name: "SDXL-turbo", value: "SDXL-turbo" }
];

const audioLanguageModels = [
  { name: "English (EN)", value: "EN" },
  { name: "Spanish (ES)", value: "ES" },
  { name: "French (FR)", value: "FR" },
  { name: "Chinese (ZH)", value: "ZH" },
  { name: "Japanese (JP)", value: "JP" },
  { name: "Korean (KR)", value: "KR" }
];

const audioSpeakerModels = [
  { name: "US English (EN-US)", value: "EN-US" },
  { name: "British English (EN-BR)", value: "EN-BR" },
  { name: "Indian English (EN-INDIA)", value: "EN-INDIA" },
  { name: "Australian English (EN-AU)", value: "EN-AU" },
  { name: "Spanish (ES)", value: "ES" },
  { name: "French (FR)", value: "FR" },
  { name: "Chinese (ZH)", value: "ZH" },
  { name: "Japanese (JP)", value: "JP" },
  { name: "Korean (KR)", value: "KR" }
];

// Inisialisasi
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const userStates = new Map();

// Helper functions
const createUserState = () => ({
  mode: null,
  textModel: CONFIG.DEFAULT_TEXT_MODEL,
  imageModel: CONFIG.DEFAULT_IMAGE_MODEL,
  audioLanguage: CONFIG.DEFAULT_AUDIO_LANGUAGE,
  audioSpeaker: CONFIG.DEFAULT_AUDIO_SPEAKER,
  lastActivity: Date.now()
});

const handleError = async (chatId, error, context = "") => {
  console.error(`[ERROR] ${context}:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date()
  });
  
  await bot.sendMessage(
    chatId,
    `⚠️ Terjadi kesalahan: ${error.message}\n\n` +
    "Silakan coba lagi atau hubungi admin dengan kode error: " +
    `${uuidv4().substring(0, 8)}`
  );
};

const apiRequest = async (url, options) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

// Inisialisasi
(async () => {
  await fs.mkdir(CONFIG.TEMP_DIR, { recursive: true });
})();

// Command handlers
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  if (!userStates.has(chatId)) {
    userStates.set(chatId, createUserState());
  }

  const keyboard = {
    inline_keyboard: [
      [{ text: "Chat AI", callback_data: "mode_chat" }],
      [{ text: "Generate Image", callback_data: "mode_image" }],
      [{ text: "Generate Audio", callback_data: "mode_audio" }],
      [
        { text: "Text Model", callback_data: "select_text_model" },
        { text: "Image Model", callback_data: "select_image_model" }
      ],
      [
        { text: "Audio Language", callback_data: "select_audio_language" },
        { text: "Audio Speaker", callback_data: "select_audio_speaker" }
      ]
    ]
  };

  await bot.sendMessage(
    chatId,
    "🚀 Selamat datang di AI Assistant Bot!\n\n" +
    "Pilih layanan yang diinginkan:",
    { reply_markup: keyboard }
  );
});

// Callback query handler
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const action = callbackQuery.data;
  const userState = userStates.get(chatId) || createUserState();

  try {
    // Text model selection
    if (action.startsWith("text_model_")) {
      const selectedModel = action.replace("text_model_", "");
      userState.textModel = selectedModel;
      userStates.set(chatId, userState);
      await bot.sendMessage(chatId, `✅ Model teks diubah ke: ${selectedModel}`);
    }
    
    // Image model selection
    else if (action.startsWith("image_model_")) {
      const selectedModel = action.replace("image_model_", "");
      userState.imageModel = selectedModel;
      userStates.set(chatId, userState);
      await bot.sendMessage(chatId, `✅ Model gambar diubah ke: ${selectedModel}`);
    }
    
    // Audio language selection
    else if (action.startsWith("audio_lang_")) {
      const selectedLang = action.replace("audio_lang_", "");
      userState.audioLanguage = selectedLang;
      userStates.set(chatId, userState);
      await bot.sendMessage(chatId, `🗣️ Bahasa audio diubah ke: ${selectedLang}`);
    }
    
    // Audio speaker selection
    else if (action.startsWith("audio_speaker_")) {
      const selectedSpeaker = action.replace("audio_speaker_", "");
      userState.audioSpeaker = selectedSpeaker;
      userStates.set(chatId, userState);
      await bot.sendMessage(chatId, `📢 Speaker audio diubah ke: ${selectedSpeaker}`);
    }
    
    // Text model selection menu
    else if (action === "select_text_model") {
      const keyboard = {
        inline_keyboard: textModels.map(model => [
          { 
            text: `${model.name} ${userState.textModel === model.value ? '✅' : ''}`,
            callback_data: `text_model_${model.value}`
          }
        ])
      };
      await bot.sendMessage(chatId, "Pilih model teks:", { reply_markup: keyboard });
    } 
    
    // Image model selection menu
    else if (action === "select_image_model") {
      const keyboard = {
        inline_keyboard: imageModels.map(model => [
          { 
            text: `${model.name} ${userState.imageModel === model.value ? '✅' : ''}`,
            callback_data: `image_model_${model.value}`
          }
        ])
      };
      await bot.sendMessage(chatId, "Pilih model gambar:", { reply_markup: keyboard });
    }
    
    // Audio language selection menu
    else if (action === "select_audio_language") {
      const keyboard = {
        inline_keyboard: audioLanguageModels.map(lang => [
          {
            text: `${lang.name} ${userState.audioLanguage === lang.value ? '✅' : ''}`,
            callback_data: `audio_lang_${lang.value}`
          }
        ])
      };
      await bot.sendMessage(chatId, "Pilih bahasa audio:", { reply_markup: keyboard });
    }
    
    // Audio speaker selection menu
    else if (action === "select_audio_speaker") {
      const keyboard = {
        inline_keyboard: audioSpeakerModels.map(spk => [
          {
            text: `${spk.name} ${userState.audioSpeaker === spk.value ? '✅' : ''}`,
            callback_data: `audio_speaker_${spk.value}`
          }
        ])
      };
      await bot.sendMessage(chatId, "Pilih speaker audio:", { reply_markup: keyboard });
    }
    
    // Mode selection
    else if (action.startsWith("mode_")) {
      userState.mode = action.replace("mode_", "");
      userStates.set(chatId, userState);
      await bot.sendMessage(chatId, `📌 Mode diubah ke: ${userState.mode}`);
    }
    
  } catch (error) {
    handleError(chatId, error, "memproses callback");
  }
});

// Message handler
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userState = userStates.get(chatId) || createUserState();
  
  if (!userState.mode) {
    return bot.sendMessage(chatId, "📌 Silakan pilih mode terlebih dahulu melalui menu");
  }

  try {
    switch (userState.mode) {
      case 'chat':
        await handleChatMode(msg, userState);
        break;
      case 'image':
        await handleImageMode(msg, userState);
        break;
      case 'audio':
        await handleAudioMode(msg, userState);
        break;
    }
    
    userState.lastActivity = Date.now();
  } catch (error) {
    handleError(chatId, error, "memproses permintaan");
  }
});

// Modular handlers
async function handleChatMode(msg, userState) {
  const chatId = msg.chat.id;
  const query = msg.text?.trim();
  
  if (!query) {
    return bot.sendMessage(chatId, "📝 Silakan masukkan pertanyaan atau pesan Anda");
  }

  const processingMsg = await bot.sendMessage(chatId, "⏳ Sedang memproses...");

  try {
    const client = new OpenAI({
      apiKey: process.env.API_KEY,
      baseURL: process.env.HYPERBOLIC_API_URL
    });

    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: "Anda adalah asisten AI yang membantu pengguna" },
        { role: "user", content: query }
      ],
      model: userState.textModel,
      temperature: 0.7,
      max_tokens: 500
    });

    await bot.deleteMessage(chatId, processingMsg.message_id);
    await bot.sendMessage(chatId, response.choices[0].message.content, {
      parse_mode: "Markdown",
      disable_web_page_preview: true
    });
  } catch (error) {
    await bot.deleteMessage(chatId, processingMsg.message_id);
    throw error;
  }
}

async function handleImageMode(msg, userState) {
  const chatId = msg.chat.id;
  const prompt = msg.text?.trim();
  
  if (!prompt) {
    return bot.sendMessage(chatId, "🎨 Silakan masukkan deskripsi gambar yang diinginkan");
  }

  const processingMsg = await bot.sendMessage(chatId, "🖌️ Sedang membuat gambar...");
  
  try {
    const fileName = path.join(CONFIG.TEMP_DIR, `${uuidv4()}.jpg`);
    const payload = { 
      ...CONFIG.IMAGE_SETTINGS, 
      model_name: userState.imageModel,
      prompt: prompt
    };
    
    const response = await apiRequest(
      "https://api.hyperbolic.xyz/v1/image/generation", // URL spesifik untuk image generation
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.API_KEY}`
        },
        body: JSON.stringify(payload)
      }
    );

    const base64Data = response.images[0].image.split(",").pop();
    await fs.writeFile(fileName, Buffer.from(base64Data, "base64"));
    
    await bot.deleteMessage(chatId, processingMsg.message_id);
    await bot.sendPhoto(chatId, fileName, {
      caption: `🖼️ Gambar selesai dibuat menggunakan model ${userState.imageModel}`
    });
    
    await fs.unlink(fileName);
  } catch (error) {
    await bot.deleteMessage(chatId, processingMsg.message_id);
    throw error;
  }
}

async function handleAudioMode(msg, userState) {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  
  if (!text) {
    return bot.sendMessage(chatId, "🎵 Silakan masukkan teks yang ingin diubah ke audio");
  }

  const processingMsg = await bot.sendMessage(chatId, "🔊 Sedang membuat audio...");
  
  try {
    const fileName = path.join(CONFIG.TEMP_DIR, `${uuidv4()}.mp3`);
    const payload = {
      text: text,
      language: userState.audioLanguage,
      speaker: userState.audioSpeaker,
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0
    };
    
    const response = await apiRequest(
      `${process.env.HYPERBOLIC_API_URL}/audio/generation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.API_KEY}`
        },
        body: JSON.stringify(payload)
      }
    );

    const base64Data = response.audio.split(",").pop();
    await fs.writeFile(fileName, Buffer.from(base64Data, "base64"));
    
    await bot.deleteMessage(chatId, processingMsg.message_id);
    await bot.sendAudio(chatId, fileName, {
      title: `Audio_${Date.now()}`,
      performer: "AI Assistant",
      caption: `🎵 Audio berhasil dibuat (${userState.audioLanguage}/${userState.audioSpeaker})`
    });
    
    await fs.unlink(fileName);
  } catch (error) {
    await bot.deleteMessage(chatId, processingMsg.message_id);
    throw error;
  }
}

// Cleanup tasks
setInterval(() => {
  const now = Date.now();
  userStates.forEach((state, chatId) => {
    if (now - state.lastActivity > 3600000) {
      userStates.delete(chatId);
    }
  });
}, 3600000);

process.once("SIGINT", () => {
  bot.stopPolling();
  console.log("🛑 Bot dihentikan dengan aman");
  process.exit();
});
