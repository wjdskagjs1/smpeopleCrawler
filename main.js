const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json'));
const help = fs.readFileSync('./README.md');

const axios = require("axios");
const cheerio = require("cheerio");

const setting = JSON.parse(fs.readFileSync('./setting.json'));

const getHtml = async () => {
  try {
    return await axios.get(`https://smpeople.net/${setting.boardType}`);
  } catch (error) {
    console.error(error);
  }
};
client.on('ready', ()=>{
    console.log(`Logged in as ${client.user.tag}!`);
    client.setInterval(()=>{
        const channel = client.channels.cache.find(c => c.name === '봇-명령어');
        channel.send('>갱신');
    }, setting.interval);
});

client.on('message', async function (msg) {
    const guildName = msg.guild.name;
    const reload = ()=>{
        getHtml()
        .then(async html => {
          let ulList = [];
          const $ = cheerio.load(html.data);
          const $bodyList = $('tbody').children('tr');

          await $bodyList.each(function(i, elem) {
            if(setting.guild[guildName] === undefined){
                setting.guild[guildName] = 0;
            }
              if(setting.guild[guildName] < parseInt($(elem).find('td.no').text())){
                  ulList.push($(elem).find('td.title a').attr('href'));
                  setting.guild[guildName] = parseInt($(elem).find('td.no').text());
              }
          });
          await fs.writeFile('./setting.json', JSON.stringify(setting), (err) => {
            if (err) throw err;
          });
          return ulList.reverse();
        })
        .then(res => {
            res.forEach((element)=>{
                const channel = client.channels.cache.find(c => c.name === setting.channelName);
                channel.send(`https://smpeople.net${element}`);
            });
        });
        
    };
    if(msg.content === ">도움말"){
        let str = "\`\`\`"+help+"\`\`\`";
        msg.channel.send(str);
    }
    if(msg.content === ">갱신"){
        await reload();
        msg.channel.send(`${setting.channelName}이 갱신되었습니다.`);
    }
});

client.login(config.token);