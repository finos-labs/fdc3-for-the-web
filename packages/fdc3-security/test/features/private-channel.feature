Feature: Private Channel Encryption

  Background:
    Given A New Keypair loaded into "public" and "private"
    Given A Client Side Implementation in "csi"
    Given A Local URL Resolver in "urlResolver" resolving "https://blah.com/pubKey" to "{public}"
    Given 

  Scenario: A message arrives raising an intent which results in a private channel.
The request is signed, which means the requester has SigningMiddleware enabled.  
In this case, we return the private channel with a symmetric encryption key wrapped in the signer's public key.

  Scenario: We are resolving a second intent to the existing private channel.
Therefore, we need to reuse the existing encryption key.

  Scenario: An intent result is received containing a private channel.
In this case, the response also contains a wrapped symmetric encryption key, so we need to unwrap it and instantiate it.

  Scenario: A message is received on the encrypted private channel.
To properly understand the payload of the message, we're going to need to decrypt the encryptedPayload field, using the pre-agreed 
symmetric key

  Scenario: We are sending a context on the encrypted private channel.
  We need to replace the payload with encrypted payload but leave the context type unchanged so that it can be used in delivery/filtering
