# Memoz

Memoz is an in-memory database that persists on disk. The data model is key-value, but many different kind of values are supported: Strings, Lists, Sets, Sorted Sets, Hashes, Streams, HyperLogLogs, Bitmaps. 

1. [Installation](#installation)
2. [Usage](#usage)
3. [Methods](#methods)
## Installation

```js
npm i memoz
// or
yarn add memoz
```

## Usage

```js
const Memoz = require('memoz');
// Or
import Memoz from 'memoz';

```

## Methods

1. [create](#create)
2. [updateMany](#updateMany)
3. [updateOne](#updateOne)
4. [get](#get)
5. [getOne](#getOne)
6. [deleteMany](#deleteMany)


### create

This methods take two parameters:

1. `key`, this is a `string`
2. `value`,  this is an `any`, maybe `string`, `number`, `object`, `array` any valid data types in javascript

```js
const memoz = new Memoz();

const person = memoz.create('name', 'john');
// {id: 'sdfd-dsfg455-dfg544fg', name: 'john'}
```

### updateMany

This methods take two parameters:

1. `query`, this is a `object` contains keys and values, it will be `AND`
2. `newData`,  this is an `any`, maybe `string`, `number`, `object`, `array` any valid data types in javascript

```js
const memoz = new Memoz();

const person = memoz.updateMany('name', 'Milad');
// {id: 'sdfd-dsfg455-dfg544fg', name: 'Milad'}
```
