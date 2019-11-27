import * as fs from "fs";

/**
 * This interface represents the outline of a Date Object, used in the time stamps for the logs
 */
interface DateObj {
    date: string;
    time: string;
}

/**
 * This function logs a message to log/bot.log, optionally with a time stamp.
 * 
 * @param message is the message to log
 * @param useDate optional flag on whether or not to include a timestamp
 */
export function log(message: string, timeStamp?: boolean) {
    if(timeStamp) {
        const dateObj = generateTimeStamp();
        const timeStamp = `[${dateObj.date} ${dateObj.time}]`
        fs.appendFileSync("log/bot.log",`${timeStamp} - ${message}\n`);
    }
    else {
        fs.appendFileSync("log/bot.log", message+"\n");
    }
}

/**
 * This function logs chat messages to log/chat.log 
 * 
 * @param message is the message to log
 */
export function chatLog(message: string) {
    const dateObj = generateTimeStamp();
    const timeStamp = `[${dateObj.date} ${dateObj.time}]`
    fs.appendFileSync("log/chat.log", `${timeStamp} ${message}\n`);
}

/**
 * This function generates a timestamp and saves it to a DateObj
 */
function generateTimeStamp(): DateObj {
    const dateObj = new Date();
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString();
    return {
        date: date,
        time: time
    };
}