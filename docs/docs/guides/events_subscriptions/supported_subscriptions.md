---
sidebar_position: 1
sidebar_label: 'Supported Subscriptions'
---

# Supported Subscriptions

web3.js supports the standard QRL subscriptions out of the box. And they are the ones registered inside [registeredSubscriptions](/api/web3-qrl#registeredSubscriptions) object. Here are a list of them:

-   `logs`: implemented in the class [`LogsSubscription`](/api/web3-qrl/class/LogsSubscription).
-   `newBlockHeaders`: implemented in the class [`NewHeadsSubscription`](/api/web3-qrl/class/NewHeadsSubscription).
-   `newHeads` same as `newBlockHeaders`.
-   `newPendingTransactions`: implemented in the class [`NewPendingTransactionsSubscription`](/api/web3-qrl/class/NewPendingTransactionsSubscription).
-   `pendingTransactions`: same as `newPendingTransactions`.
-   `syncing`: implemented in the class [`SyncingSubscription`](/api/web3-qrl/class/SyncingSubscription)
