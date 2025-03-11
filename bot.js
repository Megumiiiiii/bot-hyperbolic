require("dotenv").config();
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");
const OpenAI = require("openai");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const userApiKeys = {};
const userModes = {};         // Menyimpan mode pengguna: 'chat', 'image', atau 'audio'
const userTextModels = {};    // Menyimpan model teks pilihan pengguna
const userImageModels = {};   // Menyimpan model gambar pilihan pengguna

// Daftar model untuk teks dan gambar
const textModels = [
  { name: "Qwen/QwQ-32B", value: "Qwen/QwQ-32B" },
  { name: "DeepSeek-R1", value: "deepseek-ai/DeepSeek-R1" },
  { name: "Llama-3.3-70B", value: "meta-llama/Llama-3.3-70B-Instruct" },
  { name: "Qwen2.5-72B", value: "Qwen/Qwen2.5-72B-Instruct" },
];

const imageModels = [
  { name: "FLUX.1-dev", value: "FLUX.1-dev" },
  { name: "SDXL1.0-base", value: "SDXL1.0-base" },
  { name: "SSD", value: "SSD" },
  { name: "SD2", value: "SD2" },
];

// Fungsi untuk mendapatkan nama file unik
function getUniqueFileName(baseName) {
  let fileName = baseName;
  let counter = 1;
  while (fs.existsSync(fileName)) {
    const dotIndex = baseName.lastIndexOf(".");
    if (dotIndex !== -1) {
      fileName = `${baseName.slice(0, dotIndex)}(${counter})${baseName.slice(dotIndex)}`;
    } else {
      fileName = `${baseName}(${counter})`;
    }
    counter++;
  }
  return fileName;
}

// Handler /start: tampilkan keyboard untuk memilih mode dan model
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "Chat AI", callback_data: "mode_chat" }],
      [{ text: "Generate Image", callback_data: "mode_image" }],
      [{ text: "Generate Audio", callback_data: "mode_audio" }],
      [
        { text: "Pilih Model Text", callback_data: "select_text_model" },
        { text: "Pilih Model Image", callback_data: "select_image_model" },
      ],
    ],
  };
  
  bot.sendMessage(chatId, "Silakan set API Key terlebih dahulu dengan /setkey YOUR_API_KEY.\n\nKemudian, pilih layanan yang diinginkan:", { reply_markup: keyboard });
});

// Callback query untuk mode dan pemilihan model
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const action = callbackQuery.data;

  if (action === "select_text_model") {
    const keyboard = {
      inline_keyboard: textModels.map((model) => [{ text: model.name, callback_data: `text_model_${model.value}` }]),
    };
    bot.sendMessage(chatId, "Pilih model teks:", { reply_markup: keyboard });
  } else if (action === "select_image_model") {
    const keyboard = {
      inline_keyboard: imageModels.map((model) => [{ text: model.name, callback_data: `image_model_${model.value}` }]),
    };
    bot.sendMessage(chatId, "Pilih model gambar:", { reply_markup: keyboard });
  } else if (action.startsWith("text_model_")) {
    const model = action.replace("text_model_", "");
    userTextModels[chatId] = model;
    bot.sendMessage(chatId, `✅ Model teks diatur ke: ${model}`);
  } else if (action.startsWith("image_model_")) {
    const model = action.replace("image_model_", "");
    userImageModels[chatId] = model;
    bot.sendMessage(chatId, `✅ Model gambar diatur ke: ${model}`);
  } else if (action.startsWith("mode_")) {
    const mode = action.replace("mode_", ""); // 'chat', 'image', atau 'audio'
    userModes[chatId] = mode;
    let instruksi = "";
    if (mode === "chat") instruksi = "Silakan kirim pesan untuk memulai percakapan dengan AI.";
    else if (mode === "image") instruksi = "Silakan kirim prompt untuk menghasilkan gambar.";
    else if (mode === "audio") instruksi = "Silakan kirim teks untuk diubah menjadi audio.\nFormat: [teks] | [language, default: EN] | [speaker, default: EN-US]";
    bot.sendMessage(chatId, instruksi);
  }
});

// Handler untuk menyetel API Key
bot.onText(/\/setkey (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const apiKey = match?.[1];
  if (!apiKey) {
    return bot.sendMessage(chatId, "⚠️ API Key tidak valid. Gunakan format: /setkey YOUR_API_KEY");
  }
  userApiKeys[chatId] = apiKey;
  bot.sendMessage(chatId, "✅ API Key Anda telah disimpan!");
});

// Handler pesan: proses berdasarkan mode yang telah dipilih
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;
  
  // Abaikan perintah /setkey, /start, dan pesan yang berasal dari callback (yang sudah ditangani)
  if (!userMessage || userMessage.startsWith("/setkey") || userMessage.startsWith("/start")) return;
  
  const apiKey = userApiKeys[chatId];
  if (!apiKey) {
    return bot.sendMessage(chatId, "⚠️ Anda belum memasukkan API Key. Gunakan /setkey YOUR_API_KEY.");
  }
  
  const mode = userModes[chatId];
  if (!mode) {
    return bot.sendMessage(chatId, "⚠️ Silakan pilih layanan melalui tombol yang tersedia.");
  }
  
  // MODE CHAT: Proses chat AI
  if (mode === "chat") {
    const query = userMessage.trim();
    if (!query) return bot.sendMessage(chatId, "⚠️ Mohon masukkan teks untuk chat.");
    
    bot.sendMessage(chatId, "⏳ Memproses chat...");
    const selectedTextModel = userTextModels[chatId] || "Qwen/QwQ-32B"; // default text model

    try {
      const client = new OpenAI({ apiKey, baseURL: process.env.HYPERBOLIC_API_URL });
      const response = await client.chat.completions.create({
        messages: [
          { role: "system", content: "You are an AI assistant." },
          { role: "user", content: query },
        ],
        model: selectedTextModel,
      });
      const output = response.choices[0]?.message?.content || "Maaf, saya tidak bisa menjawab.";
      bot.sendMessage(chatId, output);
    } catch (error) {
      console.error("Error fetching from Hyperbolic API:", error);
      bot.sendMessage(chatId, "⚠️ Maaf, terjadi kesalahan dalam mendapatkan respon chat.");
    }
  }
  // MODE IMAGE: Proses generate gambar
  else if (mode === "image") {
    const promptText = userMessage.trim();
    if (!promptText) return bot.sendMessage(chatId, "⚠️ Mohon masukkan prompt untuk gambar.");
    
    bot.sendMessage(chatId, "⏳ Menghasilkan gambar...");
    const selectedImageModel = userImageModels[chatId] || "SDXL1.0-base"; // default image model

    try {
      const url = "https://api.hyperbolic.xyz/v1/image/generation";
      const payload = {
        model_name: selectedImageModel,
        prompt: promptText,
        height: 1024,
        width: 1024,
        backend: "auto",
        lora: {
          Pixel_Art: 0.5,
          Logo: 0.5,
          Paint_Splash: 0.9,
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Terjadi kesalahan: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      if (!json.images || json.images.length === 0 || !json.images[0].image) {
        throw new Error("Respons API tidak mengandung data gambar yang valid.");
      }

      let base64Data = json.images[0].image;
      if (base64Data.startsWith("data:image")) {
        base64Data = base64Data.split(",")[1];
      }
      if (!base64Data) {
        throw new Error("Data gambar kosong.");
      }
      const fileName = getUniqueFileName("image.jpg");
      fs.writeFileSync(fileName, Buffer.from(base64Data, "base64"));
      bot.sendPhoto(chatId, fileName, { caption: "✅ Gambar berhasil dihasilkan!" });
    } catch (error) {
      console.error("Error generating image:", error);
      bot.sendMessage(chatId, "⚠️ Maaf, terjadi kesalahan saat menghasilkan gambar.");
    }
  }
  // MODE AUDIO: Proses generate audio
  else if (mode === "audio") {
    // Format input: teks | language | speaker
    const parts = userMessage.split("|").map(s => s.trim());
    const text = parts[0];
    let language = parts[1] ? parts[1].toUpperCase() : "EN";
    let speaker = parts[2] ? parts[2].toUpperCase() : "EN-US";
    if (!text) {
      return bot.sendMessage(chatId, "⚠️ Teks tidak boleh kosong.");
    }
    
    bot.sendMessage(chatId, "⏳ Menghasilkan audio...");
    try {
      const url = "https://api.hyperbolic.xyz/v1/audio/generation";
      const payload = { text, language, speaker };
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Terjadi kesalahan: ${response.status} ${response.statusText}`);
      }
      
      const json = await response.json();
      if (!json.audio) {
        throw new Error("Respons API tidak mengandung data audio yang valid.");
      }
      
      const audioBase64 = json.audio;
      const audioBuffer = Buffer.from(audioBase64, "base64");
      const fileName = getUniqueFileName("audio.mp3");
      fs.writeFileSync(fileName, audioBuffer);
      bot.sendAudio(chatId, fileName, { caption: "✅ Audio berhasil dihasilkan!" });
    } catch (error) {
      console.error("Error generating audio:", error);
      bot.sendMessage(chatId, "⚠️ Maaf, terjadi kesalahan saat menghasilkan audio.");
    }
  }
});

console.log("🤖 Bot berjalan...");
process.once("SIGINT", () => bot.stopPolling());
process.once("SIGTERM", () => bot.stopPolling());
