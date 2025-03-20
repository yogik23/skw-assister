const axios = require('axios');
const fs = require('fs').promises;
const chalk = require('chalk');
const cron = require('node-cron');
const { displayskw } = require('./displayskw');

const {
  delay,
  HEADERS,
  getPrivateKeys,
  getAccessToken,
} = require('./skw/nudin');

const assistants = [
  { slug: "metis_assistant", name: "Metis" },
  { slug: "particle_network_assistant", name: "Particle" },
  { slug: "0g_assistant", name: "0g" },
  { slug: "solana_assistant", name: "Solana" },
  { slug: "morpheus_assistant", name: "Morpheus" },
  { slug: "ai-assistent", name: "Grok" },
  { slug: "solidity_code_companion", name: "Solidity" },
  { slug: "health_companion", name: "Health" }
];

function getRandomAssistant() {
  return assistants[Math.floor(Math.random() * assistants.length)];
}

function formatNumber(number) {
  return (number / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

async function getRandomQuestions(slug) {
  try {
    const filePath = `questions/${slug}.txt`;
    const data = await fs.readFile(filePath, 'utf8');
    const questions = data.split('\n').map(q => q.trim()).filter(q => q);

    if (questions.length === 0) throw new Error(`No questions found in ${filePath}`);

    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  } catch (error) {
    console.error(chalk.red(`❌ Error reading questions file for ${slug}: ${error.message}`));
    return [];
  }
}

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

async function createSession(slug, question, accessToken) {
  let attempts = 0;
  const maxAttempts = 3;
  while (attempts < maxAttempts) {
    try {
      const response = await axios.post(
        `https://api.assisterr.ai/incentive/slm/${slug}/chat/create_session/`,
        { query: question },
        {
          headers: {
            ...HEADERS,
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data) {
        console.log(chalk.hex('#5F9EA0')(`✅ Session dibuat dengan "${question}"`));
        return response.data;
      }
      throw new Error("❌ Gagal membuat sesi, respons tidak valid.");
    } catch (error) {
      attempts++;
      console.error(chalk.red(`❌ Percobaan ${attempts}/${maxAttempts} gagal membuat sesi: ${error.message}`));
      if (attempts < maxAttempts) await delay(3000);
    }
  }
  return null;
}

async function sendMessage(slug, sessionId, question, accessToken, questionNumber) {
  let attempts = 0;
  const maxAttempts = 1;
  while (attempts < maxAttempts) {
    try {
      console.log(chalk.hex('#5F9EA0')(`\n📨 ${question}`));

      const response = await axios.post(
        `https://api.assisterr.ai/incentive/slm/${slug}/chat/${sessionId}/`,
        { query: question },
        {
          headers: {
            ...HEADERS,
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data?.message) {
        console.log(chalk.hex('#00FF7F')(`✅ Berhasil bertanya yang tidak penting`));
      } else {
        console.log(chalk.hex('#00FF7F')(`✅ Berhasil bertanya yang tidak penting`));
      }
      return response.data;
    } catch (error) {
      attempts++;
      console.error(chalk.hex('#FFFF00')(`⚠️ Ai nya Goblok ga jawab : ${error.message}`));
      if (attempts < maxAttempts) await delay(5000);
    }
  }
  return null;
}

async function startBot() {
  console.clear();
  displayskw();
  console.log();
  await delay(1000);

  try {
    const privateKeys = await getPrivateKeys();
    if (!privateKeys.length) {
      console.log(chalk.red("❌ Tidak ada private key yang ditemukan."));
      return;
    }

    for (const privateKey of privateKeys) {
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

      const formattedPoints = formatNumber(userData.points);
      console.log(chalk.hex('#8A2BE2')(`\n🤖 Akun ${userData.username} ${formattedPoints} $sASRR`));

      const assistant = getRandomAssistant();
      console.log(chalk.hex('#00FF7F')(`🆔 Assistant Yg Dipilih: ${assistant.name} `));

      const questions = await getRandomQuestions(assistant.slug);
      if (questions.length === 0) {
        console.log(chalk.hex('#FFFF00')(`⚠️ Tidak ada pertanyaan tersedia untuk ${assistant.slug}`));
        continue;
      }

      const sessionId = await createSession(assistant.slug, questions[0], accessToken);
      if (!sessionId) {
        console.log(chalk.red(`❌ Gagal membuat sesi untuk ${assistant.slug}`));
        continue;
      }

      for (let i = 0; i < questions.length; i++) {
        await delay(15000);
        await sendMessage(assistant.slug, sessionId, questions[i], accessToken, i + 1);
      }
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error in main execution: ${error.message}`));
  }
}

async function main() {
    cron.schedule('0 1 * * *', async () => { 
        await startBot();
        console.log();
        console.log(chalk.hex('#7B68EE')(`Cron AKTIF`));
        console.log(chalk.hex('#20B2AA')('Jam 08:00 WIB Autobot Akan Run'));
    });

    await startBot();
    console.log();
    console.log(chalk.hex('#7B68EE')(`Cron AKTIF`));
    console.log(chalk.hex('#20B2AA')('Jam 08:00 WIB Autobot Akan Run Ulang...'));
}

main();
