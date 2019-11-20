import * as fs from "fs";

export function log(message: string) {
    fs.appendFileSync("log/bot.log", message+"\n");
}

export function dateLog(message: string) {
    const dateObj = new Date();
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString();
    const timeStamp = `[${date} ${time}]`
    fs.appendFileSync("log/bot.log",`${timeStamp} - ${message}`);
}

export function chatLog(message: string) {
    const dateObj = new Date();
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString();
    const timeStamp = `[${date} ${time}]`
    fs.appendFileSync("log/chat.log", `${timeStamp} ${message}\n`);
}