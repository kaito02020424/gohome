import { chatEvent } from "../utils/ChatEvent";
import { world } from "@minecraft/server";
import { config } from "./config";

const TAG_HOME_PREFIX = "home_";
chatEvent.registerCommand("gohome", "Teleport to your home", "Everyone", (args, sender, result) => {
    const homename = args.home;
    const homes: home[] = sender.getTags().filter(tag => tag.startsWith(TAG_HOME_PREFIX)).filter(tag => (JSON.parse(tag.substring(TAG_HOME_PREFIX.length)) as home).name === homename).map(tag => JSON.parse(tag.substring(TAG_HOME_PREFIX.length)) as home)
    if (homes.length === 0) {
        result.error(`${homename} is not found`)
        return
    }
    const home = homes[0]
    sender.teleport(home, { dimension: world.getDimension(DimensionID[home.d]) })
    result.success(`Teleported to ${homename}`)
},
    {
        home: "string"
    }
)
chatEvent.registerCommand("sethome", "Set your home", "Everyone", (args, sender, result) => {
    const homeCount = sender.getTags().filter(tag => tag.startsWith(TAG_HOME_PREFIX)).length
    if (homeCount >= config.max_home) {
        result.error(`You can only set ${config.max_home} homes`)
        return;
    }
    if (args.home.length === 0) {
        result.error("You must specify home name")
        return;
    }
    if (sender.getTags().filter(tag => tag.startsWith(TAG_HOME_PREFIX)).filter(tag => (JSON.parse(tag.substring(TAG_HOME_PREFIX.length)) as home).name === args.home).length > 0) {
        result.error(`${args.home} is already set`)
        return;
    }
    const dim = (sender.dimension.id).slice(10) as keyof typeof DimensionID
    if (!config.dimension[dim]) {
        result.error(`Cannot set home in ${dim}`)
        return;
    }
    const home: home = {
        x: sender.location.x,
        y: sender.location.y,
        z: sender.location.z,
        d: DimensionID[dim],
        name: args.home
    }
    sender.addTag(TAG_HOME_PREFIX + JSON.stringify(home))
    result.success(`Set ${args.home} as your home`)
}, {
    home: "string"
})
chatEvent.registerCommand("delhome", "Delete your home", "Everyone", (args, sender, result) => {
    const homename = args.home;
    sender.getTags().forEach(tag => {
        if (tag.startsWith(TAG_HOME_PREFIX) && (JSON.parse(tag.substring(TAG_HOME_PREFIX.length)) as home).name === homename) {
            sender.removeTag(tag)
            result.success(`Deleted ${homename}`)
        }
    })
}, {
    home: "string"
})
chatEvent.registerCommand("listhome", "List your homes", "Everyone", (args, sender, result) => {
    const homes: home[] = sender.getTags().filter(tag => tag.startsWith(TAG_HOME_PREFIX)).map(tag => JSON.parse(tag.substring(TAG_HOME_PREFIX.length)) as home)
    if (homes.length === 0) {
        result.error("You don't have any home")
        return
    }
    sender.sendMessage("§lYour homes§r:")
    homes.forEach(home => {
        sender.sendMessage(` - §c${home.name}§r(${DimensionID[home.d]}) §lx§r:${home.x.toFixed(1)} §ly§r:${home.y.toFixed(1)} §lz§r:${home.z.toFixed(1)}`)
    })
}, {})


type home = {
    x: number,
    y: number,
    z: number,
    d: (typeof DimensionID)[keyof typeof DimensionID],
    name: string
}
enum DimensionID {
    overworld,
    nether,
    the_end
}
