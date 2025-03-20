const fs = require('fs/promises');
const axios = require('axios');
const nacl = require('tweetnacl');
const base58 = require('bs58');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const HEADERS = {
  "accept": "application/json, text/plain, */*",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
};

async function getPrivateKeys() {
  try {
    const data = await fs.readFile('privateKeys.json', 'utf8');
    const privateKeys = JSON.parse(data);

    if (!Array.isArray(privateKeys) || privateKeys.length === 0) {
      throw new Error('Private keys not found in file');
    }

    return privateKeys;
  } catch (error) {
    console.error(`❌ Error reading private key file: ${error.message}`);
    return null;
  }
}

function getKeypair(privateKey) {
  const keypairBuffer = base58.decode(privateKey);
  return nacl.sign.keyPair.fromSecretKey(keypairBuffer);
}

async function getMessage() {
  try {
    const response = await axios.get(
      'https://api.assisterr.ai/incentive/auth/login/get_message/',
      { headers: HEADERS }
    );

    if (response.status !== 200 || !response.data) {
      throw new Error(`Unexpected response: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching message: ${error.message}`);
    return null;
  }
}

async function getAccessToken(privateKey) {
  try {
    const keypair = getKeypair(privateKey);
    const message = await getMessage();
    if (!message) return null;

    const sign = nacl.sign.detached(Buffer.from(message), keypair.secretKey);
    const signature = base58.encode(sign);
    const key = base58.encode(keypair.publicKey);

    const response = await axios.post(
      'https://api.assisterr.ai/incentive/auth/login/',
      { message, signature, key },
      { headers: HEADERS }
    );

    if (response.status !== 200 || !response.data.access_token) {
      throw new Error(`Login failed: ${response.status}`);
    }

    return response.data.access_token;
  } catch (error) {
    console.error(`❌ Error getting access token: ${error.message}`);
    return null;
  }
}

async function sendBalanceToTelegram(totalAccounts, totalPoints) {
  const date = new Date().toISOString().split('T')[0];

  const message = `🔆 *Assister Report ${date}*\n
      🤖 *Total Akun:* ${totalAccounts}\n
      💰 *Total $sASSR:* ${(totalPoints / 100).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
        SKW Airdrop Hunter`;

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "MarkdownV2",
      }
    );

    console.log(`✅ Message sent to Telegram successfully!`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending message to Telegram: ${error.message}`);
    return null;
  }
}

module.exports = {
  delay,
  HEADERS,
  getPrivateKeys,
  getKeypair,
  getMessage,
  getAccessToken,
  sendBalanceToTelegram,
};
