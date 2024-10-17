# Memoz

[![npm version](https://badge.fury.io/js/memoz.svg)](https://badge.fury.io/js/memoz)&nbsp;
![https://img.shields.io/npm/dm/memoz.svg](https://img.shields.io/npm/dm/memoz.svg)

Memoz is an in-memory database that persists on disk, offering easy CRUD operations with a simple API. it supports document persistence to disk.

- [Memoz](#memoz)
  - [Installation](#installation)
  - [Usage](#usage)

## Installation

```bash
npm i memoz
# or
yarn add memoz
```

## Usage

```ts
import {Memoz} from 'memoz';

interface IDocument {
    name: string;
    age?: string;
}

const memo = new Memoz<IDocument>({
        persistToDisk: true,  // to allow persist data on disk - default false
        storagePath: './data' // the location to persist data - default './data'
        useMutex: true, //  Whether to use a mutex for thread safety - default false
    });
```
