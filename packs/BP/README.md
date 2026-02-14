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

**Usage: `/simplayer:join <playername: string>`**  
Spawn a simulated player with the given name at your current location in your current game mode.

**Usage: `/simplayer:leave <playername: string>`**  
Remove the simulated player with the given name. 

**Usage: `/simplayer:rejoin <playername: string>`**  
Spawn a simulated player with the given name at its last location, if it has one.

**Usage: `/simplayer:tp <playername: string>`**  
Teleport the simulated player with the given name to your current location.

**Usage: `/simplayer:look <playername: string> [lookOption: up/down/noth/south/east/west/block/entity/me/at] [x y z: location]`**  
Make the simulated player with the given name look at the specified target.
- `up`, `down`, `north`, `south`, `east`, `west` will make the simulated player look in different cardinal directions.
- `block` and `entity` will make the simulated player look at the block or entity you are looking at.
- `me` will make the simulated player look at you.
- `at \<x y z\>` will make the simulated player look at the specified coordinates.

**Usage: `/simplayer:move <playername: string> [moveOption: forward/backward/left/right/block/entity/me/to] [location: x y z]`**  
Make the simulated player with the given name move in the specified direction or (navigate) to the specified location. This command uses Minecraft's normal pathfinding system, so the simulated player won't be able to navigate very far very far at once.
- `forward`, `backward`, `left`, `right` will make the simulated player move continuously relative to the direction they are facing.
- `block` and `entity` will make the simulated player move towards the block or entity you are looking at.
- `me` will make the simulated player move towards you.
- `to \<location: x y z\>` will make the simulated player move towards the specified coordinates. 

**Usage: `/simplayer:action <name: string> <action: attack/interact/use/build/break/drop/dropstack/dropall/jump> [timingOption: once/after/continuous/interval/stop] [ticks: int]`**  
Make the simulated player with the given name perform the specified action. 

**Actions:**  
- `attack` will make the simulated player attack the block or entity they are looking at.
- `interact` will make the simulated player interact with the block or entity they are looking at.
- `use` will make the simulated player use the item they are holding.
- `build` will make the simulated player place a block from their inventory at the location they are looking at.
- `break` will make the simulated player break the block they are looking at.
- `drop` will make the simulated player drop one item from their hand.
- `dropstack` will make the simulated player drop the entire stack of items from their hand.
- `dropall` will make the simulated player drop their entire inventory.
- `jump` will make the simulated player jump.

**Timing options:**  
If no timing option is specified, the simulated player will perform the action once. 
- `once` will make the simulated player perform the action once.
- `after` will make the simulated player perform the action after a delay specified by the last argument.
- `continuous` will make the simulated player perform the action continuously.
- `interval` will make the simulated player perform the action at regular intervals specified by the last argument.
- `stop` will make the simulated player stop performing the action.

**Usage: `/simplayer:select <playername: string> <slotNumber: int>`**  
Make the simulated player with the given name select the item in the specified hotbar slot.

**Usage: `/simplayer:sprint <playername: string> <shouldSprint: boolean>`**  
Make the simulated player with the given name sprint or stop sprinting.

**Usage: `/simplayer:sneak <playername: string> <shouldSneak: boolean>`**  
Make the simulated player with the given name sneak or stop sneaking.

**Usage: `/simplayer:claimprojectiles <playername: string> [radius: int]`**  
Make the simulated player with the given name become the owner of all projectiles within a block radius. If no radius is specified, it defaults to 25 blocks.

**Usage: `/simplayer:stop <playername: string>`**  
Stop all actions the simulated player with the given name is doing.

**Usage: `/simplayer:swapheld <playername: string>`**  
Swaps the held item of the simulated player with the given name with the item you are holding.

**Usage: `/simplayer:inventory <playername: string>`**  
Shows the inventory of the simulated player with the given name in chat.

**Usage: `/simplayer:prefix <prefix: string>`**  
Set a nametag prefix for all simulated players. Use `-none` to remove the prefix.

### Rules

These rules can be toggled in **Canopy**.

- **`simplayerRejoining`**: Makes online simulated players rejoin when the world reloads.
- **`noSimplayerSaving`**: Disables saving playerdata for simulated players. Improves performance but causes simulated players to lose their inventory and location when they leave and rejoin.
