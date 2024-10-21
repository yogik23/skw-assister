const axios = require('axios');
const nacl = require('tweetnacl');
const base58 = require('bs58');
const fs = require('fs').promises;
const colors = require('colors');
const figlet = require('figlet');
require('dotenv').config();

const displayskw = require('./displayskw');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const date = new Date().toLocaleDateString('id-ID');

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
    console.error(`Error reading private key file: ${error.message}`);
    return null;
  }
}

function getKeypair(privateKey) {
  const keypairBuffer = base58.decode(privateKey);
  return nacl.sign.keyPair.fromSecretKey(keypairBuffer);
}

async function getMessage() {
  const response = await axios({
    url: 'https://api.assisterr.ai/incentive/auth/login/get_message/',
    method: 'GET',
    headers: HEADERS,
  });

  if (!response || !response.data) {
    throw new Error('Error fetching message');
  }

  return response.data; 
}

async function getAccessToken(privateKey) {
  const keypair = getKeypair(privateKey);
  const message = await getMessage();

  const sign = nacl.sign.detached(
    Buffer.from(message),
    keypair.secretKey
  );

  const signature = base58.encode(sign);
  const key = base58.encode(keypair.publicKey);

  const loginResponse = await axios({
    url: 'https://api.assisterr.ai/incentive/auth/login/',
    method: 'POST',
    data: {
      message: message,
      signature: signature,
      key: key,
    },
    headers: HEADERS,
  });

  if (!loginResponse || !loginResponse.data) {
    throw new Error('Login failed, no response data');
  }

  return loginResponse.data.access_token; 
}

async function getUserData(token) {
  const response = await axios({
    url: 'https://api.assisterr.ai/incentive/users/me/',
    method: 'GET',
    headers: {
      ...HEADERS,
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response || !response.data) {
    throw new Error('Error fetching user data');
  }

  return {
    username: response.data.username, 
    points: response.data.points, 
  };
}

async function dailyPoints(accessToken) {
  const url = "https://api.assisterr.ai/incentive/users/me/daily_points/";

  if (!accessToken) {
    console.log(colors.red("Tidak ada token otorisasi ditemukan."));
    return;
  }

  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Accept": "application/json",
  };

  try {
    const response = await axios.post(url, {}, { headers });

    if (response.status === 200) {
      console.log(colors.green(`Claim sukses`));
    } else {
      console.log(colors.yellow(`Sudah Claim`));
    }
  } catch (error) {
    console.log(colors.red(`Claim Cooldown`));
  }
}

async function sendBalanceToTelegram(totalAccounts, totalPoints) {
  const message = `🔆 *Assister Report ${date}

      🤖 Total Akun :${totalAccounts}
      💰 Total $sASSR :${(totalPoints / 100).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

         ==SKW Airdrop Hunter==*`;

  try {
    const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error(`Error sending message to Telegram: ${error.message}`);
  }
}

async function startBot() {
  try {
    const privateKeys = await getPrivateKeys();
    let totalAccounts = 0;
    let totalPoints = 0;

    for (const privateKey of privateKeys) {
      const accessToken = await getAccessToken(privateKey);
      const { username, points } = await getUserData(accessToken);
      await dailyPoints(accessToken);
      totalAccounts++;
      totalPoints += points;

      console.log(colors.blue(`Akun ${username} point: ${points}\n`));
    }

    await sendBalanceToTelegram(totalAccounts, totalPoints);
    console.log(colors.green('Balance sent to Telegram successfully.\n')); 
  } catch (error) {
    console.error(colors.red(`Error in startBot execution: ${error.message}`));
  }
}

async function main() {
  console.clear();
  const intervalTime = (12 * 60 * 60 * 1000) + (1 * 60 * 1000);

  const runBot = async () => {
    displayskw();
    await startBot(); 
    startCountdown(); 
  };

  const startCountdown = () => {
    let countdown = intervalTime / 1000; 

    const countdownInterval = setInterval(() => {
      if (countdown <= 0) {
        clearInterval(countdownInterval); 
        console.log(colors.red('Waktu habis, menjalankan bot kembali...\n')); 
      } else {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(colors.magenta(`Cooldown Claim Berikutnya: ${countdown} detik`));
        countdown--;
      }
    }, 1000);
  };

  await runBot();

  setInterval(runBot, intervalTime);
}

if (require.main === module) {
  main();
}
