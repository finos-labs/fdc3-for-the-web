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
      | broadcast | fdc3.instrument | AAPL              | https://dummy.com/pubKey         | length: 119                |

  Scenario: User Channel Broadasts context data will include a signature
    When I call "api" with "getUserChannels"
    And I refer to "result[0]" as "firstUserChannel"
    And I call "api" with "joinUserChannel" with parameter "{firstUserChannel.id}"
    And I call "api" with "broadcast" with parameter "{instrumentContext}"
    Then "{api.delegate.tracking}" is an array of objects with the following contents
      | method    | args[0].type    | args[0].id.ticker | args[0].__signature.publicKeyUrl | args[0].__signature.digest |
      | broadcast | fdc3.instrument | AAPL              | https://dummy.com/pubKey         | length: 119                |

  Scenario: Private Channel Broadasts context data will include a signature
    When I call "api" with "createPrivateChannel"
    And I refer to "result" as "privateChannel"
    And I call "privateChannel" with "broadcast" with parameter "{instrumentContext}"
    Then "{privateChannel.delegate.tracking}" is an array of objects with the following contents
      | method    | args[0].type    | args[0].id.ticker | args[0].__signature.publicKeyUrl | args[0].__signature.digest |
      | broadcast | fdc3.instrument | AAPL              | https://dummy.com/pubKey         | length: 119                |

  Scenario: Raise Intent context data will include a signature
    When I call "api" with "raiseIntent" with parameters "robsIntent" and "{instrumentContext}"
    Then "{api.delegate.tracking}" is an array of objects with the following contents
      | method      | args[0]    | args[1].type    | args[1].id.ticker | args[1].__signature.publicKeyUrl | args[1].__signature.digest |
      | raiseIntent | robsIntent | fdc3.instrument | AAPL              | https://dummy.com/pubKey         | length: 141                |