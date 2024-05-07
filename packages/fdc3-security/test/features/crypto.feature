Feature: Cyptographics

  Background: Public and Private Keys Available
    Given A New Keypair loaded into "public" and "private"
    Given A Client Side Implementation in "api"
    Given A Local URL Resolver in "urlResolver" resolving "https://blah.com/pubKey" to "{public}"

  Scenario: In an application, use a public/private key pair to sign and check a message
    Given I call "api" with "initSigner" with parameters "{private}" and "https://blah.com/pubKey"
    And I refer to "result" as "signer"
    And I call "api" with "initChecker" with parameter "{urlResolver}"
    And I refer to "result" as "checker"
    And I call "signer" with parameter "This is a test message"
    Then "{result}" is an object with the following contents
      | algorithm.name | algorithm.hash | publicKeyUrl            |
      | ECDSA          | SHA-512        | https://blah.com/pubKey |
    And I refer to "result" as "signature"
    And I call "checker" with parameters "{signature}" and "This is a test message"
    Then "{result}" is an object with the following contents
      | verified | valid | publicKeyUrl            |
      | true     | true  | https://blah.com/pubKey |
