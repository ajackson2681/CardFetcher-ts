
import * as http from "https";
import { IncomingMessage } from "http";
import { TextChannel, DMChannel, GroupDMChannel, RichEmbed } from "discord.js";
import { levenshtein } from "underscore.string"
import { dateLog } from "./logger";
const distance = require("jaro-winkler");

const endpoint = "https://api.scryfall.com/cards/search?q=";

export enum SearchTargets {
    EDHRec = "edhrec",
    Gatherer = "gatherer",
    Pricing = "pricing",
    Legalities = "legalities"
}

/**
 * This interface serves as the structure for the card information returned from
 * the Scryfall API.
 */
interface ScryfallCardObject {
    object: string;
    id: string;
    oracle_id: string;
    multiverse_ids: number[];
    mtgo_id: number;
    mtgo_foil_id: number;
    tcgplayer_id: number;
    name: string;
    lang: string;
    uri: string;
    scryfall_uri: string;
    layout: string;
    highres_image: boolean;
    image_uris: {
        small: string;
        nomral: string;
        large: string;
        png: string;
        art_crop: string;
        border_crop: string;
    };
    mana_cost: string;
    cmc: number;
    type_line: string;
    oracle_text: string;
    colors: string[];
    color_identity: string[];
    legalities: {
        standard: string;
        future: string;
        historic: string;
        pioneer: string;
        modern: string;
        legacy: string;
        pauper: string;
        vintage: string;
        penny: string;
        commander: string;
        brawl: string;
        duel: string;
        oldschool: string;
    };
    games: string[];
    reserved: boolean;
    foil: boolean;
    nonfoil: boolean;
    oversized: boolean;
    promo: boolean;
    reprint: boolean;
    variation: boolean;
    set: string;
    set_name: string;
    set_type: string;
    set_uri: string;
    scryfall_set_uri: string;
    rulings_uri: string;
    prints_search_uri: string;
    collector_number: string;
    digital: boolean;
    rarity: string;
    watermark: string;
    flavor_text: string;
    card_back_id: string;
    artist: string;
    artist_ids: string[];
    illustration_id: string;
    border_color: string;
    frame: string;
    full_art: boolean;
    textless: boolean;
    booster: boolean;
    story_spotlight: boolean;
    edhrec_rank: number;
    prices: {
        usd: string;
        usd_foil: string;
        eur: string;
        tix: string;
    };
    related_uris: {
        gatherer: string;
        tcgplayer_decks: string;
        edhrec: string;
        mtgtop8: string;
    };
    purchase_uris: {
        tcgplayer: string;
        cardmarket: string;
        cardhoarder: string;
    };
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
                const index = pickBest(card, cardList);

                switch(searchLocation) {
                    case "gatherer":
                        sendCard(channel, false, cardList[index]);
                        break;
                    case "edhrec":
                        sendCard(channel, true, cardList[index]);
                        break;
                    case "legalities":
                        sendLegalities(channel, cardList[index]);
                        break;
                    case "pricing":
                        sendPricing(channel, cardList[index]);
                        break;
                }

                dateLog(cardList[index].name);
            }
            catch(err) {
                channel.send("Unable to find the card as searched.");
                console.log(err);
            }
        });
    });
}

function sendLegalities(channel: TextChannel | DMChannel | GroupDMChannel, matchedCard: ScryfallCardObject) {

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

    dateLog(cardName);
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
function pickBest(cardName: string,  scryfallList: ScryfallCardObject[]): number {

    let min = Number.POSITIVE_INFINITY;
    let index = 0;
    let filteredList: ScryfallCardObject[] = [];

    for(const card of scryfallList) {
        const num = distance(card.name.toLowerCase(), cardName.toLowerCase());
        if(num > .8) {
            filteredList.push(card);
        }
    }

    for(let i = 0; i < filteredList.length; i++) {
        const levDist = levenshtein(cardName.toLowerCase(), filteredList[i].name.toLowerCase());
        if(levDist < min) {
            min = levDist;
            index = i;
        }
    }

    return scryfallList.indexOf(filteredList[index]);
}

/**
 * This is a generalized version of the searchX functions that were previously used to reduce
 * code redundancy.
 * 
 * @param cards are the cards to search for
 * @param channel is the channel to send the relevant information to
 * @param target is the type of request being made. It's specified by the SearchTargets enum
 */
export function searchQuery(cards: string[], channel: TextChannel | DMChannel | GroupDMChannel, target: string) {
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