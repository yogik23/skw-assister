# Assister AI Incentivised Testnet

![assssss](https://github.com/user-attachments/assets/278ea6ff-2685-4ccc-8d2d-e25c029e92d8)

## Fitur Autobot
- Auto claim 12 jam sekali
- Auto Send Pertanyaan ke Ai
- Balance send ke Telegram
- Multi Akun

## [Link Testnet](https://build.assisterr.ai/?ref=666478c979d736dc29550601)

## Step RUN

1. Clone repo dan masuk ke folder
    ```
    git clone https://github.com/yogik23/skw-assister && cd skw-assister
    ```
2. Install Module
    ```
    npm install
    ```
3. Submit PrivateKey di `privateKeys.json`
    ```
    nano privateKeys.json
    ```
   format privateKeys.json
    ```
    [
      "privateKey1",
      "privateKey2",
      "privateKey3"
    ]
    ```
4. Submit API telegram dan User id Telegram di `.env` atau bisa skip
    ```
    nano .env
    ```
    ```format .env```
    ```
    TELEGRAM_BOT_TOKEN=APIbotKalian
    TELEGRAM_CHAT_ID=userIDtelegram
    ```

4. Jalankan bot \
    ```claim Daily Point```
    ```
    npm start
    ```
    ```Chat Ai```
    ```
    npm run ask
    ```

**Recomended to using vps to automatic claims** 

**Sodah kerjekan mun sian botnye**
