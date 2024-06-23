import { DesktopAgent } from "@finos/fdc3";
import { BasicDesktopAgent, DefaultChannelSupport, DefaultAppSupport, DefaultIntentSupport, DefaultChannel, DefaultHandshakeSupport } from "@kite9/da-proxy";
import { APIResponseMessage, FDC3_PORT_TRANSFER_RESPONSE_TYPE, Options, exchangeForMessagePort, APIResponseMessageIFrame } from "@kite9/fdc3-common"
import { MessagePortMessaging } from "./MessagePortMessaging";
import { DefaultDesktopAgentIntentResolver } from "../intent-resolution/DefaultDesktopAgentIntentResolver";
import { DefaultDesktopAgentChannelSelector } from "../channel-selector/DefaultDesktopAgentChannelSelector";

// https://fdc3.finos.org/docs/api/spec#joining-user-channels
const recommendedChannels = [
    {
      id: 'fdc3.channel.1',
      type: 'user',
      displayMetadata: {
        name: 'Channel 1',
        color: 'red',
        glyph: '1',
      },
    },
    {
      id: 'fdc3.channel.2',
      type: 'user',
      displayMetadata: {
        name: 'Channel 2',
        color: 'orange',
        glyph: '2',
      },
    },
    {
      id: 'fdc3.channel.3',
      type: 'user',
      displayMetadata: {
        name: 'Channel 3',
        color: 'yellow',
        glyph: '3',
      },
    },
    {
      id: 'fdc3.channel.4',
      type: 'user',
      displayMetadata: {
        name: 'Channel 4',
        color: 'green',
        glyph: '4',
      },
    },
    {
      id: 'fdc3.channel.5',
      type: 'user',
      displayMetadata: {
        name: 'Channel 5',
        color: 'cyan',
        glyph: '5',
      },
    },
    {
      id: 'fdc3.channel.6',
      type: 'user',
      displayMetadata: {
        name: 'Channel 6',
        color: 'blue',
        glyph: '6',
      },
    },
    {
      id: 'fdc3.channel.7',
      type: 'user',
      displayMetadata: {
        name: 'Channel 7',
        color: 'magenta',
        glyph: '7',
      },
    },
    {
      id: 'fdc3.channel.8',
      type: 'user',
      displayMetadata: {
        name: 'Channel 8',
        color: 'purple',
        glyph: '8',
      },
    },
  ];

/**
 * Given a message port, constructs a desktop agent to communicate via that.
 */
export async function createDesktopAgentAPI(mp: MessagePort, data: APIResponseMessage, options: Options): Promise<DesktopAgent> {
    mp.start()

    const messaging = new MessagePortMessaging(mp, data.appIdentifier)

    const intentResolver = options.intentResolver ?? new DefaultDesktopAgentIntentResolver(messaging, data.intentResolver)
    const channelSelector = options.channelSelector ?? new DefaultDesktopAgentChannelSelector(messaging, data.channelSelector)
    const userChannelState = buildUserChannelState(messaging)

    const version = "2.0"
    const cs = new DefaultChannelSupport(messaging, userChannelState, null, channelSelector)
    const hs = new DefaultHandshakeSupport(messaging, [version], cs)
    const is = new DefaultIntentSupport(messaging, intentResolver)
    const as = new DefaultAppSupport(messaging, data.appIdentifier, "WebFDC3")
    const da = new BasicDesktopAgent(hs, cs, is, as, version)
    await da.connect()
    return da
}

/**
 * Initialises the desktop agent by opening an iframe or talking to the parent window.
 * on the desktop agent host and communicating via a messsage port to it.
 * 
 * It is up to the desktop agent to arrange communucation between other
 * windows. 
 */
export async function messagePortInit(event: MessageEvent, options: Options): Promise<DesktopAgent> {

    if (event.ports[0]) {
        return createDesktopAgentAPI(event.ports[0], event.data, options);
    } else if ((event.data as APIResponseMessageIFrame).uri) {
        const action = () => {
            const iframeData = event.data as APIResponseMessageIFrame
            return openFrame(iframeData.uri +
                "?source=" + encodeURIComponent(JSON.stringify(iframeData.appIdentifier)) +
                "&desktopAgentId=" + encodeURIComponent(iframeData.desktopAgentId));
        }

        const mp = await exchangeForMessagePort(window, FDC3_PORT_TRANSFER_RESPONSE_TYPE, action) as MessagePort
        return createDesktopAgentAPI(mp, event.data, options);

    } else {
        throw new Error(`Couldn't initialise message port with ${JSON.stringify(event)}`)
    }
}

/**
 * The desktop agent requests that the client opens a URL in order to provide a message port.
 */
function openFrame(url: string): Window {
    var ifrm = document.createElement("iframe")
    ifrm.setAttribute("src", url)
    ifrm.setAttribute("name", "FDC3 Communications")
    ifrm.style.width = "0px"
    ifrm.style.height = "0px"
    document.body.appendChild(ifrm)
    return ifrm.contentWindow!!
}

// TODO: Figure out how to set initial user channels.  
// Should probably be in the message from the server.
const buildUserChannelState = (messaging: MessagePortMessaging) => recommendedChannels.map(({id, type, displayMetadata}) => new DefaultChannel(messaging, id, type, displayMetadata));