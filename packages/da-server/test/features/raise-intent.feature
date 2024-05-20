Feature: Raising Intents

  Background:
    Given "libraryApp" is an app with the following intents
      | Intent Name | Context Type | Result Type |
      | returnBook  | fdc3.book    | {empty}     |
    And "unusedApp" is an app with the following intents
      | Intent Name | Context Type | Result Type |
    And A newly instantiated FDC3 Server
    And "App1/a1" is opened
    And "App1/b1" is opened
    And "App1/b1" sends hello
    And "App1/b1" registers an intent listener for "returnBook"
  # Scenario: Raising An Intent To A Non-Existent App
  #   When "App1/a1" raises an intent for "returnBook" with contextType "fdc3.book" on app "NonExistentApp"
  #   Then messaging will have outgoing posts
  #     | msg.type            | msg.payload.error    | to.instanceId |
  #     | raiseIntentResponse | TargetAppUnavailable | a1            |
  # Scenario: Raising An Intent To A Non-Existent App Instance
  #   When "App1/a1" raises an intent for "returnBook" with contextType "fdc3.book" on app "AppZ/b1"
  #   Then messaging will have outgoing posts
  #     | msg.type            | msg.payload.error         | to.instanceId |
  #     | raiseIntentResponse | TargetInstanceUnavailable | a1            |
  # Scenario: Raising An Intent To A Running App
  #   When "App1/a1" raises an intent for "returnBook" with contextType "fdc3.book" on app "App1/b1"
  #   Then messaging will have outgoing posts
  #     | msg.type           | msg.payload.intent | to.instanceId |
  #     | raiseIntentRequest | returnBook         | b1            |
  # Scenario: Raising An Intent To A Non-Running App
  #   When "App1/a1" raises an intent for "returnBook" with contextType "fdc3.book" on app "libraryApp"
  #   And "libraryApp/0" is opened
  #   And "libraryApp/0" registers an intent listener for "returnBook"
  #   Then messaging will have outgoing posts
  #     | msg.type           | msg.payload.intent | to.instanceId | to.appId   | msg.payload.context.type |
  #     | raiseIntentRequest | returnBook         |             0 | libraryApp | fdc3.book                |

  Scenario: Raising an Intent to a Non-Existent App Instance
    And "App1/a1" raises an intent for "returnBook" with contextType "fdc3.book" on app "unusedApp/u1"
    Then messaging will have outgoing posts
      | msg.type            | msg.payload.error         | to.instanceId | to.appId |
      | raiseIntentResponse | TargetInstanceUnavailable | a1            | App1     |

  Scenario: Raising an Intent to a Non-Existent App
    And "App1/a1" raises an intent for "returnBook" with contextType "fdc3.book" on app "completelyMadeUp"
    Then messaging will have outgoing posts
      | msg.type            | msg.payload.error    | to.instanceId | to.appId |
      | raiseIntentResponse | TargetAppUnavailable | a1            | App1     |

  Scenario: Raising An Intent To A Non-Running App without A Context Type in the listener
    When "App1/a1" raises an intent for "stampBook" with contextType "fdc3.book" on app "libraryApp"
    And "libraryApp/0" is opened
    And "libraryApp/0" registers an intent listener for "stampBook"
    Then running apps will be
      | appId      | instanceId |
      | App1       | a1         |
      | App1       | b1         |
      | libraryApp |          0 |
    Then messaging will have outgoing posts
      | msg.type           | msg.payload.intent | to.instanceId | to.appId   | msg.payload.context.type |
      | raiseIntentRequest | stampBook          |             0 | libraryApp | fdc3.book                |

  Scenario: Raising An Intent To A Broken App that doesn't add an intent listener
    When "App1/a1" raises an intent for "returnBook" with contextType "fdc3.book" on app "libraryApp"
    And "libraryApp/0" is opened
    And we wait for the intent timeout
    Then running apps will be
      | appId      | instanceId |
      | App1       | a1         |
      | App1       | b1         |
      | libraryApp |          0 |
    Then messaging will have outgoing posts
      | msg.type            | msg.payload.error    | to.instanceId | to.appId |
      | raiseIntentResponse | IntentDeliveryFailed | a1            | App1     |
  # Scenario: User Chooses an Intent From the Intent Resolver
  #   When User chooses intent "returnBook" with contextType "fdc3.book" on app "libraryApp" for app "App1/a1" to raise
  #   Then messaging will have outgoing posts
  #     | msg.type     | msg.payload.intentName | msg.payload.contextType | to.instanceId | to.appId |
  #     | chooseIntent | returnBook             | fdc3.book               | App1          | a1       |
