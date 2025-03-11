
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
   git clone https://github.com/shidiqmuh0/bot-hyperbolic.git
   cd bot-hyperbolic
   ```
   Atau buat folder baru dan pindah ke folder tersebut.

2. **Instal Dependencies:**
   Jalankan perintah berikut untuk menginstal package yang diperlukan:
   ```bash
   npm install axios node-telegram-bot-api openai dotenv prompt-sync
   ```

3. **Buat File `.env`:**  
   Di direktori proyek, buat file `.env` dan tambahkan konfigurasi berikut (ganti nilai sesuai kebutuhan):

   Lihat di .env
   
   Pastikan `YOUR_TELEGRAM_BOT_TOKEN` adalah token yang didapat dari BotFather.

3. **Buat File `bot.js`:**  
   Gunakan kode berikut sebagai isi file `bot.js`:

## Menjalankan Bot
Setelah konfigurasi selesai, jalankan bot dengan perintah berikut:
```bash
node bot.js
```
Bot akan mulai berjalan dan siap menerima pesan melalui Telegram.

## Penggunaan Bot
**Menyimpan API Key:**
   - Gunakan perintah:
     ```
     /setkey YOUR_HYPERBOLIC_API_KEY
     ```
     untuk menyimpan API Key Hyperbolic milik Anda.

## Catatan Tambahan
- **Penyimpanan API Key:**  
  API Key disimpan di memori server sementara. Jika server restart, API Key akan hilang. Untuk penyimpanan permanen, pertimbangkan menggunakan database.
- **Error Handling:**  
  Jika terjadi kesalahan saat memproses permintaan ke API Hyperbolic, bot akan mengirim pesan error ke pengguna.
- **Deployment:**  
  Untuk menjalankan bot secara terus-menerus, pertimbangkan menggunakan PM2 atau platform hosting seperti Railway, Render, atau VPS.
