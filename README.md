# Memoz

[![npm version](https://badge.fury.io/js/memoz.svg)](https://badge.fury.io/js/memoz)&nbsp;
![https://img.shields.io/npm/dm/memoz.svg](https://img.shields.io/npm/dm/memoz.svg)


Memoz is an in-memory database that persists on disk.

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

1. [createOne](#createone)
2. [createMany](#createmany)
3. [getById](#getbyid)
4. [getOne](#getone)
5. [getMany](#getmany)
6. [updateById](#updatebyid)
7. [updateOne](#updateone)
8. [updateMany](#updatemany)
9. [deleteById](#deletebyid)
10. [deleteOne](#deleteone)
11. [deleteMany](#deletemany)
12. [deleteAll](#deleteall)
13. [countDocuments](#countdocuments)
14. [id](#id)
15. [isValidId](#isvalidid)


### createOne

This method takes one parameter: javascript object

```js
const memoz = new Memoz();

const person = memoz.createOne({'name', 'john'});
// {"name":"milad","id":"d112c727-b6b1-4ec2-9604-7af42f9748b1-1fbtpld4v"}
```

### createMany

This method takes one parameter: javascript object

```js
const memoz = new Memoz();

const documents = memoz.createMany([{ name: 'milad' }, { name: 'medo' }]);
/* [{"name":"milad","id":"060be5fb-3526-4236-8798-7ff1e7d39612-1fbtpo1c7"},
{"name":"medo","id":"e9d5433e-b6f4-4192-9387-4a0b6c46f25c-1fbtpo1c7"}]*/

```

### getById

This method takes one parameter:

1. `id`, this is an `id`, must be valid uuid based on `isValidId` method

```js
const memoz = new Memoz();

const document = memoz.getById(id);
// {"name":"milad","id":"3b99ae9b-ba88-4e1d-abfc-d376a5e91bf4-1fbtq2n14"}
```

### getOne

This method take one parameter: 

1. `query`, this is a `object` contains `keys` and `values`, it will be `AND`, this is `required`

```js
const memoz = new Memoz();

const document = memoz.getOne({ name: 'milad' });
// {"name":"milad","id":"40c0bfcd-beab-494a-9d73-30522032f7a1-1fbtqconi"}
```

### getMany

This method take one parameter: 

1. `query`, this is a `object` contains `keys` and `values`, it will be `AND`, this is `required`

```js
const memoz = new Memoz();

const documents = memoz.getMany({ name: 'milad' });
// {"name":"milad","id":"40c0bfcd-beab-494a-9d73-30522032f7a1-1fbtqconi"}
```

```js
const memoz = new Memoz();

const documents = memoz.getMany({ name: 'milad' });

/* 
[{"name":"milad","id":"93d85042-8e6b-48bb-9eb9-7b4ad5237ce7-1fbtqg3j6"},
{"name":"milad","id":"966deb17-4b82-4a44-abbc-d0ddc0edfbbd-1fbtqg3j7"}]
*/
```

### updateById

This method takes two parameters:

1. `id`, this is an `id`, must be valid uuid based on `isValidId` method
2. `newData`, this is a javascript `Object`,  this is `required`

```js
const memoz = new Memoz();

const updatedObject = memoz.updateById(id, { name: 'medo' });
// {"name":"medo","id":"bd05def8-ae92-43b7-968f-bae612e6a41c-1fbtqo3nc"}
```

### updateOne

This method takes two parameters:

1. `query`, this is a javascript `object` contains keys and values, it will be `AND`, this is `required`
2. `newData`, this is a javascript `Object`,  this is `required`

```js
const memoz = new Memoz();

const updatedObject = memoz.updateOne({ name: 'milad' }, { name: 'medo' });
// {"name":"medo","id":"46de7672-107b-45a1-9181-a19e642dbb0b-1fbtqsiia"}
```

### updateMany

This method takes two parameters:

1. `query`, this is a javascript `object` contains keys and values, it will be `AND`, this is `required`
2. `newData`, this is a javascript `object`, this is `required`

```js
const memoz = new Memoz();

const updatedDocuments = memoz.updateMany({ name: 'milad' }, { name: 'medo' });
/*
 {
   "updated":true,
   "n":2,
   "documents":[
      {"name":"medo","id":"698c89a1-02de-4a08-add8-4076251c2e7a-1fbtr8l2p"},
      {"name":"medo","id":"5ac7dd8b-360f-48a2-80ca-3ab539e19dfa-1fbtr8l2p"}
    ]
  }
 */

```

### deleteById

This method take one parameter:

1. `id`, this is an `id`, must be valid uuid based on `isValidId` method

```js
const memoz = new Memoz();

const deletedObject = memoz.deleteById(id);
/*
{"name":"milad","id":"a1da45f4-c718-440b-af66-25a731d2491f-1fbts3el9"}
*/
```

### deleteOne

This method take one parameters:

1. `query`, this is a javascript `object` contains keys and values, it will be `AND`, this is `required`

```js
const memoz = new Memoz();

const deletedObject = memoz.deleteOne({ name: 'milad' });
/*
{"name":"milad","id":"9764e5c0-8d5b-43f1-b112-81936efa1690-1fbts9mm1"}
*/
```

### deleteMany

This method take one parameters:

1. `query`, this is a javascript `object` contains keys and values, it will be `AND`, this is `required`

```js
const memoz = new Memoz();

const deletedObject = memoz.deleteMany({ name: 'milad' });
/*{"deleted":true,"n":3}*/
```
### deleteAll

This method take without any parameter

```js
const memoz = new Memoz();

const deletedAll = memoz.deleteAll();
//{"deleted":true,"n":4}
```
### countDocuments

This method take one parameters:

1. `query`, this is a javascript `object` contains keys and values, it will be `AND`, this is `optional`

```js
const memoz = new Memoz();

const size = memoz.countDocuments();
// 4

const size = memoz.countDocuments({ name: 'milad' });
// 2
```

### id

This method don't take any parameter

```js
const memoz = new Memoz();

const id = memoz.id()

// 9764e5c0-8d5b-43f1-b112-81936efa1690-1fbts9mm1
```

### isValidId

This method take one a parameter:

1. `id`, it must be a `string`

```js
const memoz = new Memoz();

const isId = memoz.isValidId(id);

// true 
```
