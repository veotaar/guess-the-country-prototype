import { Client, IntentsBitField, Partials } from "discord.js";
import { getCountryCodeFromShortGoogleUrl } from "./lib/utils.js";

const gameChannelId = process.env.CHANNEL_ID;

let activeGame = null;

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message]
});

client.login(process.env.TOKEN);

const startGame = async (msg, googleMapsLink) => {
  if(activeGame) {
    msg.reply('There is an ongoing game. Wait for the game to finish.')
    return;
  }

  try {
    const countryCode = await getCountryCodeFromShortGoogleUrl(googleMapsLink);
    activeGame = {
      userId: msg.author.id,
      startedBy: msg.author.globalName,
      countryCode,
      googleMapsLink,
      attachmentLink: null,
      winner: null,
      guesses: [],
      guessCount: 0
    }
    msg.reply(`You have started a game! Please send an image of ${countryCode} within 60 seconds.`);
    setTimeout(() => {
      if (activeGame && activeGame.userId === msg.author.id && !activeGame.attachmentLink) {
        activeGame = null;
        msg.reply('The time to send an image has expired.');
      }
    }, 60000);
  } catch (e) {
    msg.reply("Invalid google maps link. Terminating your game...");
    activeGame = null;
  }
}

const postImg = async (msg) => {
  const attachment = msg.attachments.first();

  if(activeGame.attachmentLink) {
    msg.reply('Game is running and already has an image.');
    return;
  }

  if(!attachment || !attachment.height) {
    msg.reply('Please post a valid image.');
    return;
  }

  activeGame.attachmentLink = attachment.url;

  const channel = client.channels.cache.get(gameChannelId);

  if(!channel) return;

  await channel.send(attachment.url);
  await channel.send('Game started! Make your guesses with !t XX');
}

const handleDm = async (msg) => {

  if(msg.author.bot) return;

  const content = msg.content;

  if (activeGame && activeGame.userId === msg.author.id && msg.attachments.size > 0) {
    await postImg(msg)
    return;
  }

  if(activeGame) {
    msg.reply('There is an ongoing game. Wait for the game to finish.')
    return;
  }

  if(content.startsWith('!new')) {
    startGame(msg, content.split(' ')[1])
    return;
  }

  msg.reply('ERROR: unknown command');
}

const handleGuess = async (msg) => {
  if(!msg.content.startsWith('!t')) return;
  if(!activeGame) return;
  if(activeGame.winner) return;

  // !t XX, there is an active game, there is no winner yet
  const guess = msg.content.split(' ')[1].toUpperCase();

  if(guess === activeGame.countryCode) {
    activeGame.winner = msg.author.globalName;
    await msg.react('✅');
    msg.channel.send(`Congratulations, ${msg.author.globalName}! You guessed the country correctly.`);
    msg.channel.send(`Location: ${activeGame.googleMapsLink}`);

    activeGame = null;
  } else {
    await msg.react('❌');
  }
}

client.on('ready', (client) => {
  console.log(`${client.user.tag} is ready!`);
});

client.on('messageCreate', async (msg) => {
  if(!msg.guildId) {
    console.log('dm received!');
    await handleDm(msg);
    return;
  }

  if(msg.channel.id === gameChannelId) {
    await handleGuess(msg);
    return;
  }
}
);


// const shortUrl = "https://maps.app.goo.gl/2LTomyuzLUiCJrbC9";

// getCountryCodeFromShortGoogleUrl(shortUrl);