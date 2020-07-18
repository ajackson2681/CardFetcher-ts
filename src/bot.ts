import { Client, Message } from "discord.js";
import * as fs from "fs";
import { printHelp, searchForCards } from "./bot-utils";

const client = new Client();

const token = JSON.parse(fs.readFileSync("config/client.json").toString())["token"];

client.on("ready", () => {
    console.log("CardFetcher.js 2.0 is ready to receive commands!");
});

client.on("message", (msg: Message) => {

    if (!msg.author.bot) {

        if (msg.toString().startsWith("!help")) {
            printHelp(msg.channel);
        }
        else {
            searchForCards(msg);
        }
    }

});

client.on("error", (err: Error) => {
    // don't crash
});

client.login(token);