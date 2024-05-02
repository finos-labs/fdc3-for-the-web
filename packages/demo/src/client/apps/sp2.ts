import { PrivateChannel } from '@finos/fdc3';
import { getClientAPI } from 'client'

/**
 * Gets the private channel via a raise Intent then spools the output
 */
function doIt() {
    getClientAPI().then(async fdc3 => {
        console.log("in promise")
        const log = document.getElementById("log");
        const reso = await fdc3.raiseIntent("SecretComms", {
            type: "fdc3.instrument",
            id: {
                isin: "Abc123"
            }
        })

        log!!.textContent = `Got resolution: ${JSON.stringify(reso)}`
        const result = await reso.getResult()
        log!!.textContent += `Got result: ${JSON.stringify(result)}`

        const privateChannel = result as PrivateChannel
        privateChannel.addContextListener(null, (ctx, meta) => {
            log!!.textContent += `Private Channel Message ctx=${JSON.stringify(ctx)} meta=${JSON.stringify(meta)} \n`;
        })

    });
}

window.addEventListener("load", () => {
    const broadcast = document.getElementById("raise");
    broadcast?.addEventListener("click", () => doIt());
})
