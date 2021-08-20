import path = require("path");
import { events } from "bdsx/event";
import { serverProperties } from "bdsx/serverproperties";
import { serverData } from "./data";

export enum SocketEvents {
    SyncServerData = "SyncServerData",
    UpdateResourceUsage = "UpdateResourceUsage",

    Toast = "Toast",

    InputChat = "InputChat",
    InputCommand = "InputCommand",

    StopServer = "StopServer",
    RestartServer = "RestartServer",

    CheckForPluginUpdates = "CheckForPluginUpdates",
    InstallPlugin = "InstallPlugin",
    RemovePlugin = "RemovePlugin",

    KickPlayer = "KickPlayer",
}


class ServerPanel {
    readonly express = require("express");
    readonly app = this.express();
    readonly http = require("http").createServer(this.app);
    readonly io = require("socket.io")(this.http);
    private sockets: any = {};
    private nextSocketId = 0;
    config = require("../../config.json");
    getPanelPort():number {
        if (this.config["same_port_with_bds"]) {
            return Number(serverProperties["server-port"]);
        } else {
            return this.config["port"];
        }
    }
    init() {
        this.app.get(this.config.path, (req: any, res: any) => {
            res.sendFile(path.join(__dirname, "../gui/index.html"));
        });
        this.app.get("/favicon.ico", (req: any, res: any) => {
            res.sendFile(path.join(process.cwd(), "../bdsx/icon/icon.png"));
        });
        this.app.use(this.config.path, this.express.static(path.join(__dirname, "../gui")));
        this.http.listen(this.getPanelPort());
        this.http.on("connection", (socket: any) => {
            let socketId = this.nextSocketId++;
            this.sockets[socketId] = socket;
            socket.on("close", () => {
                delete this.sockets[socketId];
            });
            socket.setTimeout(5000);
        });
        require("./socket");
        events.serverStop.on(() => {
            panel.close();
        });
    }
    close() {
        serverData.status = 0;
        setTimeout(() => {
            this.http.close();
            for (let socketId in this.sockets) {
                this.sockets[socketId].destroy();
            }
        }, 3000).unref();
    }
}

export const panel = new ServerPanel();