import { Listener } from "@finos/fdc3";

export interface RegisterableListener extends Listener {

    getId(): string

    filter(m: any): boolean

    action(m: any): Promise<void>
}