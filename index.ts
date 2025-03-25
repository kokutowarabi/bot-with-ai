import { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js'
import * as dotenv from 'dotenv'
dotenv.config()

// ------------------------------
// 1. 環境変数の読み込み
// ------------------------------
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!
const GUILD_ID = process.env.GUILD_ID!

if (!DISCORD_BOT_TOKEN) {
  throw new Error('DISCORD_BOT_TOKEN が設定されていません。')
}
if (!GUILD_ID) {
  throw new Error('GUILD_ID(サーバーID) が設定されていません。')
}

// ------------------------------
// 2. Botクライアントを初期化
// ------------------------------
// メッセージ内容を取得するには "MESSAGE CONTENT INTENT" が必須
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent // メッセージ内容を取得
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.Reaction] // 不足があれば適宜
})

// ------------------------------
// 3. スラッシュコマンドをデプロイする処理
// ------------------------------
// async function deployCommands() {
//   const commands = [
//     new SlashCommandBuilder()
//       .setName('analyze')
//       .setDescription('サーバー内のメッセージを取得して最も使われている単語を調べる')
//       // コマンドに引数を取りたい場合は .addStringOption(...) などを追加
//   ].map(cmd => cmd.toJSON())

//   const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN)

//   // ギルドコマンドとして登録(即時反映)
//   await rest.put(Routes.applicationGuildCommands(client.user!.id, GUILD_ID), {
//     body: commands
//   })

//   console.log('Slash command [/analyze] を登録しました。')
// }

// ------------------------------
// 4. Botが起動したら: スラッシュコマンドを登録
// ------------------------------
// client.once('ready', async () => {
//   console.log(`Bot started as ${client.user?.tag}`)

//   // スラッシュコマンドをデプロイ(ギルドに登録)
//   await deployCommands()
// })

// ------------------------------
// 5. /analyze コマンドが呼ばれた時の処理
// ------------------------------
client.on('interactionCreate', async (interaction) => {
  // コマンド以外(ボタンなど)は無視
  if (!interaction.isChatInputCommand()) return

  // analyzeコマンドの場合
  if (interaction.commandName === 'analyze') {
    // 処理に時間がかかりそうなので、まずは「ちょっと待ってね」的に応答（デフォルトはユーザーのみ見えるephemeral）
    await interaction.deferReply({ ephemeral: true })

    try {
      // ---- (1) 全テキストチャンネルのメッセージを取得 ----
      const guild = interaction.guild
      if (!guild) {
        await interaction.editReply('このコマンドはギルド内でのみ使用できます。')
        return
      }

      const fetchedMessages: string[] = []
      const channels = await guild.channels.fetch() // ギルド内の全チャンネル

      for (const [channelId, channel] of channels) {
        if (!channel || channel.type !== 0) continue // type===0 で TextChannel
        const textChannel = channel as TextChannel

        // 最新100件だけ取得（上限100件）
        // 大量取得したい場合はループで遡る実装が必要（レートリミット注意）
        const messages = await textChannel.messages.fetch({ limit: 100 })
        messages.forEach((msg) => {
          fetchedMessages.push(msg.content)
        })
      }

      // ---- (2) 単語集計 ----
      // Deepseekに送る場合はここでAPI呼び出しに差し替えてOK
      const mostUsedWord = findMostFrequentWord(fetchedMessages)

      // ---- (3) レスポンス編集 ----
      await interaction.editReply(`最も使われている単語は『${mostUsedWord}』です。`)
    } catch (err) {
      console.error(err)
      await interaction.editReply('エラーが発生しました。')
    }
  }
})

// ------------------------------
// 6. 実際にBotを起動
// ------------------------------
client.login(DISCORD_BOT_TOKEN)

// ========== 単語カウントの簡易関数 ==========
// 単語カウントから最頻出単語を返す関数例
function findMostFrequentWord(messages: string[]): string {
  const wordCountMap = new Map<string, number>()

  for (const content of messages) {
    // 記号を削除して空白で分割
    const words = content
      .replace(/[!-/:-@[-`{-~]/g, '')
      .split(/\s+/)
      .filter(Boolean)

    for (const word of words) {
      const lowerWord = word.toLowerCase()
      wordCountMap.set(lowerWord, (wordCountMap.get(lowerWord) ?? 0) + 1)
    }
  }

  let mostUsedWord = ''
  let maxCount = 0
  for (const [word, count] of wordCountMap.entries()) {
    if (count > maxCount) {
      maxCount = count
      mostUsedWord = word
    }
  }

  return mostUsedWord
}

