![Understudy Logo](./understudy_logo_banner.png)

<div align="center">
  <p><b>Precise Control for Simulated Players</b></p>

[![GitHub Downloads](https://img.shields.io/github/downloads/ForestOfLight/Understudy/total?label=Github%20downloads&logo=github)](https://github.com/ForestOfLight/Understudy/releases/latest)
[![Curseforge Downloads](https://cf.way2muchnoise.eu/full_1093805_downloads.svg)](https://www.curseforge.com/minecraft-bedrock/addons/understudy)
[![Minecraft - Version](https://img.shields.io/badge/Minecraft-v26.0_(Bedrock)-brightgreen)](https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/bee7bd9061ab4085b1a26624c1f97e2c)](https://app.codacy.com/gh/ForestOfLight/Understudy/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Discord](https://badgen.net/discord/members/9KGche8fxm?icon=discord&label=Discord&list=what)](https://discord.gg/9KGche8fxm)
</div>

Understudy gives you complete control over simulated players in your Minecraft Bedrock world. Afk your farms, load areas, and more -- all through a set of powerful, intuitive commands!

> [!IMPORTANT]
> This addon is a **Canopy Extension**, which means **Canopy** must be installed in your world for it to work.
> [Download **Canopy** here!](https://github.com/ForestOfLight/Canopy)

## Usage

### Commands

**Usage: `/player:join <playername: string>`**  
Spawn a player with the given name at your current location in your current game mode.

**Usage: `/player:leave <playername: string>`**  
Remove the player with the given name. 

**Usage: `/player:rejoin <playername: string>`**  
Spawn a player with the given name at its last location, if it has one.

**Usage: `/player:tp <playername: string>`**  
Teleport the player with the given name to your current location.

**Usage: `/player:look <playername: string> [lookOption: up/down/noth/south/east/west/block/entity/me/at] [x y z: location]`**  
Make the player with the given name look at the specified target.
- `up`, `down`, `north`, `south`, `east`, `west` will make the player look in different cardinal directions.
- `block` and `entity` will make the player look at the block or entity you are looking at.
- `me` will make the player look at you.
- `at \<x y z\>` will make the player look at the specified coordinates.

**Usage: `/player:move <playername: string> [moveOption: forward/backward/left/right/block/entity/me/to] [location: x y z]`**  
Make the player with the given name move in the specified direction or (navigate) to the specified location. This command uses Minecraft's normal pathfinding system, so the player won't be able to navigate very far very far at once.
- `forward`, `backward`, `left`, `right` will make the player move continuously relative to the direction they are facing.
- `block` and `entity` will make the player move towards the block or entity you are looking at.
- `me` will make the player move towards you.
- `to \<location: x y z\>` will make the player move towards the specified coordinates. 

**Usage: `/player:action <name: string> <action: attack/interact/use/build/break/drop/dropstack/dropall/jump> [timingOption: once/after/continuous/interval/stop] [ticks: int]`**  
Make the player with the given name perform the specified action. 

**Actions:**  
- `attack` will make the player attack the block or entity they are looking at.
- `interact` will make the player interact with the block or entity they are looking at.
- `use` will make the player use the item they are holding.
- `build` will make the player place a block from their inventory at the location they are looking at.
- `break` will make the player break the block they are looking at.
- `drop` will make the player drop one item from their hand.
- `dropstack` will make the player drop the entire stack of items from their hand.
- `dropall` will make the player drop their entire inventory.
- `jump` will make the player jump.

**Timing options:**  
If no timing option is specified, the player will perform the action once. 
- `once` will make the player perform the action once.
- `after` will make the player perform the action after a delay specified by the last argument.
- `continuous` will make the player perform the action continuously.
- `interval` will make the player perform the action at regular intervals specified by the last argument.
- `stop` will make the player stop performing the action.

**Usage: `/player:select <playername: string> <slotNumber: int>`**  
Make the player with the given name select the item in the specified hotbar slot.

**Usage: `/player:sprint <playername: string> <shouldSprint: boolean>`**  
Make the player with the given name sprint or stop sprinting.

**Usage: `/player:sneak <playername: string> <shouldSneak: boolean>`**  
Make the player with the given name sneak or stop sneaking.

**Usage: `/player:claimprojectiles <playername: string> [radius: int]`**  
Make the player with the given name become the owner of all projectiles within a block radius. If no radius is specified, it defaults to 25 blocks.

**Usage: `/player:stop <playername: string>`**  
Stop all actions the player with the given name is doing.

**Usage: `/player:swapheld <playername: string>`**  
Swaps the held item of the player with the given name with the item you are holding.

**Usage: `/player:inventory <playername: string>`**  
Shows the inventory of the player with the given name in chat.

**Usage: `/player:prefix <prefix: string>`**  
Set a nametag prefix for all simulated players. Use `-none` to remove the prefix.

### Rules

These rules can be toggled in **Canopy**.

- **`simplayerRejoining`**: Makes online SimPlayers rejoin when you leave and rejoin.  
- **`noSimplayerSaving`**: Disables saving playerdata for SimPlayers. Improves performance but causes SimPlayers to lose their inventory and location when they leave and rejoin.
