Feature: Private Channel Encryption

  Scenario: A message arrives raising an intent which results in a private channel.
The request is signed, which means the requester has SigningMiddleware enabled.  
In this case, we return the private channel with a symmetric encryption key wrapped in the signer's public key.
