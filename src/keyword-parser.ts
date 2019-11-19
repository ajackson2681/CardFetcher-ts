import * as file from "fs";
import { levenshtein } from "underscore.string";
const keywords = JSON.parse(file.readFileSync("config/keywords.json").toString());

/**
 * This function returns the rules text for a specified rule.
 * 
 * @param query is the rule to search for.
 */
export function getRulesText(query: string): string {
    if(query === "") {
        return "You must input a valid keyword.";
    }
    
    return keywords[query] ? keywords[query] : closestMatch(query);
}

/**
 * This function attempts to retrieve the rules text from the keywords.json file.
 * If it fails, it attempts to find the closest match to the query based on the
 * query's Levensthein distance. If that fails, simply returns that the keyword
 * could not be found.
 * 
 * @param query is the rule to retrieve.
 */
function closestMatch(query: string): string {
    for(const key of Object.keys(keywords)) {
        if(levenshtein(key, query) <= 4) {
            return keywords[key];
        }
    }
    
    return `Keyword '${query}' not found`;
}