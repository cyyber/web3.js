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
Only non-nullish filter values select a layout; nullish values are wildcards.
Omitted `anonymous` and `anonymous: false` mean the same thing. Unknown active
filter keys, or keys that belong to no single named layout, raise `AbiError`.

When compatible layouts index a key at different positions or have different
topic counts, named queries and subscriptions request the signature without value
topics, then compare decoded values locally. This fetches more logs, but includes
matches from every distinguishable layout and excludes wrong-field live matches.
`getPastEvents` always compares values using the selected fragment; `allEvents`
scans all logs for the address before applying its local filter. Otherwise live
subscriptions rely on the node's topic filter: consumers must check non-indexed
values and `allEvents` filters themselves. Explicit `topics` override generated
topics and this automatic live post-filter. Live log fields are validated before
decoding. The indistinguishable-layout limitation above still applies.

ABI parameter parsing permits at most 64 combined tuple/array levels and rejects
excessive nesting with a typed ABI or validation error.
