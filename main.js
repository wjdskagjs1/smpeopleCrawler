const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json'));

const axios = require("axios");
const cheerio = require("cheerio");
const log = console.log;
let before = 75;

const setting = {
    interval: 60*60*1000,
    boardType: 'hobby_program',
    channelName: '프로그래밍-게시판'
};

const getHtml = async () => {
  try {
    return await axios.get(`https://smpeople.net/${setting.boardType}`);
  } catch (error) {
    console.error(error);
  }
};
const reload = ()=>{
    getHtml()
    .then(html => {
      let ulList = [];
      const $ = cheerio.load(html.data);
      const $bodyList = $('tbody').children('tr');
      
      $bodyList.each(function(i, elem) {
          if(before < parseInt($(elem).find('td.no').text())){
              ulList.push($(elem).find('td.title a').attr('href'));
              before = before + 1;
          }
      });
      return ulList;
    })
    .then(res => {
        log("리스트:",res," 이전 번호:", before);
        res.forEach((element)=>{
            const channel = client.channels.cache.find(c => c.name === setting.channelName);
            channel.send(`https://smpeople.net${element}`);
        });
    });
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
client.setInterval(()=>{
    reload();
}, setting.interval);//end client

client.on('message', async (msg) => {
    if(msg.content === "/갱신"){
        await reload();
        msg.channel.send(`${setting.channelName}이 갱신되었습니다.`);
    }
    if(msg.content.startsWith("/interval")){
        const arr = msg.content.split(' ');
        setting.interval = eval(arr[1]);
    }
    if(msg.content.startsWith("/boardType")){
        const arr = msg.content.split(' ');
        setting.boardType = arr[1];
    }
    if(msg.content.startsWith("/channelName")){
        const arr = msg.content.split(' ');
        setting.channelName = arr[1];
    }
});

client.login(config.token);