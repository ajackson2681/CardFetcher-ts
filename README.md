# MTG Card Fetcher Discord Bot

## Requirements
* Node.js
* Node Package Manager
* A discord application with a valid token, the outline for this is specified here: https://discordapp.com/developers/applications/

## Configuration
1) Rename "client-template.json" in the src/config folder to "client.json".  
2) Add your key from your discord app in where it says \<INSERT TOKEN HERE\>

## Build
1) Download this repo  
2) Navigate to the root of this repo  
3) Open a command prompt/terminal window and execute `npm run build`  
5) execute `npm start`  

## Usage

This bot uses Scryfall syntax, which can be found here: https://scryfall.com/docs/syntax

To get a list of bot commands, type !help in the chat box and the bot will return a list of all valid commands.  
To serach for a card to get the gatherer information wrap your search inquiry like so: [[\<CARDNAME\> \<additional syntax\>]].  
To serach for a card to get the EDHRec information wrap your search inquiry like so: {{\<CARDNAME\>}}. Additional syntax is not used for this option.  