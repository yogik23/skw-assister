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

function formatNumber(number) {
  return (number / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

async function cekelig(accessToken) {
  const url = "https://api.assisterr.ai/incentive/users/me/check_user_drop/";

  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Accept": "application/json",
  };

  try {
    const response = await axios.post(url, {}, { headers });

    const canDrop = response.data?.drop_info?.can_drop || false;
    const points = response.data?.points || 0;
    const username = response.data?.username || 'Unknown';

    return {
      eligible: canDrop,
      points,
      username,
    };
  } catch (error) {
    console.log(
      chalk.red(`❌ Error: ${error.response?.status} - ${error.response?.data?.message || 'Unknown error'}`)
    );
    return {
      eligible: false,
      points: 0,
      username: 'Unknown',
    };
  }
}

async function sendTG(totalAccounts, totalElig, retries = 3) {
  const message = `🚀 *Assister*\n🤖 *Total Akun : ${totalAccounts}*\n💦 *Total Elig: ${totalElig}*`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "MarkdownV2",
        }
      );
      console.log(chalk.hex('#FF8C00')(`✅ Message sent to Telegram successfully!\n`));
      return response.data;
    } catch (error) {
      if (attempt < retries) await delay(2000);
      else return null;
    }
  }
}

async function startBot() {
  console.clear();
  displayskw();
  console.log();

  try {
    const privateKeys = await getPrivateKeys();
    let totalAccounts = 0;
    let totalElig = 0;
    let totalPoints = 0;

    for (const privateKey of privateKeys) {
      try {
        const accessToken = await getAccessToken(privateKey);
        if (!accessToken) {
          console.log(chalk.red(`❌ Gagal mendapatkan token untuk akun.`));
          continue;
        }

        const { eligible, points = 0, username, publicKey } = await cekelig(accessToken);
        const formattedPoints = formatNumber(points);

        console.log(chalk.cyan(`📛 Wallet ke-${totalAccounts + 1}`));
        console.log(chalk.blue(`👤 Username: ${username}`));
        console.log(chalk.hex('#66CDAA')(`💰 Point: ${formattedPoints} $sASRR`));

        if (eligible) {
          console.log(chalk.green(`✅ Anda ELIGIBLE\n`));
          totalElig++;
        } else {
          console.log(chalk.yellow(`⚠️ Anda TIDAK eligible WKWKWK\n`));
        }

        totalAccounts++;
        totalPoints += points;

        await delay(3000);
      } catch (error) {
        console.error(chalk.red(`❌ Error processing an account: ${error.message}`));
      }
    }

    console.log();
    console.log(chalk.hex('#20B2AA')(`🤖 Total Akun: ${totalAccounts}`));
    console.log(chalk.hex('#32CD32')(`✅ Total Eligible: ${totalElig}`));
    console.log(chalk.hex('#FFD700')(`💰 Total Poin: ${formatNumber(totalPoints)}`));
    await sendTG(totalAccounts, totalElig);
  } catch (error) {
    console.error(chalk.red(`❌ Error in startBot execution: ${error.message}`));
  }
}

startBot();
