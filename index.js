const Discord = require('discord.js');

const client = new Discord.Client({
    intents: [
        Object.keys(Discord.GatewayIntentBits)
    ],
});

const fs = require('fs');

client.SlashCommands = new Discord.Collection();
fs.readdirSync("./handlers").forEach(handler => {
    require(`./handlers/${handler}`)(client);
});
module.exports.Client = client;


const ServerSettings = require('./Database/models/welcomeSettings');

client.on('guildMemberAdd', async (member) => {
    try {
        const serverSettings = await ServerSettings.findOne({ guildId: member.guild.id });

        if (serverSettings && serverSettings.welcomeChannel && serverSettings.isCodeEnabled) {
            const welcomeChannel = await client.channels.fetch(serverSettings.welcomeChannel);

            if (welcomeChannel && welcomeChannel.permissionsFor(client.user).has('SEND_MESSAGES')) {





                        // Update the welcome message to include the invite count
                        const welcomeMessage = serverSettings.welcomeMessage
                            .replace('[username]', member.user.username)
                            .replace('[user]', member.toString())
                            .replace('[server]', member.guild.name)
                            .replace('[memberCount]', member.guild.memberCount.toString())

                        welcomeChannel.send(welcomeMessage);
                    
                
            }
        }
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
});






client.on('guildMemberRemove', async (member) => {
    try {
        const serverSettings = await ServerSettings.findOne({ guildId: member.guild.id });

        if (serverSettings && serverSettings.leaveChannel && serverSettings.isCodeEnabledLeave) {
            const leaveChannel = await client.channels.fetch(serverSettings.leaveChannel);

            if (leaveChannel && leaveChannel.permissionsFor(client.user).has('SEND_MESSAGES')) {
                const leaveMessage = serverSettings.leaveMessage
                    .replace('[username]', member.user.username)
                    .replace('[user]', member.toString())
                    .replace('[server]', member.guild.name)
                    .replace('[memberCount]', member.guild.memberCount.toString());

                leaveChannel.send(leaveMessage);
            }
        }
    } catch (error) {
        console.error('Error sending leave message:', error);
    }
});





const AutoRoleModel = require('./Database/models/AutoRole');

client.on('guildMemberAdd', async (member) => {
    try {
        // Assuming you store the guild ID in your AutoRoleModel
        const guildId = member.guild.id;

        // Retrieve AutoRole data for the guild
        const autoRoleData = await AutoRoleModel.findOne({ guildId });

        if (autoRoleData && autoRoleData.isCodeEnabled && autoRoleData.selectedRole) {
            const roleId = autoRoleData.selectedRole;

            // Check if the role exists in the guild
            const role = member.guild.roles.cache.get(roleId);

            if (role) {
                // Check if the member is not the bot
                if (member.user.bot) {
                    console.log(`Bot joined, skipping role assignment`);
                } else {
                    // Assign the role to the new member
                    await member.roles.add(role);
                    console.log(`Assigned role ${role.name} to ${member.user.tag}`);
                }
            } else {
                console.error(`Role with ID ${roleId} not found in the guild`);
            }
        } else {
            console.log(`Role assignment is not enabled or selected role is not specified.`);
        }
    } catch (error) {
        console.error('Error assigning auto role:', error);
    }
});




client.on('guildMemberAdd', async (member) => {
  try {
      // Check if the added member is the bot itself
      if (member.user.bot) {
          // Assuming you store the guild ID in your AutoRoleModel
          const guildId = member.guild.id;

          // Retrieve AutoRole data for the guild
          const autoRoleData = await AutoRoleModel.findOne({ guildId });

          if (autoRoleData && autoRoleData.isCodeEnabled && autoRoleData.selectedRole2) {
              const roleId = autoRoleData.selectedRole2;

              const role = member.guild.roles.cache.get(roleId);

              if (role) {
                  await member.roles.add(role);
                  console.log(`Assigned role ${role.name} to the bot (${member.user.tag})`);
              } else {
                  console.error(`Role with ID ${roleId} not found in the guild`);
              }
          } else {
              console.log(`Role assignment is not enabled or Selected Role 2 is not specified for the bot.`);
          }
      }
  } catch (error) {
      console.error('Error assigning role to the bot:', error);
  }
});


//Dashboard
const server = require('./server');

client.login('TOken');