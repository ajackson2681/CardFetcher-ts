
import * as http from "https";
import { IncomingMessage } from "http";
import { TextChannel, DMChannel, GroupDMChannel, RichEmbed } from "discord.js";
import { ScryfallCardObject } from "./scryfall-interface";

const distance = require("jaro-winkler");

const endpoint = "https://api.scryfall.com/cards/search?q=";

/**
 * This enum serves as a list of valid search targets, which allows
 * IntelliSense to auto-complete
 */
export enum SearchTargets {
    EDHRec = "edhrec",
    Gatherer = "gatherer",
    Pricing = "pricing",
    Legalities = "legalities"
}

/**
 * This interface represents the structure of the card to send to a message channel
 * through the use of RichEmbed.
 */
interface CardMessageObject {
    imageURL: string;
    informationURL: string;
    title: string;
}

/**
 * This function performs a search on the Scryfall RESTful API with the given card name, and returns
 * relevant information.
 * 
 * @param card Is the name of the card to search for on scryfall
 * @param channel Is the message channel to send the returned information to
 * @param edhRecSearch Boolean value to determine if the search should return edhrec information or official rulings.
 */
export function search(card: string, 
        channel: TextChannel | DMChannel | GroupDMChannel,
        searchLocation: string): void {

    let encodedCard = encodeURI(card);

    http.get(endpoint+encodedCard, (incoming: IncomingMessage) => {
        let chunks = []

        incoming.on("data", (chunk) => {
            chunks.push(chunk);
        }).on("end", () => {
                        
            const cardList: ScryfallCardObject[] = JSON.parse(chunks.join(""))["data"];

            try {
                const cardToSend = pickBest(card, cardList);
    
                switch(searchLocation) {
                    case "gatherer":
                        sendCard(channel, false, cardToSend);
                        break;
                    case "edhrec":
                        sendCard(channel, true, cardToSend);
                        break;
                    case "legalities":
                        sendLegalities(channel, cardToSend);
                        break;
                    case "pricing":
                        sendPricing(channel, cardToSend);
                        break;
                }
            }
            catch(err) {
                channel.send("Unable to find the card as searched.");
                console.log(err);
            }
        });
    });
}

/**
 * This function sends a list of legalities to the specified channel for the matched card.
 * 
 * @param channel is the channel to send the legality information to
 * @param matchedCard is the card to sesarch legalities for
 */
function sendLegalities(channel: TextChannel | DMChannel | GroupDMChannel, 
    matchedCard: ScryfallCardObject) {

    let legaityString: string = "";

    for(const key of Object.keys(matchedCard.legalities)) {
        const legal = (matchedCard.legalities[key] as string).replace(new RegExp("_", "g"), " ");
        legaityString += `${key}: ${legal}\n`;
    }

    let data = {
        title: `${matchedCard.name} - Legalities`,
        description: legaityString
    };

    channel.send(new RichEmbed(data));
}

/**
 * This function sends the matchedCard info to the specified channel, using either
 * information from edhrec or gatherer, depedning on if edhRecSearch is true/false.
 * 
 * @param channel is the channel to send the card information to
 * @param edhRecSearch specifies whether or not this is an EDHRec search
 * @param matchedCard is the card information to send to the channel.
 */
function sendCard(channel: TextChannel | DMChannel | GroupDMChannel,
        edhRecSearch: boolean, matchedCard: ScryfallCardObject) {

    const cardName = matchedCard.name;
    
    const imageURL = matchedCard.image_uris.png;

    const informationURL = edhRecSearch ? 
        matchedCard.related_uris.edhrec :
        matchedCard.related_uris.gatherer;

    const title = edhRecSearch ? cardName + " - EDHREC Page" :
        cardName + " - Gatherer Page";

    const messageData: CardMessageObject = {
        imageURL: imageURL,
        informationURL: informationURL,
        title: title
    }

    const message = format(messageData);
    channel.send(message);
}

/**
 * This function formats the cardData into a RichEmbed message to be sent to a discord channel.
 * 
 * @param cardData Is the card data to format into a RichEmbed message.
 */
function format(cardData: CardMessageObject): RichEmbed {
    const data = {
        title: cardData.title,
        url: cardData.informationURL,
        image: {
            url: cardData.imageURL
        }
    };
    
    return new RichEmbed(data);
}

/**
 * This function returns the 'best' match for the searched query, based on its Levenshtein distance.
 * 
 * @param cardName is the card name being checked for.
 * @param scryfallList is the list of cards returned from the GET request from the Scryfall API
 */
function pickBest(cardName: string,  scryfallList: ScryfallCardObject[]): ScryfallCardObject {

    let max = Number.NEGATIVE_INFINITY;
    let index = 0;

    scryfallList.forEach( (card, i) => {
        const num = distance(card.name.toLowerCase(), cardName.toLowerCase());
        if(num > max) {
            max = num;
            index = i;
        }
    });

    return scryfallList[index];
}

/**
 * This is a generalized version of the searchX functions that were previously used to reduce
 * code redundancy.
 * 
 * @param cards are the cards to search for
 * @param channel is the channel to send the relevant information to
 * @param target is the type of request being made. It's specified by the SearchTargets enum
 */
export function searchQuery(cards: string[], channel: TextChannel | DMChannel | GroupDMChannel, 
    target: string) {
        
    for(const card of cards) {
        search(card, channel, target);
    }
}

/**
 * This function sends the pricing information to the specified channel.
 * 
 * @param channel is the channel to send the pricing information to
 * @param card is the card to retrieve pricing information for
 */
function sendPricing(channel: TextChannel | DMChannel | GroupDMChannel, card: ScryfallCardObject) {
    let data = {
        title: `${card.name} - TCGPlayer pricing`,
        url: card.purchase_uris.tcgplayer,
        image: {
            url: card.image_uris.png
        }
    }

    channel.send(new RichEmbed(data));
}