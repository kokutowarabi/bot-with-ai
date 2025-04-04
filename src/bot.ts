import { Client, GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';
import { handleAnalyzeCommand } from './commands/analyze';

dotenv.config();

const { DISCORD_BOT_TOKEN } = process.env;
if (!DISCORD_BOT_TOKEN) {
  throw new Error('DISCORD_BOT_TOKENが設定されていません。');
}

export function startBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.GuildMember,
      Partials.Reaction,
    ],
  });

  client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'analyze') {
      await handleAnalyzeCommand(interaction);
    }
  });

  client.login(DISCORD_BOT_TOKEN);
}
