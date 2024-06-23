import { supply } from "@kite9/da-server/src/supply/post-message";
import { io } from "socket.io-client"
import { v4 as uuid } from 'uuid'
import { APP_GOODBYE, DA_HELLO, FDC3_APP_EVENT } from "../../message-types";
import { DemoServerContext } from "./DemoServerContext";
import { FDC3_2_1_JSONDirectory } from "./FDC3_2_1_JSONDirectory";
import { DefaultFDC3Server, DirectoryApp, ServerContext } from "@kite9/da-server";

window.addEventListener("load", () => {

    let desktopAgentUUID = uuid()

    const socket = io()

    socket.on("connect", async () => {
        socket.emit(DA_HELLO, desktopAgentUUID)

        const directory = new FDC3_2_1_JSONDirectory()
        await directory.load("/static/da/appd.json")
        //await directory.load("/static/da/local-conformance-2_0.v2.json")
        const sc = new DemoServerContext(socket, directory, desktopAgentUUID);
        const fdc3Server = new DefaultFDC3Server(sc, directory, "FDC3-Web-Demo", {})

        socket.on(FDC3_APP_EVENT, (msg, from) => {
            fdc3Server.receive(msg, from)
        })

        socket.on(APP_GOODBYE, (id: string) => {
            sc.goodbye(id)
        });

        // Fill in the slots in the DesktopAgent with requested apps
        document.querySelectorAll<HTMLDivElement>("#app-list > div").forEach((elem) => {
            const appId = elem.getAttribute("data-appId");
            if(!appId) return;

            sc.open(appId, elem);
        });

        // set up desktop agent handler here using FDC3 Web Loader (or whatever we call it)
        supply(sc.appChecker, sc.detailsResolver, sc.portResolver)
    })
})

