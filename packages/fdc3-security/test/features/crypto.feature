Feature: Cyptographics

  Background: Public and Private Keys Available
    Given A New Keypair loaded into "public" and "private"
    Given A Client Side Implementation in "api"

  Scenario: In an application, use a public/private key pair to encrypt and then decrypt a message
    Given I call "api" with "initSigner" with parameters "{private}" and "RSA-PSS"
    And I refer to "result" as "signer"
    And I call "api" with "initChecker" with parameter "{public}"
    And I refer to "result" as "checker"
    And I call "signer" with parameter "This is a test message"
    Then "{result}" is an object with the following contents
      | authenticity.verified | authenticity.valid | authenticity.certificateUrl | authenticity.x509 |
      | true                  | true               | https://blah.com/cert       | zoblidob          |
