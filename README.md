
# Bot Telegram dengan API Hyperbolic

Proyek ini adalah bot Telegram yang terintegrasi dengan API Hyperbolic. Bot ini memungkinkan pengguna untuk memasukkan API Key mereka sendiri sehingga setiap pengguna dapat mengakses API Hyperbolic secara independen. 

## Daftar Isi
- [Fitur](#fitur)
- [Prasyarat](#prasyarat)
- [Cara Membuat Bot Telegram (Melalui BotFather)](#cara-membuat-bot-telegram-melalui-botfather)
- [Instalasi & Konfigurasi](#instalasi--konfigurasi)
- [Menjalankan Bot](#menjalankan-bot)
- [Penggunaan Bot](#penggunaan-bot)
- [Catatan Tambahan](#catatan-tambahan)

## Fitur
- **Input API Key oleh pengguna:** Pengguna dapat menyimpan API Key Hyperbolic mereka dengan perintah `/setkey`.
- **Interaksi dengan API Hyperbolic:** Bot akan memproses pesan dari pengguna dan mengirimkannya ke API Hyperbolic untuk mendapatkan respons.
- **Respon langsung melalui Telegram:** Jawaban dari API Hyperbolic langsung dikirimkan ke pengguna.

## Prasyarat
Pastikan komputer Anda sudah terinstall:
- [Node.js](https://nodejs.org)
- npm (termasuk dalam paket instalasi Node.js)

## Cara Membuat Bot Telegram (Melalui BotFather)
1. **Buka Telegram:** Cari dan buka kontak **BotFather** di Telegram.
2. **Buat Bot Baru:**
   - Kirim perintah `/newbot` ke BotFather.
   - Ikuti instruksi, masukkan nama dan username untuk bot Anda.
3. **Dapatkan Token:** Setelah selesai, BotFather akan memberikan token API (seperti `123456789:ABCdefGhIJKlmNoPQRstuVWxyz`), yang nantinya digunakan pada file konfigurasi.

## Instalasi & Konfigurasi
1. **Clone Repository atau Buat Direktori Proyek Baru:**
   ```bash
   git clone https://github.com/username/repository.git
   cd repository
   ```
   Atau buat folder baru dan pindah ke folder tersebut.

2. **Instal Dependencies:**
   Jalankan perintah berikut untuk menginstal package yang diperlukan:
   ```bash
   npm install node-telegram-bot-api openai dotenv
   ```

3. **Buat File `.env`:**  
   Di direktori proyek, buat file `.env` dan tambahkan konfigurasi berikut (ganti nilai sesuai kebutuhan):
   ```
   BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
   HYPERBOLIC_API_URL=https://api.hyperbolic.xyz/v1
   MODEL=meta-llama/Meta-Llama-3-70B-Instruct
   ```
   Pastikan `YOUR_TELEGRAM_BOT_TOKEN` adalah token yang didapat dari BotFather.

4. **Buat File `bot.js`:**  
   Gunakan kode berikut sebagai isi file `bot.js`:
   ```javascript
require("dotenv").config();
const fs = require("fs");
const readline = require("readline");
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");
const OpenAI = require("openai");

// Inisialisasi bot Telegram
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const userApiKeys = {};

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Halo! Gunakan perintah berikut:\n\n" +
      "- /setkey YOUR_API_KEY untuk menyimpan API Key Hyperbolic\n" +
      "- /chat [pesan] untuk bertanya ke AI\n" +
      "- /image [prompt] untuk menghasilkan gambar"
  );
});

// User memasukkan API Key
bot.onText(/\/setkey (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const apiKey = match?.[1];

  if (!apiKey) {
    return bot.sendMessage(chatId, "⚠️ API Key tidak valid. Gunakan format: /setkey YOUR_API_KEY");
  }

  userApiKeys[chatId] = apiKey;
  bot.sendMessage(chatId, "✅ API Key Anda telah disimpan!");
});

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

// Handle chat dan image generation
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  if (!userMessage || userMessage.startsWith("/setkey")) return;

  const apiKey = userApiKeys[chatId];
  if (!apiKey) {
    return bot.sendMessage(chatId, "⚠️ Anda belum memasukkan API Key. Gunakan /setkey YOUR_API_KEY.");
  }

  if (userMessage.startsWith("/chat")) {
    const query = userMessage.replace("/chat", "").trim();
    if (!query) return bot.sendMessage(chatId, "⚠️ Mohon masukkan teks setelah /chat");

    bot.sendMessage(chatId, "⏳ Memproses...");

    try {
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: process.env.HYPERBOLIC_API_URL,
      });

      const response = await client.chat.completions.create({
        messages: [
          { role: "system", content: "You are an AI assistant." },
          { role: "user", content: query },
        ],
        model: process.env.MODEL,
      });

      const output = response.choices[0]?.message?.content || "Maaf, saya tidak bisa menjawab.";
      bot.sendMessage(chatId, output);
    } catch (error) {
      console.error("Error fetching from Hyperbolic API:", error);
      bot.sendMessage(chatId, "⚠️ Maaf, terjadi kesalahan dalam mendapatkan respon.");
    }
  } else if (userMessage.startsWith("/image")) {
    const promptText = userMessage.replace("/image", "").trim();
    if (!promptText) return bot.sendMessage(chatId, "⚠️ Mohon masukkan prompt setelah /image");

    bot.sendMessage(chatId, "⏳ Menghasilkan gambar...");
    
    try {
      const url = "https://api.hyperbolic.xyz/v1/image/generation";
      const payload = {
        model_name: "SDXL1.0-base",
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
});

console.log("🤖 Bot berjalan...");

process.once("SIGINT", () => bot.stopPolling());
process.once("SIGTERM", () => bot.stopPolling());

   ```

## Menjalankan Bot
Setelah konfigurasi selesai, jalankan bot dengan perintah berikut:
```bash
node bot.js
```
Bot akan mulai berjalan dan siap menerima pesan melalui Telegram.

## Penggunaan Bot
1. **Memulai Bot:**
   - Kirim perintah `/start` pada chat dengan bot. Bot akan memberikan instruksi untuk menyimpan API Key.
2. **Menyimpan API Key:**
   - Gunakan perintah:
     ```
     /setkey YOUR_HYPERBOLIC_API_KEY
     ```
     untuk menyimpan API Key Hyperbolic milik Anda.
3. **Bertanya ke AI:**
   - Setelah API Key disimpan, Anda bisa mengirim pesan apapun. Bot akan mengirim pesan "Memproses..." dan kemudian mengirimkan jawaban dari API Hyperbolic.

## Catatan Tambahan
- **Penyimpanan API Key:**  
  API Key disimpan di memori server sementara. Jika server restart, API Key akan hilang. Untuk penyimpanan permanen, pertimbangkan menggunakan database.
- **Error Handling:**  
  Jika terjadi kesalahan saat memproses permintaan ke API Hyperbolic, bot akan mengirim pesan error ke pengguna.
- **Deployment:**  
  Untuk menjalankan bot secara terus-menerus, pertimbangkan menggunakan PM2 atau platform hosting seperti Railway, Render, atau VPS.

---

README di atas mencakup instruksi lengkap mulai dari pembuatan bot di BotFather hingga instalasi, konfigurasi, dan penggunaan bot. Silakan disesuaikan dengan kebutuhan atau tambahan informasi jika diperlukan.
