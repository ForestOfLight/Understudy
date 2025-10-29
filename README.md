![Understudy Logo](./understudy_logo_banner.png)

<div align="center">
  <p><b>Precise Control for Simulated Players</b></p>

[![GitHub Downloads](https://img.shields.io/github/downloads/ForestOfLight/Understudy/total?label=Github%20downloads&logo=github)](https://github.com/ForestOfLight/Understudy/releases/latest)
[![Curseforge Downloads](https://cf.way2muchnoise.eu/full_1093805_downloads.svg)](https://www.curseforge.com/minecraft-bedrock/addons/understudy)
[![Minecraft - Version](https://img.shields.io/badge/Minecraft-v1.21.120_(Bedrock)-brightgreen)](https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/bee7bd9061ab4085b1a26624c1f97e2c)](https://app.codacy.com/gh/ForestOfLight/Understudy/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Discord](https://badgen.net/discord/members/9KGche8fxm?icon=discord&label=Discord&list=what)](https://discord.gg/9KGche8fxm)
</div>

Understudy gives you complete control over simulated players in your Minecraft Bedrock world. Afk your farms, load areas, and more -- all through a set of powerful, intuitive commands!

> [!IMPORTANT]
> This addon is a **Canopy Extension**, which means **Canopy** must be installed in your world for it to work.
> [Download **Canopy** here!](https://github.com/ForestOfLight/Canopy)

## Usage

All commands are prefixed with `./`. The `./player` command can be abbreviated to `./p`. Do `./help` for more information.

**Usage: `./player <name> join`**  
Spawn a player with the given name at your current location in your current game mode.

**Usage: `./player <name> leave`**  
Remove the player with the given name. 

**Usage: `./player <name> rejoin`**  
Spawn a player with the given name at its last location, if it has one.

**Usage: `./player <name> tp`**  
Teleport the player with the given name to your current location.

**Usage: `./player <name> look [up/down/noth/south/east/west/block/entity/me/x y z/pitch yaw]`**  
Make the player with the given name look at the specified target. "up", "down", "north", "south", "east", "west" will make the player look in different cardinal directions. "block" and "entity" will make the player look at the block or entity you are looking at. "me" will make the player look at you. "x y z" will make the player look at the specified coordinates. "pitch yaw" will make the player look at the specified pitch and yaw (in degrees).

**Usage: `./player <name> move [forward/backward/left/right/block/entity/me/x y z]`**  
Make the player with the given name move in the specified direction or (navigate) to the specified location. "forward", "backward", "left", "right" will make the player move continuously relative to the direction they are facing. "block" and "entity" will make the player move towards the block or entity you are looking at. "me" will make the player move towards you. "x y z" will make the player move towards the specified coordinates. This uses Minecraft's normal pathfinding system, so the player won't be able to navigate very far very far at once.

**Usage: `./player <name> attack [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name attack. "once" will make the player attack once. "continuous" will make the player attack continuously. "interval" will make the player attack at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> interact [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name interact with the block they are looking at. "once" will make the player interact once. "continuous" will make the player interact continuously. "interval" will make the player interact at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> use [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name use the item they are holding. "once" will make the player use the item once. "continuous" will make the player use the item continuously. "interval" will make the player use the item at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> build [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name place a block at the block they are looking at. "once" will make the player place a block once. "continuous" will make the player place a block continuously. "interval" will make the player place a block at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> break [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name break the block they are looking at. "once" will make the player break the block once. "continuous" will make the player break the block continuously. "interval" will make the player break the block at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> drop [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name drop their selected item. "once" will make the player drop their selected item once. "continuous" will make the player drop their selected item continuously. "interval" will make the player drop their selected item at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage `./player <name> dropstack [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name drop their entire stack of the selected item. "once" will make the player drop their entire stack of the selected item once. "continuous" will make the player drop their entire stack of the selected item continuously. "interval" will make the player drop their entire stack of the selected item at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> dropall [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name drop all of their items. "once" will make the player drop all of their items once. "continuous" will make the player drop all of their items continuously. "interval" will make the player drop all of their items at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> jump [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name jump. "once" will make the player jump once. "continuous" will make the player jump continuously. "interval" will make the player attack at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> select <slotNumber>`**  
Make the player with the given name select the item in the specified slot.

**Usage: `./player <name> sprint`**  
Make the player with the given name sprint.

**Usage: `./player <name> unsprint`**  
Make the player with the given name stop sprinting.

**Usage: `./player <name> sneak`**  
Make the player with the given name sneak.

**Usage: `./player <name> unsneak`**  
Make the player with the given name stop sneaking.

**Usage: `./player <name> claimprojectiles [radius]`**  
Make the player with the given name become the owner of all projectiles within a 25 (or otherwise specified) block radius.

**Usage: `./player <name> stop`**  
Stop all actions the player with the given name is doing.

**Usage: `./player <name> swapheld`**  
Swaps the held item of the player with the given name with the item you are holding.

**Usage: `./player <name> inv`**  
Shows the inventory of the player with the given name in chat.

**Usage: `./player prefix <prefix/#none>`**  
Set a nametag prefix for all simulated players. Use `#none` to remove the prefix.

### Scriptevents

All commands can also be accessed through the vanilla `/scriptevent` command (which can be used in command blocks).

**Usage: `/scriptevent understudy:<command>`**  
Run the specified understudy command. For example, `/scriptevent understudy:player <name> join`.

### Global Rules

**Usage: `./canopy <ruleName> <true/false>`**

**simplayerRejoining**: Makes online SimPlayers rejoin when you leave and rejoin.  
**noSimplayerSaving**: Disables saving playerdata for SimPlayers. Improves performance but can destroy items.
