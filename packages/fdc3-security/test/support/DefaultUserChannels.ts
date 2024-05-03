import { DefaultChannel, StatefulChannel, Messaging } from "da-proxy"

export function createDefaultChannels(messaging: Messaging): StatefulChannel[] {
    return [
        new DefaultChannel(messaging, "one", "user", { color: "red" }),
        new DefaultChannel(messaging, "two", "user", { color: "green" }),
        new DefaultChannel(messaging, "three", "user", { color: "blue" })
    ]
}