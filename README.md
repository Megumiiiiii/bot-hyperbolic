
# Bot Telegram dengan API Hyperbolic

Proyek ini adalah bot Telegram yang terintegrasi dengan API Hyperbolic. Bot ini memungkinkan pengguna untuk memasukkan API Key mereka sendiri sehingga setiap pengguna dapat mengakses API Hyperbolic secara independen. 

## Daftar Isi
- [Fitur](#fitur)
- [Prasyarat](#prasyarat)
- [Cara Membuat Bot Telegram (Melalui BotFather)](#cara-membuat-bot-telegram-melalui-botfather)
- [Instalasi & Konfigurasi](#instalasi--konfigurasi)
- [Menjalankan Bot](#menjalankan-bot)

## Fitur
✅ **Model Teks**  
- Qwen/QwQ-32B
- DeepSeek-R1
- Llama-3.3-70B
- Qwen2.5-72B

✅ **Model Gambar**  
- FLUX.1-dev
- SDXL1.0-base
- SD1.5
- SSD
- SD2
- SDXL-turbo

✅ **Audio Generation**  
- Pilih bahasa (EN/ES/FR/ZH/JP/KR)
- Pilih suara (EN-US/EN-BR/EN-INDIA/dll)
- Konversi teks ke suara

✅ **Keamanan**  
- Otomatis hapus file sementara
- Time-out sesi pengguna
  
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
   git clone https://github.com/shidiqmuh0/bot-hyperbolic.git
   cd bot-hyperbolic
   ```
   Atau buat folder baru dan pindah ke folder tersebut.

2. **Instal Dependencies:**
   Jalankan perintah berikut untuk menginstal package yang diperlukan:
   ```bash
   npm install dotenv node-telegram-bot-api node-fetch openai uuid
   ```

3. **Buat File `.env`:**  
   Di direktori proyek, buat file `.env` dan tambahkan konfigurasi berikut (ganti nilai sesuai kebutuhan):

   Lihat di .env
   
   Pastikan `YOUR_TELEGRAM_BOT_TOKEN` adalah token yang didapat dari BotFather.

   API_KEY isi dengan apikey yang diberi oleh hyperbolic

3. **Buat File `bot.js`:**  
   Gunakan kode berikut sebagai isi file `bot.js`

## Menjalankan Bot
Setelah konfigurasi selesai, jalankan bot dengan perintah berikut:
```bash
node bot.js
```
Bot akan mulai berjalan dan siap menerima pesan melalui Telegram.
