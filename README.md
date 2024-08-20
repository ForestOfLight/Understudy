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

**Usage: `./player <name> look [block/entity/me/x y z]`**  
Make the player with the given name look at the specified target. "block" and "entity" will make the player look at the block or entity you are looking at. "me" will make the player look at you. "x y z" will make the player look at the specified coordinates.
