# Memoz

[![npm version](https://badge.fury.io/js/memoz.svg)](https://badge.fury.io/js/memoz)&nbsp;
![https://img.shields.io/npm/dm/memoz.svg](https://img.shields.io/npm/dm/memoz.svg)


Memoz is an in-memory database that persists on disk. The data model is key-value, but many different kind of values are supported: Strings, Lists, Sets, Sorted Sets, Hashes, Streams, HyperLogLogs, Bitmaps. 

1. [Installation](#installation)
2. [Usage](#usage)
3. [Methods](#methods)
## Installation

```bash
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
2. [updateMany](#updatemany)
3. [updateOne](#updateone)
4. [get](#get)
5. [getOne](#getone)
6. [deleteMany](#deletemany)
6. [deleteOne](#deleteone)


### create

This method takes one parameter: javascript object

```js
const memoz = new Memoz();

const person = memoz.create({'name', 'john'});
// {id: 'sdfd-dsfg455-dfg544fg', name: 'john'}
```

### updateMany

This method takes two parameters:

1. `query`, this is a `object` contains keys and values, it will be `AND`, this is `required`
2. `newData`,  this is an `any`, maybe `string`, `number`, `object`, `array` any valid data types in javascript, this is `required`

```js
const memoz = new Memoz();

const person = memoz.updateMany('name', 'Milad');
// { updated: true }
```

### updateOne

This method takes two parameters:

1. `query`, this is a `object` contains keys and values, it will be `AND`, this is `required`
2. `newData`,  this is an `any`, maybe `string`, `number`, `object`, `array` any valid data types in javascript, this is `required`

```js
const memoz = new Memoz();

const person = memoz.updateOne('name', 'Milad');
// {id: 'sdfd-dsfg455-dfg544fg', name: 'Milad'}
```

## get

This method take one parameters:

`query`, this is a `object` contains keys and values, it will be `AND`, this is `optional`

```js
const memoz = new Memoz();

const person = memoz.get({'name':'Milad'});
// [{id: 'sdfd-dsfg455-dfg544fg', name: 'Milad'}]
```

## getOne

This method take one parameters:

`query`, this is a `object` contains keys and values, it will be `AND`, this is `required`

```js
const memoz = new Memoz();

const person = memoz.getOne({'name':'Milad'});
// {id: 'sdfd-dsfg455-dfg544fg', name: 'Milad'}
```

## deleteMany

This method take one parameters:

`query`, this is a `object` contains keys and values, it will be `AND`, this is `required`

```js
const memoz = new Memoz();

const person = memoz.deleteMany({'name':'Milad'});
// {deleted: true, number: 5}
```

### deleteOne

This method take one parameters:

`query`, this is a `object` contains keys and values, it will be `AND`, this is `required`

```js
const memoz = new Memoz();

const person = memoz.deleteOne({'name':'Milad'});
// {deleted: { id: "dslkmds68-dfgh45", name: "Milad" }}
```