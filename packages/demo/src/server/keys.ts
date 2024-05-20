import { SIGNING_ALGORITHM_DETAILS } from '@kite9/fdc3-security'

const params: EcKeyGenParams = {
    ...SIGNING_ALGORITHM_DETAILS,
    namedCurve: 'P-521'
}

export async function createKeyPair(): Promise<CryptoKeyPair> {
    const kp = await crypto.subtle.generateKey(params, true, ["sign", "verify"]) as CryptoKeyPair
    return kp
}
