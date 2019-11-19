import * as fs from "fs";

export function log(message: string) {
    fs.appendFileSync("log/bot.log", message+"\n");
}

export function dateLog(message: string) {
    fs.appendFileSync("log/bot.log", "["+new Date().toLocaleTimeString()+"] "+message+"\n");
}

export function chatLog(message: string) {
    fs.appendFileSync("log/chat.log", "["+new Date().toLocaleTimeString()+"] "+message+"\n");
}