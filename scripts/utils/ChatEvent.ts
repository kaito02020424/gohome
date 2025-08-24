import { Player, world, system, PlayerPermissionLevel } from "@minecraft/server";

class ChatEvent {
    private commands: { [key: string]: { description: string, permission: keyof typeof Permission, callback: (params: any, sender: Player, result: CommandResult) => boolean | void, args: { [key: string]: keyof typeof commandArgTypes } } } = {}
    private chatEvents: ((text: string, sender: Player, targets: Player[] | undefined) => boolean | void)[] = [];
    private prefix: string;
    constructor(prefix: string = "!") {
        this.prefix = prefix;
        world.beforeEvents.chatSend.subscribe((ev) => {
            const { sender, message, targets } = ev;
            if (message.startsWith(prefix)) {
                const command = message.substring(prefix.length)
                if (command.split(' ')[0] as string in this.commands) {
                    const commandArray = this.commandParser(command, ["string", ...Object.values(this.commands[command.split(' ')[0]].args)]).slice(1);
                    if (commandArray.length !== Object.keys(this.commands[command.split(' ')[0]].args).length) {
                        sender.sendMessage("§cSyntax error");
                        ev.cancel = true;
                        return;
                    }
                    const commandData = this.commands[command.split(' ')[0] as string];
                    if (this.checkPermission(sender, commandData.permission)) {
                        const params: Record<string, any> = {};
                        for (const key in commandData.args) {
                            params[key] = commandArray[Object.keys(commandData.args).indexOf(key)] as any;
                        }
                        const result = new CommandResult(sender);
                        system.run(() => commandData.callback(params, sender, result));
                    } else {
                        sender.sendMessage("§cCommand not found");
                    }

                } else {
                    sender.sendMessage("§cCommand not found");
                }
                ev.cancel = true;
            } else {
                for (const event of this.chatEvents) {
                    if (event(message, sender, targets)) {
                        ev.cancel = true;
                    }
                }
            }
        })
    }
    public registerCommand<T extends { [key: string]: keyof typeof commandArgTypes }>(name: string, description: string, permission: keyof typeof Permission = "Everyone", callback: (params: { [K in keyof T]: T[K] extends "string" ? string : T[K] extends "number" ? number : boolean }, sender: Player, result: CommandResult) => any, args: T) {
        if (name.startsWith(this.prefix)) throw new Error(`Command name cannot start with ${this.prefix}`);
        if (name.includes(" ")) throw new Error("Command name cannot include space");
        if (!(name in this.commands)) {
            this.commands[name] = { description, callback, permission, args };
        } else {
            throw new Error(`Command ${name} already exists`);
        }
    }
    /**
     * 
     * @param callback `true`を返すことで, チャットをキャンセルすることができます. なお, どこかでtrueを返した場合でも, 他のイベントも実行されます
     */
    public registerChatEvent(callback: (text: string, sender: Player, targets: Player[] | undefined) => boolean | void) {
        this.chatEvents.push(callback);
    }
    /**
     * 
     * @returns 登録されているコマンドの一覧を返します
     * @remark この関数はhelpコマンドの実装に使うことを想定しています
     */
    getAllCommands() {
        return this.commands;
    }
    public checkPermission(sender: Player, permission: keyof typeof Permission) {
        switch (permission) {
            case "Operator":
                return sender.playerPermissionLevel == PlayerPermissionLevel.Operator
            case "Everyone":
                return true;
        }
    }
    private commandParser(command: string, types: (keyof typeof commandArgTypes)[]) {
        const commandArray = command.split(' ');
        const returnCommandArray: (string | number | boolean)[] = []
        let tmpString = "";
        let nowInScope = false;
        for (let i = 0; i < commandArray.length; i++) {
            if (commandArray[i].startsWith("\"")) {
                if (commandArray[i].endsWith("\"")) {
                    returnCommandArray.push(this.changeType(commandArray[i].substring(1, commandArray[i].length - 1), types[returnCommandArray.length]));
                    tmpString = "";
                    nowInScope = false;
                    continue;
                }
                nowInScope = true;
                tmpString += commandArray[i] + " ";
            } else if (nowInScope) {
                tmpString += commandArray[i] + " ";
                if (commandArray[i].endsWith("\"")) {
                    tmpString = tmpString.substring(1, tmpString.length - 2)
                    returnCommandArray.push(this.changeType(tmpString, types[returnCommandArray.length]));
                    tmpString = "";
                    nowInScope = false;
                }
            } else {
                returnCommandArray.push(this.changeType(commandArray[i], types[returnCommandArray.length]));
            }
        }
        return returnCommandArray;
    }
    private changeType(text: string, type: keyof typeof commandArgTypes) {
        switch (type) {
            case "string":
                return text;
            case "number":
                const num = Number(text);
                if (isNaN(num)) return 0;
                return num;
            case "boolean":
                return text === "true";
        }
    }
}
class CommandResult {
    private origin: Player;
    private alreadyRun = false;
    constructor(origin: Player) {
        this.origin = origin;
    }
    public success(message: string) {
        if (this.alreadyRun) return;
        this.origin.sendMessage(`§a${message}`);
        this.alreadyRun = true;
    }
    public error(message: string) {
        if (this.alreadyRun) return;
        this.origin.sendMessage(`§c${message}`);
        this.alreadyRun = true;
    }
}
export enum commandArgTypes {
    "string",
    "number",
    "boolean"
}
export enum Permission {
    "Operator",
    "Everyone"
}
export const chatEvent = new ChatEvent();
chatEvent.registerCommand("help", "Show help", "Everyone", (args, sender, result) => {
    if (args.command.length > 0) {
        if (args.command in chatEvent.getAllCommands()) {
            const commandData = chatEvent.getAllCommands()[args.command];
            if (chatEvent.checkPermission(sender, commandData.permission)) {
                sender.sendMessage(`§lUsage§r:\n§c${args.command}§r: ${commandData.description}\n - §cArgs§r: ${Object.keys(commandData.args).join(", ")}\n`);
            } else {
                result.error("Command not found");
            }
        } else {
            result.error("Command not found");
        }
    } else {
        const commandNames = Object.keys(chatEvent.getAllCommands());
        let helpMessage = "Commands:\n";
        for (const commandName of commandNames) {
            if (!chatEvent.checkPermission(sender, chatEvent.getAllCommands()[commandName].permission)) continue;
            helpMessage += `§c§l${commandName}§r: ${chatEvent.getAllCommands()[commandName].description}\n - §cArgs§r: ${Object.keys(chatEvent.getAllCommands()[commandName].args).join(", ")}\n`;
        }
        sender.sendMessage(helpMessage);
    }
}, {
    command: "string"
})
