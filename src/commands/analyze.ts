import { ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { saveMessages, getAllMessages } from '../utils/supabaseClient';
import { analyzeMessages } from '../utils/kuromoji';
import { proposeEvent } from '../utils/useEventProposal';

export async function handleAnalyzeCommand(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply('このコマンドはギルド内でのみ使用できます。');
      return;
    }

    const messagesToStore: { id: string; content: string; channel_id: string }[] = [];
    const channels = await guild.channels.fetch();

    for (const [, channel] of channels) {
      if (!channel || channel.type !== 0) continue; // TextChannelのみ
      const textChannel = channel as TextChannel;

      const messages = await textChannel.messages.fetch({ limit: 100 });
      messages.forEach((msg) => {
        messagesToStore.push({
          id: msg.id,
          content: msg.content,
          channel_id: textChannel.id,
        });
      });
    }


    // Supabaseにメッセージを保存（既存メッセージはアップサート）
    await saveMessages(messagesToStore);

    // 保存済みの全メッセージをDBから取得
    const storedMessages = await getAllMessages();
    // ここでは内容だけを抽出
    const allMessageTexts = storedMessages.map((msg) => msg.content);

    // kuromoji.jsを使って形態素解析し、重要なキーワードを抽出
    const extractedKeywords = await analyzeMessages(allMessageTexts);

    // 抽出したキーワードをもとにイベント提案を生成
    const eventProposal = await proposeEvent(extractedKeywords);

    await interaction.editReply(`イベント提案:\n${eventProposal}`);
  } catch (error) {
    console.error(error);
    await interaction.editReply('エラーが発生しました。');
  }
}