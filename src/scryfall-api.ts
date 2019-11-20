
import * as http from "https";
import { IncomingMessage } from "http";
import { TextChannel, DMChannel, GroupDMChannel, RichEmbed } from "discord.js";
import { levenshtein } from "underscore.string"
import { dateLog } from "./logger";

const endpoint = "https://api.scryfall.com/cards/search?q=";

/**
 * This interface represents an object returned from an HTTP get request. Since the data can be of
 * any format, 'any' is used as the type.
 */
interface HttpRequestData {
    [key: string]: any;
}

/**
 * This interface represents a card, with all the pertinent information for sending to a discord 
 * channel.
 */
interface CardObject {
    imageURL: string;
    informationURL: string;
    title: string;
    requestedCard: string;
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
    edhRecSearch: boolean): void {

    let resData: HttpRequestData;
    let encodedCard = encodeURI(card);

    http.get(endpoint+encodedCard, (incoming: IncomingMessage) => {
        let chunks = []

        incoming.on("data", (chunk) => {
            chunks.push(chunk);
        }).on("end", () => {
            resData = JSON.parse(chunks.join(""));

            try {
                const index = pickBest(card, resData.data);

                const cardName = resData.data[index].name;

                const isCommander = 
                    resData.data[index].type_line.includes("Legendary Creature") || 
                    resData.data[index].oracle_text.includes("can be your commander.");

                const multiverseId = resData.data[index].multiverse_ids[0];
                
                const imageURL = resData.data[index].image_uris.png;

                const informationURL = edhRecSearch ? 
                    edhRecUrl(cardName, isCommander) :
                    gathererUrl(multiverseId);

                const title = edhRecSearch ?
                    (isCommander ? cardName + " - EDHREC Commander Page" :
                        cardName + " - EDHREC Card Page") :
                    cardName + " - Gatherer Page";

                const messageData: CardObject = {
                    imageURL: imageURL,
                    informationURL: informationURL,
                    title: title,
                    requestedCard: card
                }
                dateLog(cardName);
                const message = format(messageData);
                channel.send(message);
            }
            catch(err) {
                channel.send("Unable to find the card as searched.");
            }
        });
    });
}

/**
 * This formats the gatherer url for returning information, and returns a relevant page URL.
 * 
 * @param multiverseId is the multiverse ID of the card specified.
 */
function gathererUrl(multiverseId: number): string {
    return "https://gatherer.wizards.com/pages/card/Details.aspx?multiverseid="+multiverseId;
}

/**
 * This formats the edhrec url for returning information, and returns a relevant page URL.
 * 
 * @param cardName Is the name of the card to format
 * @param commander determines if it's a valid commander, or if it's simply a card
 */
function edhRecUrl(cardName: string, commander: boolean): string {
    cardName = cardName.replace(new RegExp(",", "g"), "").replace(new RegExp("'", "g"),"");

    const endpoint = commander ? "https://edhrec.com/commanders/" :
        "https://edhrec.com/cards/";

    const encoded = cardName.toLowerCase().replace(new RegExp(" ", "g"), "-");

    return endpoint+encoded;
}

/**
 * This function formats the cardData into a RichEmbed message to be sent to a discord channel.
 * 
 * @param cardData Is the card data to format into a RichEmbed message.
 */
function format(cardData: CardObject): RichEmbed {
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
function pickBest(cardName: string, scryfallList: Array<unknown>): number {
    let min = Number.POSITIVE_INFINITY;
    let index = 0;
    
    for(let i = 0; i < scryfallList.length; i++) {
        if(levenshtein(cardName, scryfallList[i]["name"]) < min) {
            min = levenshtein(cardName, scryfallList[i]["name"]);
            index = i;
        }
    }

    return index;
}

/**
 * This function uses the Scryfall API to retrieve official rulings for the specified cards.
 * 
 * @param cards are the list of cards to search Gatherer for
 * @param channel is the channel to send the returned information to.
 */
export function searchGatherer(cards: string[], 
    channel: TextChannel | DMChannel | GroupDMChannel): void {

    for(const card of cards) {
        search(card, channel, false);
    }
}

/**
 * This function uses the Scryfall API to retrieve EDHREC information for the specified cards.
 * 
 * @param cards are the list of cards to search EDHREC for
 * @param channel is the channel to send the returned information to.
 */
export function searchEDHRec(cards: string[], 
    channel: TextChannel | DMChannel | GroupDMChannel): void {

    for(const card of cards) {
        search(card, channel, true);
    }
}
