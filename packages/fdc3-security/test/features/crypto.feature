Feature: Cyptographics

  Background: Public and Private Keys Available
    Given A New Keypair loaded into "public" and "private"
    Given A Client Side Implementation in "api"

  Scenario: In an application, use a public/private key pair to sign and check a message
    Given I call "api" with "initSigner" with parameters "{private}" and "https://blah.com/cert"
    And I refer to "result" as "signer"
    And I call "api" with "initChecker" with parameter "{public}"
    And I refer to "result" as "checker"
    And I call "signer" with parameter "This is a test message"
    Then "{result}" is an object with the following contents
      | algorithm.name | algorithm.hash.name | certificateUrl        |
      | ECDSA          | SHA-512             | https://blah.com/cert |
    And I refer to "result" as "signature"
    And I call "checker" with parameters "{signature}" and "This is a test message"
    Then "{result}" is an object with the following contents
      | verified | valid | certificateUrl        | x509 |
      | true     | true  | https://blah.com/cert | bob  |
