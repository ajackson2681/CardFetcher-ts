import { Client, Message, GroupDMChannel, DMChannel, TextChannel } from "discord.js";
import * as strings from "./string-utils";
import * as scryfall from "./bot-utils";
import * as fs from "fs";
import * as keywords from "./keyword-parser";
import { log, chatLog } from "./logger";

/**
 * This function prints the help prompt.
 * 
 * @param channel Is the channel to print the help prompt to.
 */
function printHelp(channel: TextChannel | DMChannel | GroupDMChannel): void {
    channel.send(" These are the following commands I can perform:\n\n"
    + "[[cardname]] returns card information from gatherer, and also puts the card image "
    + "in the chat.\n\n" +

    "{{cardname}} returns card information from EDHREC, and also puts the card image in"
    + " the chat.\n\n" +

    "<<cardname>> returns card legality information.\n\n"+

    "((cardname)) returns card pricing from TCGPlayer, and also puts the card image in"
    + " the chat.\n\n" +

    "If you desire a specific set image, insert e:SET inside the brackets and after the"
    + " card name, using the 3 letter set code instead of the word SET.\n\n" +

    "!kw KEYWORD will return the keyword definition from the Comprehensive MTG Rulebook.\n\n" +

    "!roll <number> Rolls a random number from 1 to your chosen number.");
}

/**
 * This function generates a radom number between 1 and num (inclusive).
 * 
 * @param num is the maximum number possible to generate.
 * @param channel is the channel to output the result to.
 */
function rollRandomNumber(num: number, channel: TextChannel | DMChannel | GroupDMChannel): void {
    if(num == 0) {
        channel.send("You must specify a number greater than or equal to 2.");
        return;
    }

    let rand = 1 + Math.floor((Math.random()*num));

    channel.send("Roll: "+rand);
}

/**
 * This function parses the discord message and performs the relevant searches.
 * 
 * @param msg is the message from discord to parse.
 */
function parse(msg: Message): void {
    let cards: string[];
    let rawMsg = msg.content;

    log(msg.author.username+" made a card request for:");

    if (rawMsg.includes("[[") && rawMsg.includes("]]")) {
        cards = strings.substringsBetween("[[","]]", rawMsg);
        scryfall.searchQuery(cards, msg.channel, scryfall.SearchTargets.Gatherer);
    }
    
    if (rawMsg.includes("{{") && rawMsg.includes("}}")) {
        cards = strings.substringsBetween("{{", "}}", rawMsg);
        scryfall.searchQuery(cards, msg.channel, scryfall.SearchTargets.EDHRec);
    }

    if (rawMsg.includes("<<") && rawMsg.includes(">>")) {
        cards = strings.substringsBetween("<<", ">>", rawMsg);
        scryfall.searchQuery(cards, msg.channel, scryfall.SearchTargets.Legalities);
    }

    if(rawMsg.includes("((") && rawMsg.includes("))")) {
        cards = strings.substringsBetween("((", "))", rawMsg);
        scryfall.searchQuery(cards, msg.channel, scryfall.SearchTargets.Pricing)
    }
}

/**
 * This functions performs commands not related to retrieving card information.
 * 
 * @param msg is the message that contains the command.
 * @param channel is the channel to print information to. 
 */
function performCommand(message: Message, 
    channel: TextChannel | DMChannel | GroupDMChannel): void {
    const msg = message.content;

    let command = msg.substring(1, msg.indexOf(" ")) === "!" ? msg.substring(1) :
        msg.substring(1, msg.indexOf(" "));
    let parameter = msg.split(`!${command}`).pop();

    log(message.author.username + " peformed a command:");
    try {
        switch(command.toLowerCase()) {
            case "kw":
                log("Requested keyword rules for: "+parameter, true);
                let keyword = keywords.getRulesText(parameter);
                channel.send(keyword);
                break;
            case "help":
                log("Asked for help.", true);
                printHelp(channel);
                break;
            case "roll":
                log("Rolled a number.", true);
                let number = +parameter;
                rollRandomNumber(number, channel);
                break;
            default:
                break;
        }
    }
    catch(err) {
        channel.send("Incorrectly formatted command");
    }
}

// loads the token form client.json
const token = JSON.parse(fs.readFileSync("config/client.json").toString())["token"];

let client = new Client();

client.on("ready", () => {
    console.log("CardFetcher.js is ready to receive commands!");
});

client.on("message", (msg: Message) => {
    
    if(!msg.author.bot) {
        chatLog(msg.author.username+": "+msg.content);

        let rawMsg = msg.toString();
        
        if(rawMsg.startsWith("!")) {
            performCommand(msg, msg.channel);
        }
        else if(strings.hasPrefixSuffix(rawMsg)) {
            parse(msg);
        }
    }
});

client.login(token);