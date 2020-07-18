import { Message, Channel, RichEmbed, GroupDMChannel, DMChannel, TextChannel } from "discord.js";
import * as fetch from "node-fetch";
import { ScryfallCardObject } from "./scryfall-interface";
const distance = require("jaro-winkler");

type DiscordChannel = TextChannel | DMChannel | GroupDMChannel;

const scryfallEndpoint = "https://api.scryfall.com/cards/search?q=";
const edhrecRegex = new RegExp(/(?<=\{\{)(.*?)(?=\}\})/g);
const gathererRegex = new RegExp(/(?<=\[\[)(.*?)(?=\]\])/g);
const legalityRegex = new RegExp(/(?<=\<\<)(.*?)(?=\>\>)/g);
const pricingRegex = new RegExp(/(?<=\(\()(.*?)(?=\)\))/g);

function sendPricingInfo(card: ScryfallCardObject, channel: DiscordChannel): void {
    let data = {
        title: `${card.name} - TCGPlayer pricing`,
        url: card.purchase_uris.tcgplayer,
        image: {
            url: card.image_uris.png
        }
    }

    channel.send(new RichEmbed(data));
}

function sendLegalityInfo(card: ScryfallCardObject, channel: DiscordChannel): void {

    let legaityString: string = "";

    for(const key of Object.keys(card.legalities)) {
        const legal = (card.legalities[key] as string).replace(new RegExp("_", "g"), " ");
        legaityString += `${key}: ${legal}\n`;
    }

    let data = {
        title: `${card.name} - Legalities`,
        description: legaityString
    };

    channel.send(new RichEmbed(data));
}

function sendGathererInfo(card: ScryfallCardObject, channel: DiscordChannel): void {
    const data = {
        title: `${card.name} - Gatherer Page`,
        url: card.related_uris.gatherer,
        image: {
            url: card.image_uris.png
        }
    }

    const message = new RichEmbed(data);

    channel.send(message);
}

function sendEdhrecInfo(card: ScryfallCardObject, channel: DiscordChannel): void {
    const data = {
        title: `${card.name} - EDHREC Page`,
        url: card.related_uris.edhrec,
        image: {
            url: card.image_uris.png
        }
    }

    const message = new RichEmbed(data);

    channel.send(message);
}

function pickBest(cardName: string, cardList: ScryfallCardObject[]): ScryfallCardObject {

    let max = Number.NEGATIVE_INFINITY;
    let index = 0;

    cardList.forEach( (card, i) => {
        const num = distance(card.name.toLowerCase(), cardName.toLowerCase());
        if(num > max) {
            max = num;
            index = i;
        }
    });

    return cardList[index];
}

function fetchAndReturn(card: string, channel: DiscordChannel, mode: number) {
    const encoded = encodeURI(card);
    
    fetch(scryfallEndpoint+encoded).then( (response) => response.json()).then( (scryfallResponse) => {
        const cardList = scryfallResponse.data;
        
        if (cardList != null) {
            const cardToSend = pickBest(card, cardList);

            switch (mode) {
                case 1:
                    sendEdhrecInfo(cardToSend, channel);
                    break;
                case 2:
                    sendGathererInfo(cardToSend, channel);
                    break;
                case 3:
                    sendLegalityInfo(cardToSend, channel);
                    break;
                case 4:
                    sendPricingInfo(cardToSend, channel);
                    break;
            }
        }
        else {
            channel.send(`Unable to retrieve information for "${card}"`);
        }
    });
}

export function printHelp(channel: DiscordChannel): void {
    channel.send(" These are the following commands I can perform:\n\n"
    + "[[cardname]] returns card information from gatherer, and also puts the card image "
    + "in the chat.\n\n" +

    "{{cardname}} returns card information from EDHREC, and also puts the card image in"
    + " the chat.\n\n" +

    "<<cardname>> returns card format legality information.\n\n"+

    "((cardname)) returns card pricing from TCGPlayer, and also puts the card image in"
    + " the chat.\n\n" +

    "If you desire a specific set image, insert e:SET inside the brackets and after the"
    + " card name, using the 3 letter set code instead of the word SET. Other syntax rules"
    + " can be found at https://scryfall.com/docs/syntax.");
}

export function searchForCards(message: Message): void {
    const edhrecCards = message.toString().match(edhrecRegex);
    if (edhrecCards) {
        edhrecCards.forEach( (card) => {
        fetchAndReturn(card, message.channel, 1); 
        });
    }

    const gathererCards = message.toString().match(gathererRegex);
    if (gathererCards) {
        gathererCards.forEach( (card) => {
            fetchAndReturn(card, message.channel, 2);
        });
    }

    const legalityCards = message.toString().match(legalityRegex);
    if (legalityCards) {
        legalityCards.forEach( (card) => {
            fetchAndReturn(card, message.channel, 3);
        });
    }

    const pricingCards = message.toString().match(pricingRegex);
    if (pricingCards) {
        pricingCards.forEach( (card) => {
            fetchAndReturn(card, message.channel, 4);
        })
    }
}