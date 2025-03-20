const chalk = require('chalk');

const welcomeskw = chalk.hex('#00CED1')(`
   ███████╗██╗  ██╗██╗    ██╗
   ██╔════╝██║ ██╔╝██║    ██║
   ███████╗█████╔╝ ██║ █╗ ██║
   ╚════██║██╔═██╗ ██║███╗██║
   ███████║██║  ██╗╚███╔███╔╝
   ╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ 
`);

function displayskw() {
  console.log(welcomeskw);
  console.log(chalk.hex('#00CED1')(" ╔══════════════════════════════════════════════════════════════╗"));
  console.log(chalk.hex('#00CED1')(" ║ ≣  Fitur Autobot by SKW AIRDROP HUNTER                       ║"));
  console.log(chalk.hex('#00CED1')(" ║══════════════════════════════════════════════════════════════║"));
  console.log(chalk.hex('#00CED1')(" ║ ➤   Auto claim 12 jam sekali                                ║"));
  console.log(chalk.hex('#00CED1')(" ║ ➤   Auto Chat Ai                                            ║"));
  console.log(chalk.hex('#00CED1')(" ║ ➤   Kirim Status ke Telegram                                ║"));
  console.log(chalk.hex('#00CED1')(" ║ ➤   Multi Akun                                              ║"));
  console.log(chalk.hex('#00CED1')(" ║ ➤   Sudah Pasti Elig                                        ║"));
  console.log(chalk.hex('#00CED1')(" ╚══════════════════════════════════════════════════════════════╝"));
  console.log(chalk.hex('#00CED1')("   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░"));
}

module.exports = { displayskw };
