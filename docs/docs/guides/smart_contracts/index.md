---
sidebar_position: 4
---

# Smart Contracts

## Shared event signatures and filters

An event signature does not describe which arguments are indexed. When merged
ABIs contain layouts with different indexed counts (such as ERC-20 and ERC-721
`Transfer`), decoding selects the fragment whose count matches the log. A named
fragment passed to `decodeEventABI` takes precedence when it already matches;
the optional ABI registry supplies alternative layouts. Caller fragments are not
modified, and malformed topic entries are rejected.

Two layouts with the same signature and indexed count but different indexed
positions **cannot be distinguished from the log**. Named decoding prefers its
bound fragment; `allEvents` selects the first matching registry fragment. Reversing
ABI order can therefore change the decoded values. Use an ABI for the actual
emitting contract/version, or pass that explicit fragment to `decodeEventABI`;
do not merge these indistinguishable layouts and expect automatic selection.

Named event filters select a compatible layout before encoding indexed topics.
Unknown filter keys, or keys that belong to no single named layout, raise
`AbiError`. `getPastEvents` also compares filter values using the fragment selected
for each log. Live subscriptions rely on the node's topic filter and do not apply
a local value filter: non-indexed fields and `allEvents` value filters must be
checked by the consumer. Providing explicit `topics` overrides generated topics.
