Feature: Signing Broadcasts

  Background: Desktop Agent API
    Given A Desktop Agent in "api" with Signing Middleware
    Given "instrumentContext" is a "fdc3.instrument" context

  Scenario: Broadcasted context data will include a signature
    When I call "api" with "getOrCreateChannel" with parameter "channel-name"
    And I refer to "result" as "channel1"
    And I call "channel1" with "broadcast" with parameter "{instrumentContext}"
    Then messaging will have posts
      | payload.channelId | payload.context.type | payload.context.name | payload.signature |
      | channel-name      | fdc3.instrument      | Apple                | bobob             |
