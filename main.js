const axios = require('axios');
const nacl = require('tweetnacl');
const base58 = require('bs58');
const fs = require('fs').promises;
const { displayskw } = require('./displayskw');
const chalk = require('chalk');
const figlet = require('figlet');
require('dotenv').config();

const {
  delay,
  HEADERS,
  getPrivateKeys,
  getKeypair,
  getMessage,
  getAccessToken,
  sendBalanceToTelegram,
} = require('./skw/nudin');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const date = new Date().toISOString().split('T')[0];

async function getUserData(accessToken) {
  try {
    const response = await axios.get('https://api.assisterr.ai/incentive/users/me/', {
      headers: {
        ...HEADERS,
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (response.status !== 200 || !response.data) {
      throw new Error(`Unexpected response: ${response.status}`);
    }

    return {
      username: response.data.username, 
      points: response.data.points, 
    };
  } catch (error) {
    console.error(chalk.red(`❌ Error fetching user data: ${error.message}`));
    return null;
  }
}

async function dailyPoints(accessToken) {
  const url = "https://api.assisterr.ai/incentive/users/me/daily_points/";

  if (!accessToken) {
    console.log(chalk.red("❌ Tidak ada token otorisasi ditemukan."));
    return;
  }

  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Accept": "application/json",
  };

  try {
    const response = await axios.post(url, {}, { headers });

    if (response.status === 200) {
      console.log(chalk.hex('#20B2AA')(`✅ Claim sukses`));
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 400) {
        console.log(chalk.hex('#20B2AA')(`⚠️ Sudah Claim`));
      } else if (error.response.status === 401) {
        console.log(chalk.red(`🚫 Token tidak valid`));
      } else {
        console.log(chalk.red(`❌ Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`));
      }
    } else {
      console.log(chalk.red(`🔄 Claim Cooldown atau jaringan error`));
    }
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
      try {
        const accessToken = await getAccessToken(privateKey);
        if (!accessToken) {
          console.log(chalk.red(`❌ Gagal mendapatkan token untuk akun.`));
          continue;
        }

        const userData = await getUserData(accessToken);
        if (!userData) {
          console.log(chalk.red(`❌ Gagal mendapatkan data user.`));
          continue;
        }

        console.log(chalk.hex('#7B68EE')(`🤖 Akun ${userData.username}`));

        await dailyPoints(accessToken);
        const updatedData = await getUserData(accessToken);
        if (!updatedData) continue;

        console.log(chalk.hex('#66CDAA')(`💰 Point ${updatedData.points}\n`));

        totalAccounts++;
        totalPoints += updatedData.points;
      } catch (error) {
        console.error(chalk.red(`❌ Error processing an account: ${error.message}`));
      }
    }

    console.log();
    console.log(chalk.hex('#20B2AA')(`🤖 Total Akun: ${totalAccounts}\n💰 Total Points: ${totalPoints}`));
    await sendBalanceToTelegram(totalAccounts, totalPoints);
    console.log(chalk.hex('#48D1CC')('📩 Pesan dikirim ke Telegram\n'));
  } catch (error) {
    console.error(chalk.red(`❌ Error in startBot execution: ${error.message}`));
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
        console.log(chalk.hex('#7B68EE')('\n⏳ Waktu habis, menjalankan bot kembali...\n'));
      } else {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(chalk.hex('#7B68EE')(`⏳ Cooldown berikutnya: ${countdown} detik`));
        countdown--;
      }
    }, 1000);
  };

  await runBot();

  setInterval(runBot, intervalTime);
}

main();
