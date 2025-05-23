<p align="center">
  <img src="assets/logo/web3js.jpg" width="500" alt="web3.js" />
</p>

# web3.js - ZNS

![ES Version](https://img.shields.io/badge/ES-2020-yellow)
![Node Version](https://img.shields.io/badge/node-14.x-green)
[![NPM Package][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]

This is a sub-package of [web3.js][repo].

`web3-zond-zns` This package has ZNS functions for interacting with Zond Name Service.

## Installation

You can install the package either using [NPM](https://www.npmjs.com/package/web3-zond-zns) or using [Yarn](https://yarnpkg.com/package/web3-zond-zns)

### Using NPM

```bash
npm install web3-zond-zns
```

### Using Yarn

```bash
yarn add web3-zond-zns
```

## Getting Started

-   :writing_hand: If you have questions [submit an issue](https://github.com/ChainSafe/web3.js/issues/new) or join us on [Discord](https://discord.gg/yjyvFRP)
    ![Discord](https://img.shields.io/discord/593655374469660673.svg?label=Discord&logo=discord)

## Prerequisites

-   :gear: [NodeJS](https://nodejs.org/) (LTS/Fermium)
-   :toolbox: [Yarn](https://yarnpkg.com/)/[Lerna](https://lerna.js.org/)

## Package.json Scripts

| Script           | Description                                        |
| ---------------- | -------------------------------------------------- |
| clean            | Uses `rimraf` to remove `dist/`                    |
| build            | Uses `tsc` to build package and dependent packages |
| lint             | Uses `eslint` to lint package                      |
| lint:fix         | Uses `eslint` to check and fix any warnings        |
| format           | Uses `prettier` to format the code                 |
| test             | Uses `jest` to run unit tests                      |
| test:integration | Uses `jest` to run tests under `/test/integration` |
| test:unit        | Uses `jest` to run tests under `/test/unit`        |

[docs]: https://docs.web3js.org/
[repo]: https://github.com/web3/web3.js/tree/4.x/packages/web3-zond-zns
[npm-image]: https://img.shields.io/github/package-json/v/web3/web3.js/4.x?filename=packages%2Fweb3-zond-zns%2Fpackage.json
[npm-url]: https://npmjs.org/package/web3-zond-zns
[downloads-image]: https://img.shields.io/npm/dm/web3-zond-zns?label=npm%20downloads
