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

When compatible non-anonymous layouts index a key at different positions, named
queries and subscriptions request the signature without value topics, then compare
decoded values locally. Different indexed counts alone use a
prefix topic filter when the filtered keys occupy the same positions. Anonymous
events keep the bound layout’s indexed topics; without a signature topic they
cannot automatically select sibling layouts.

`getPastEvents`, live subscriptions and their `fromBlock` replay compare active
filter values locally using the selected fragment, including non-indexed values.
`allEvents` scans all logs for the address before applying its local filter.
Filter values and every OR alternative are validated before fetching or subscribing;
for `allEvents`, they must be encodable in every layout containing all active keys.
Explicit `topics` override generated topics and disable the subscription's local
filter for both live delivery and replay. `getPastEvents` still applies its filter
when explicit topics are supplied. Live log fields are validated before decoding.
The indistinguishable-layout limitation above still applies.

`eventFilterNeedsBroadTopics(event, filter, jsonInterface)` reports whether a named,
non-anonymous event needs this broad query. `matchesEventFilter(log, abi, filter)`
compares decoded values against the selected ABI, including OR alternatives and
indexed hashes. Pass ABI fragments and filter objects; these helpers do not validate
arbitrary argument types. Live log validation runs before address/topic matching.

ABI parameter parsing permits at most 64 combined tuple/array levels and rejects
excessive nesting with a typed ABI or validation error.
