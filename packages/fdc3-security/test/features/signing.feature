Feature: Signing Broadcasts

  Background: Desktop Agent API
    Given A Mock Desktop Agent in "mock"
    Given A Signing Desktop Agent in "api" wrapping "mock" with Dummy Signing Middleware
    Given "instrumentContext" is a "fdc3.instrument" context

  Scenario: App Channel Broadcasts context data will include a signature
We are using "Dummy Crypto" here, which basically just adds a digest containing the length.
In reality, we wouldn't use this, but it makes the test a lot simpler to understand.

    When I call "api" with "getOrCreateChannel" with parameter "channel1"
    And I refer to "result" as "channel1"
    And I call "channel1" with "broadcast" with parameter "{instrumentContext}"
    Then "{channel1.delegate.tracking}" is an array of objects with the following contents
      | method    | args[0].type    | args[0].id.ticker | args[0].__signature.publicKeyUrl | args[0].__signature.digest |
      | broadcast | fdc3.instrument | AAPL              | https://dummy.com/pubKey         | length: 115                |

  Scenario: User Channel Broadasts context data will include a signature
    When I call "api" with "getUserChannels"
    And I refer to "result[0]" as "firstUserChannel"
    And I call "api" with "joinUserChannel" with parameter "{firstUserChannel.id}"
    And I call "api" with "broadcast" with parameter "{instrumentContext}"
    Then "{api.delegate.tracking}" is an array of objects with the following contents
      | method    | args[0].type    | args[0].id.ticker | args[0].__signature.publicKeyUrl | args[0].__signature.digest |
      | broadcast | fdc3.instrument | AAPL              | https://dummy.com/pubKey         | length: 115                |

  Scenario: Private Channel Broadasts context data will include a signature
    When I call "api" with "createPrivateChannel"
    And I refer to "result" as "privateChannel"
    And I call "privateChannel" with "broadcast" with parameter "{instrumentContext}"
    Then "{privateChannel.delegate.tracking}" is an array of objects with the following contents
      | method    | args[0].type    | args[0].id.ticker | args[0].__signature.publicKeyUrl | args[0].__signature.digest |
      | broadcast | fdc3.instrument | AAPL              | https://dummy.com/pubKey         | length: 115                |

  Scenario: Raise Intent context data will include a signature
  #   When I call "api" with "raiseIntent" with parameters "robsIntent" and "{instrumentContext}"
  #   Then messaging will have posts
  #     | payload.channelId | payload.context.type | payload.context.name | signature.publicKeyUrl   | signature.digest |
  #     | channel1          | fdc3.instrument      | Apple                | https://dummy.com/pubKey | length: 238      |
  # Scenario: I can receive a checked signature back in the metadata
  #   Given "resultHandler" pipes context to "contexts" and metadata to "metas"
  #   When I call "api" with "getOrCreateChannel" with parameter "channel1"
  #   And I refer to "result" as "channel1"
  #   And I call "channel1" with "addContextListener" with parameters "{null}" and "{resultHandler}"
  #   And messaging receives "{countryMessageOne}"
  #   Then "{contexts}" is an array of objects with the following contents
  #     | type         | name   |
  #     | fdc3.country | Sweden |
  #   And "{metas}" is an array of objects with the following contents
  #     | authenticity.verified | authenticity.valid | authenticity.publicKeyUrl |
  #     | true                  | true               | https://dummy.com/pubKey  |
  # Scenario: Raising an intent,
