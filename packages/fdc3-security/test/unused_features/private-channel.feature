Feature: Private Channel Encryption

  Background:
    Given A Mock Desktop Agent in "mock"
    Given A New Encryption Keypair loaded into "epub" and "epriv"
    Given A New Signing Keypair loaded into "spub" and "spriv"
    Given A Local URL Resolver in "urlResolver" resolving "https://blah.com/pubKey" to "{epub}" and "{spub}"
    Given A Signing Desktop Agent in "api" wrapping "mock" with Real Middleware using "{spriv}", "{epriv}", "https://blah.com/pubKey" and resolver "{urlResolver}"

  Scenario: A message arrives raising an intent which results in an encrypted private channel.
The request is signed, which means the requester has SigningMiddleware enabled.  
In this case, we return the private channel with a symmetric encryption key wrapped in the signer's public key.

    Given I call "api" with "createPrivateChannel"
    And I refer to "result" as "privateChannel"
    And I call "privateChannel" with "setChannelEncryption" with parameter "true"
    And "signedContext" is a "fdc3.instrument" context signwed with "{spriv}" and "https://blah.com/pubKey" for intent "viewNews"
    Given "resultHandler" is an intent handler which returns "{privateChannel}"
    And I call "api" with "addIntentListener" with parameters "viewNews" and "{resultHandler}"
    And I call "{api.delegate.handlers.viewNews}" with parameter "{signedContext}"
    Then "{result}" is an object with the following contents
      | type            | id.ticker | __signature.publicKeyUrl | __signature.digest |
      | fdc3.instrument | AAPL      | https://dummy.com/pubKey | length: 139        |

  Scenario: We are resolving a second intent to the existing private channel.
Therefore, we need to reuse the existing encryption key.

  Scenario: An intent result is received containing a private channel.
In this case, the response also contains a wrapped symmetric encryption key, so we need to unwrap it and instantiate it.

  Scenario: A message is received on the encrypted private channel.
To properly understand the payload of the message, we're going to need to decrypt the encryptedPayload field, using the pre-agreed 
symmetric key

  Scenario: We are sending a context on the encrypted private channel.
  We need to replace the payload with encrypted payload but leave the context type unchanged so that it can be used in delivery/filtering
