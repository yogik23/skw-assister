const chalk = require('chalk');
const welcomeskw = `
   ███████╗██╗  ██╗██╗    ██╗
   ██╔════╝██║ ██╔╝██║    ██║
   ███████╗█████╔╝ ██║ █╗ ██║
   ╚════██║██╔═██╗ ██║███╗██║
   ███████║██║  ██╗╚███╔███╔╝
   ╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ 
                          
`;

function displayskw() {
  console.log(welcomeskw);
  console.log(chalk.hex('#ffb347')(`Fitur Autobot by SKW AIRDROP HUNTER`));
  console.log(chalk.hex('#90ee90')('1. Auto claim 12 jam sekali'));
  console.log(chalk.hex('#90ee90')('2. Kirim Status ke Telegram'));
}

module.exports = displayskw;
