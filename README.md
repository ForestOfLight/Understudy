<!-- ![Canopy Logo](./canopylogo_banner.jpg) -->

<!-- [![Curseforge Downloads](https://cf.way2muchnoise.eu/full_1062078_downloads.svg)](https://www.curseforge.com/minecraft-bedrock/addons/canopy) -->
[![GitHub Downloads](https://img.shields.io/github/downloads/ForestOfLight/Understudy/total?label=Github%20downloads&logo=github)](https://github.com/ForestOfLight/Understudy/releases/latest)
[![Discord](https://badgen.net/discord/members/9KGche8fxm?icon=discord&label=Discord&list=what)](https://discord.gg/9KGche8fxm)

# Understudy
Understudy is an addon for Minecraft Bedrock Edition that allows you to spawn and control simulated players. Simulated players are entities that can be controlled by commands, but otherwise act almost exactly like normal players.

> [!IMPORTANT]
> This addon is a **Canopy Extension**, which means **Canopy** must be installed in your world for it to work.

**Canopy** can be downloaded here: https://github.com/ForestOfLight/Canopy

## Usage
All commands are prefixed with `./`. The `./player` command can be abbreviated to `./p`. The player command is disabled until enabled with the `commandPlayer` rule. Do `./help` for more information.

**Usage: `./player <name> join`**  
Spawn a player with the given name at your current location in your current game mode.

**Usage: `./player <name> leave`**  
Remove the player with the given name. 

**Usage: `./player <name> rejoin`**  
Spawn a player with the given name at its last location, if it has one.

**Usage: `./player <name> tp`**  
Teleport the player with the given name to your current location.

**Usage: `./player <name> respawn`**  
Respawn the player with the given name.

**Usage: `./player <name> look [up/down/noth/south/east/west/block/entity/me/x y z/pitch yaw]`**  
Make the player with the given name look at the specified target. "up", "down", "north", "south", "east", "west" will make the player look in different cardinal directions. "block" and "entity" will make the player look at the block or entity you are looking at. "me" will make the player look at you. "x y z" will make the player look at the specified coordinates. "pitch yaw" will make the player look at the specified pitch and yaw (in degrees).

**Usage: `./player <name> move [forward/backward/left/right/block/entity/me/x y z]`**  
Make the player with the given name move in the specified direction or (navigate) to the specified location. "forward", "backward", "left", "right" will make the player move continuously relative to the direction they are facing. "block" and "entity" will make the player move towards the block or entity you are looking at. "me" will make the player move towards you. "x y z" will make the player move towards the specified coordinates. This uses Minecraft's normal pathfinding system, so the player won't be able to navigate very far very far at once.

**Usage: `./player <name> attack [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name attack. "once" will make the player attack once. "continuous" will make the player attack continuously. "interval" will make the player attack at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> interact [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name interact with the block they are looking at. "once" will make the player interact once. "continuous" will make the player interact continuously. "interval" will make the player interact at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> build [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name place a block at the block they are looking at. "once" will make the player place a block once. "continuous" will make the player place a block continuously. "interval" will make the player place a block at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> break [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name break the block they are looking at. "once" will make the player break the block once. "continuous" will make the player break the block continuously. "interval" will make the player break the block at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> drop [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name drop their selected item. "once" will make the player drop their selected item once. "continuous" will make the player drop their selected item continuously. "interval" will make the player drop their selected item at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage `./player <name> dropStack [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name drop their entire stack of the selected item. "once" will make the player drop their entire stack of the selected item once. "continuous" will make the player drop their entire stack of the selected item continuously. "interval" will make the player drop their entire stack of the selected item at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> dropAll [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name drop all of their items. "once" will make the player drop all of their items once. "continuous" will make the player drop all of their items continuously. "interval" will make the player drop all of their items at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> jump [once/continuous/interval] [intervalDuration]`**  
Make the player with the given name jump. "once" will make the player jump once. "continuous" will make the player jump continuously. "interval" will make the player attack at regular intervals specified by the last argument. If the last two arguments are not specified, "once" is assumed.

**Usage: `./player <name> select <slotNumber>`**  
Make the player with the given name select the item in the specified slot.

**Usage: `./player <name> sprint`**  
Make the player with the given name sprint.

**Usage: `./player <name> unsprint`**  
Make the player with the given name stop sprinting.

**Usage: `./player <name> claimprojectiles [radius]`**  
Make the player with the given name become the owner of all projectiles within a 25 block radius.

**Usage: `./player <name> stop`**  
Stop all actions the player with the given name is doing.

**Usage: `./player prefix <prefix/#none>`**
Set a nametag prefix for all simulated players. Use `#none` to remove the prefix.
