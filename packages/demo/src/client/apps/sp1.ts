import { Context } from '@finos/fdc3'
import { getClientAPI } from 'client'

/**
 * Sends messages on a private channel
 */
getClientAPI().then(async fdc3 => {
    console.log("in promise")

    fdc3.addIntentListener("SecretComms", async context => {
        const pc = await fdc3.createPrivateChannel()
        const msg = document.createElement("p");
        msg.textContent = "Created private channel!: " + JSON.stringify(pc);
        const log = document.getElementById("log");
        log?.appendChild(msg);

        var broadcastCount = 0;

        setInterval(() => {
            broadcastCount++
            const outContext = {
                type: 'demo.counter',
                id: {
                    bc: broadcastCount
                },
                original: context
            } as Context
            pc.broadcast(outContext)
        }, 1000);

        return pc
    })
});
