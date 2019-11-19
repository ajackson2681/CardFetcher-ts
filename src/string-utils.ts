/**
 * This searches through a string and returns the first substring found between the prefix and
 * suffix. Returns "NONE" if none is found.
 * 
 * @param prefix is the beginning of the desired substring
 * @param suffix is the escape character of the desired substring
 * @param msg is the string to search through
 */
export function substringBetween(prefix: string, suffix: string, msg: string): string {
    if(msg.indexOf(prefix) !== -1 && msg.indexOf(suffix) !== -1) {
        return msg.substring(msg.indexOf(prefix)+prefix.length, msg.indexOf(suffix));
    }

    return "NONE";
}

/**
 * This searches through a string and returns all the substrings found between the prefix and
 * suffix. Returns an empty array if none are found.
 * 
 * @param prefix is the beginning of the desired substrings
 * @param suffix is the escape character of the desired substrings
 * @param msg is the string to search through
 */
export function substringsBetween(prefix: string, suffix: string, msg: string): string[] {
    let cards: string[] = [];
    
    while(msg.indexOf(prefix) !== -1 && msg.indexOf(suffix) !== -1) {
        const currentCard = msg.substring(msg.indexOf(prefix)+prefix.length, msg.indexOf(suffix));
        const remove = prefix+currentCard+suffix;
        msg = msg.split(remove).pop();
        cards.push(currentCard);
    }
    
    return cards;
}

/**
 * Returns true if the msg has the proper beginning and endings to find a substring in.
 * 
 * @param msg is the message to check if there is a proper prefix/suffix in it
 */
export function hasPrefixSuffix(msg: string): boolean {
    let hasPrefix = msg.includes("[[") || msg.includes("{{") || msg.includes("<<") ? true : false;
    let hasSuffix = msg.includes("]]") || msg.includes("}}") || msg.includes(">>") ? true : false;
    return (hasSuffix && hasPrefix);
}
