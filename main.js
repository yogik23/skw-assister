const axios = require('axios');
const nacl = require('tweetnacl');
const base58 = require('bs58');
const fs = require('fs').promises;
const displayskw = require('./displayskw');
const chalk = require('chalk');
const figlet = require('figlet');
require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const date = new Date().toLocaleDateString('id-ID');

const HEADERS = {
  "accept": "application/json, text/plain, */*",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
};


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
    console.log(chalk.red("Tidak ada token otorisasi ditemukan."));
    return;
  }

  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Accept": "application/json",
  };

  try {
    const response = await axios.post(url, {}, { headers });

    if (response.status === 200) {
      console.log(chalk.hex('#90ee90')(`✅ Claim sukses`));
    } else {
      console.log(chalk.hex('#ffff99')(`❌ Sudah Claim`));
    }
  } catch (error) {
    console.log(chalk.hex('#ff6666')(`🔄 Claim Cooldown`));
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
  console.clear();
  displayskw();
  console.log();
  await delay(3000);

  try {
    const privateKeys = await getPrivateKeys();
    let totalAccounts = 0;
    let totalPoints = 0;

    for (const privateKey of privateKeys) {
      const accessToken = await getAccessToken(privateKey);
      const { username } = await getUserData(accessToken);
      console.log(chalk.hex('#ffb347')(`🤖 Akun ${username}`));
      await dailyPoints(accessToken);
      const { points } = await getUserData(accessToken);
      console.log(chalk.hex('#add8e6')(`💰 Point Akun ${username}: ${points}\n`));
      totalAccounts++;
      totalPoints += points;
    }

    console.log();
    console.log(chalk.hex('#90ee90')(`🤖 Total Akun: ${totalAccounts}\n💰 Total Points: ${totalPoints}`));
    await sendBalanceToTelegram(totalAccounts, totalPoints);
    console.log(chalk.hex('#ffff99')('💦 Pesan dikirim ke Telegram\n'));
  } catch (error) {
    console.error(chalk.hex('#ff6666')(`Error in startBot execution: ${error.message}`));
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
        console.log(chalk.red('Waktu habis, menjalankan bot kembali...\n')); 
      } else {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(chalk.magenta(`Cooldown Claim Berikutnya: ${countdown} detik`));
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
