Feature: Signing Broadcasts

  Background: Desktop Agent API
    Given A Desktop Agent in "api" with Dummy Signing Middleware
    Given "instrumentContext" is a "fdc3.instrument" context
    Given "countryMessageOne" is a "broadcastRequest" message on channel "channel1" with context "fdc3.country" and signature "{\"certificateUrl\": \"https://blah.com/cert\", \"digest\": \"length: 394\"}"

  Scenario: Broadcasted context data will include a signature
We are using "Dummy Crypto" here, which basically just adds a digest containing the length.
In reality, we wouldn't use this, but it makes the test a lot simpler to understand.

    When I call "api" with "getOrCreateChannel" with parameter "channel1"
    And I refer to "result" as "channel1"
    And I call "channel1" with "broadcast" with parameter "{instrumentContext}"
    Then messaging will have posts
      | payload.channelId | payload.context.type | payload.context.name | signature.certificateUrl | signature.digest |
      | channel1          | fdc3.instrument      | Apple                | https://blah.com/cert    | length: 307      |

  Scenario: I can receive a checked signature back in the metadata
    Given "resultHandler" pipes context to "contexts" and metadata to "metas"
    When I call "api" with "getOrCreateChannel" with parameter "channel1"
    And I refer to "result" as "channel1"
    And I call "channel1" with "addContextListener" with parameters "{null}" and "{resultHandler}"
    And messaging receives "{countryMessageOne}"
    Then "{contexts}" is an array of objects with the following contents
      | type         | name   |
      | fdc3.country | Sweden |
    And "{metas}" is an array of objects with the following contents
      | authenticity.verified | authenticity.valid | authenticity.certificateUrl | authenticity.x509 |
      | true                  | true               | https://blah.com/cert       | zoblidob          |
