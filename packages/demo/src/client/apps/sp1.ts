import { Context } from '@finos/fdc3'
import { getClientAPI } from 'client'
import { Options } from 'fdc3-common';
import { ClientSideImplementation, Resolver, SIGNING_ALGORITHM_DETAILS, SigningMiddleware } from 'fdc3-security'

fetch('/sp1-private-key')
    .then(r => r.json())
    .then(j => {
        return crypto.subtle.importKey("jwk", j, SIGNING_ALGORITHM_DETAILS, true, ["sign"])
    }).then(privateKey => {
        const csi = new ClientSideImplementation()

        const resolver: Resolver = (u) => {
            return fetch(u)
                .then(r => r.json())
        }

        const signingMiddleware = new SigningMiddleware(
            csi.initSigner(privateKey, "/sp1-public-key"),
            csi.initChecker(resolver))

        const OPTIONS: Options = {
            middlewares: [signingMiddleware]
        }

        return getClientAPI(OPTIONS)
    }).then(async fdc3 => {
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
