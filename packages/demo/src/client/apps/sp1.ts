import { Context } from '@finos/fdc3'
import { getClientAPI } from 'client'
import { SigningDesktopAgent, Resolver, SIGNING_ALGORITHM_DETAILS, ClientSideImplementation } from 'fdc3-security'


let pk: CryptoKey | null = null

const resolver: Resolver = (u: string) => {
    return fetch(u)
        .then(r => r.json())
}

fetch('/sp1-private-key')
    .then(r => r.json())
    .then(j => {
        return crypto.subtle.importKey("jwk", j, SIGNING_ALGORITHM_DETAILS, true, ["sign"])
    }).then(privateKey => {
        pk = privateKey

        return getClientAPI()
    }).then(fdc3 => {

        const csi = new ClientSideImplementation()

        return new SigningDesktopAgent(fdc3,
            csi.initSigner(pk as CryptoKey, "/sp1-public-key"),
            csi.initChecker(resolver))

    }).then(async fdc3 => {
        console.log("in promise")

        fdc3.addIntentListener("SecretComms", async (context) => {
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
