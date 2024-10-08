# Memoz

[![npm version](https://badge.fury.io/js/memoz.svg)](https://badge.fury.io/js/memoz)&nbsp;
![https://img.shields.io/npm/dm/memoz.svg](https://img.shields.io/npm/dm/memoz.svg)

Memoz is an in-memory database that persists on disk, offering easy CRUD operations with a simple API. It supports filtering using logical operators (`$or`, `$and`, `$eq`, `$neq`, `$nin`, etc.) for querying documents and also supports document persistence to disk.

- [Memoz](#memoz)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Methods](#methods)
  - [API Reference](#api-reference)
  - [Examples](#examples)
    - [createOne](#createone)
    - [createMany](#createmany)
    - [getById](#getbyid)
    - [getOne](#getone)
    - [getMany](#getmany)
    - [updateById](#updatebyid)
    - [updateOne](#updateone)
    - [updateMany](#updatemany)
    - [deleteById](#deletebyid)
    - [deleteOne](#deleteone)
    - [deleteMany](#deletemany)
    - [deleteAll](#deleteall)
    - [countDocuments](#countdocuments)
    - [id](#id)
    - [isValidId](#isvalidid)
  - [References](#references)
  - [Persistence on Disk](#persistence-on-disk)
    - [How It Works](#how-it-works)
    - [Example Usage](#example-usage)
    - [Benefits of Disk Persistence](#benefits-of-disk-persistence)
  - [Types](#types)
    - [Type Definitions](#type-definitions)
      - [ComparisonOperator](#comparisonoperator)
      - [SimpleCondition](#simplecondition)
      - [ConditionNode](#conditionnode)

## Installation

```bash
npm i memoz
# or
yarn add memoz
```

## Usage

```ts
const Memoz = require('memoz'); // Or import Memoz from 'memoz';
const memoz = new Memoz({ persistToDisk: true });
```


## Methods

| Method          | Type                | Description                                                                                               | Options                          |
|-----------------|---------------------|-----------------------------------------------------------------------------------------------------------|----------------------------------|
| `createOne`     | `void`              | Creates a single document in the database.                                                                | `data: Object` (required)       |
| `createMany`    | `void`              | Creates multiple documents in the database.                                                               | `data: Array<Object>` (required)|
| `getById`       | `Object`            | Retrieves a document by its ID.                                                                            | `id: string` (required)         |
| `getOne`        | `Object`            | Retrieves a single document matching the query condition. Uses a comparison operator for filtering.      | `query: ConditionNode<T>` (required) |
| `getMany`       | `Array<Object>`     | Retrieves multiple documents matching the query condition. Uses comparison operators for filtering.       | `query: ConditionNode<T>` (required) |
| `updateById`    | `Object`            | Updates a document by its ID.                                                                              | `id: string`, `newData: Object` (required) |
| `updateOne`     | `Object`            | Updates a single document matching the query condition.                                                    | `query: ConditionNode<T>`, `newData: Object` (required) |
| `updateMany`    | `Object`            | Updates multiple documents matching the query condition.                                                  | `query: ConditionNode<T>`, `newData: Object` (required) |
| `deleteById`    | `Object`            | Deletes a document by its ID.                                                                              | `id: string` (required)         |
| `deleteOne`     | `Object`            | Deletes a single document matching the query condition.                                                   | `query: ConditionNode<T>` (required) |
| `deleteMany`    | `Object`            | Deletes multiple documents matching the query condition.                                                  | `query: ConditionNode<T>` (required) |
| `deleteAll`     | `Object`            | Deletes all documents in the database.                                                                     | None                             |
| `countDocuments`| `number`            | Counts the documents in the database.                                                                     | `query: ConditionNode<T>` (optional)      |
| `id`            | `string`            | Generates a new unique ID.                                                                                 | None                             |
| `isValidId`     | `boolean`           | Checks if the provided ID is valid.                                                                        | `id: string` (required)         |

## API Reference

| Method          | Type                | Description                                                                                               | Options                          |
|-----------------|---------------------|-----------------------------------------------------------------------------------------------------------|----------------------------------|
| `createOne`     | `void`              | Creates a single document in the database.                                                                | `data: Object` (required)       |
| `createMany`    | `void`              | Creates multiple documents in the database.                                                               | `data: Array<Object>` (required)|
| `getById`       | `Object`            | Retrieves a document by its ID.                                                                            | `id: string` (required)         |
| `getOne`        | `Object`            | Retrieves a single document matching the query condition. Uses a comparison operator for filtering.       | `query: ConditionNode<T>` (required) |
| `getMany`       | `Array<Object>`     | Retrieves multiple documents matching the query condition. Uses comparison operators for filtering.       | `query: ConditionNode<T>` (required) |
| `updateById`    | `Object`            | Updates a document by its ID.                                                                              | `id: string`, `newData: Object` (required) |
| `updateOne`     | `Object`            | Updates a single document matching the query condition.                                                    | `query: ConditionNode<T>`, `newData: Object` (required) |
| `updateMany`    | `Object`            | Updates multiple documents matching the query condition.                                                  | `query: ConditionNode<T>`, `newData: Object` (required) |
| `deleteById`    | `Object`            | Deletes a document by its ID.                                                                              | `id: string` (required)         |
| `deleteOne`     | `Object`            | Deletes a single document matching the query condition.                                                   | `query: ConditionNode<T>` (required) |
| `deleteMany`    | `Object`            | Deletes multiple documents matching the query condition.                                                  | `query: ConditionNode<T>` (required) |
| `deleteAll`     | `Object`            | Deletes all documents in the database.                                                                     | None                             |
| `countDocuments`| `number`            | Counts the documents in the database.                                                                     | `query: ConditionNode<T>` (optional)      |
| `id`            | `string`            | Generates a new unique ID.                                                                                 | None                             |
| `isValidId`     | `boolean`           | Checks if the provided ID is valid.                                                                        | `id: string` (required)         |

## Examples

### createOne

```js
const memoz = new Memoz();

const person = memoz.createOne({ name: 'john' });
// Returns: {"name":"john","id":"generated-id"}
```

### createMany
```ts
const memoz = new Memoz();

const documents = memoz.createMany([{ name: 'milad' }, { name: 'medo' }]);
// Returns: [{"name":"milad","id":"generated-id"}, {"name":"medo","id":"generated-id"}]
```

### getById
```ts
const memoz = new Memoz();

const document = memoz.getById('generated-id');
// Returns: {"name":"milad","id":"generated-id"}
```

### getOne
```ts
const memoz = new Memoz();

const document = memoz.getOne({ $and: [{ field: 'name', operator: '$eq', value: 'milad' }] });
// Returns the first document that matches the query condition: {"name":"milad","id":"generated-id"}
```

### getMany
```ts
const memoz = new Memoz();

const documents = memoz.getMany({ $or: [{ field: 'name', operator: '$eq', value: 'milad' }, { field: 'name', operator: '$eq', value: 'medo' }] });
// Returns all documents that match the query condition: [{"name":"milad","id":"generated-id"}, {"name":"medo","id":"generated-id"}]
```

### updateById
```ts
const memoz = new Memoz();

const updatedObject = memoz.updateById('generated-id', { name: 'medo' });
// Returns: {"name":"medo","id":"generated-id"}
```

### updateOne
```ts
const memoz = new Memoz();

const updatedObject = memoz.updateOne({ $and: [{ field: 'name', operator: '$eq', value: 'milad' }] }, { name: 'medo' });
// Returns: {"name":"medo","id":"generated-id"}
```

### updateMany
```ts
const memoz = new Memoz();

const updatedDocuments = memoz.updateMany({ $or: [{ field: 'name', operator: '$eq', value: 'milad' }] }, { name: 'medo' });
// Returns: 
// {
//   "updated": true,
//   "n": 2,
//   "documents": [
//      {"name":"medo","id":"generated-id"},
//      {"name":"medo","id":"generated-id"}
//    ]
//  }
```

### deleteById
```ts
const memoz = new Memoz();

const deletedObject = memoz.deleteById('generated-id');
// Returns: {"name":"milad","id":"generated-id"}
```

### deleteOne
```ts
const memoz = new Memoz();

const deletedObject = memoz.deleteOne({ $and: [{ field: 'name', operator: '$eq', value: 'milad' }] });
// Returns: {"name":"milad","id":"generated-id"}
```

### deleteMany
```ts
const memoz = new Memoz();

const deletedResult = memoz.deleteMany({ $or: [{ field: 'name', operator: '$eq', value: 'milad' }] });
// Returns: {"deleted":true,"n":2}
```

### deleteAll
```ts
const memoz = new Memoz();

const deletedAll = memoz.deleteAll();
// Returns: {"deleted":true,"n":4}
```

### countDocuments
```ts
const memoz = new Memoz();

const count = memoz.countDocuments();
// Returns the total number of documents: 4

const countWithCondition = memoz.countDocuments({ $and: [{ field: 'name', operator: '$eq', value: 'milad' }] });
// Returns the count of documents that match the condition: 2
```

### id
```ts
const memoz = new Memoz();

const newId = memoz.id();
// Returns a new unique ID: "generated-id"
```
### isValidId
```ts
const memoz = new Memoz();

const isIdValid = memoz.isValidId('generated-id');
// Returns: true

const isIdInvalid = memoz.isValidId('invalid-id');
// Returns: false
```

## References


## Persistence on Disk

One of the key features of Memoz is its ability to persist data on disk while functioning as an in-memory database. This ensures that data is not lost when the application is restarted or crashes. The persistence mechanism allows you to store your in-memory data to a file on disk, providing durability and recoverability.

### How It Works

- **Data Serialization**: When you create, update, or delete documents in your in-memory database, Memoz can serialize these changes and save them to a specified file on disk. The serialization process converts your JavaScript objects into a format suitable for storage (such as JSON).

- **Data Recovery**: Upon initializing a new instance of Memoz, you can specify the file path where your data is stored. If the file exists, Memoz will read the data from the file and load it into memory, allowing you to resume work with your previous data seamlessly.

### Example Usage

Here’s an example of how to set up persistence with Memoz:

```javascript
const Memoz = require('memoz');

// Initialize Memoz with a file path for persistence
const memoz = new Memoz({ filePath: './data.json' });

// Create a new document
memoz.createOne({ name: 'John Doe' });

// Save changes to disk
memoz.saveToDisk();

// Load existing data from disk when initializing
const memozWithPersistence = new Memoz({ filePath: './data.json' });
```

### Benefits of Disk Persistence
    - Data Durability: Ensures your data is safe from loss in case of application crashes or unexpected shutdowns.
    - Seamless Recovery: Quickly restore your data upon restarting your application without having to manually recreate it.
    - Flexibility: Allows you to choose different storage strategies based on your application’s needs, whether you want to work entirely in-memory or need to persist certain data.
  
By combining the speed of in-memory operations with the durability of disk storage, Memoz provides a powerful solution for applications that require both performance and reliability.

## Types

This package provides TypeScript types to help ensure type safety and improve development experience.

### Type Definitions

#### ComparisonOperator

The `ComparisonOperator` type defines the possible operators that can be used in queries.

```typescript
export type ComparisonOperator = '$eq' | '$neq' | '$gt' | '$gte' | '$lt' | '$lte' | '$in' | '$nin' | 'custom';
```

#### SimpleCondition<T>
The `SimpleCondition<T>` interface describes a basic condition for querying. It includes the field to compare, the operator to use, and the value to compare against. An optional customCompare function can also be provided.

```ts
export interface SimpleCondition<T> {
  field: keyof T;                 // The field of the object to compare
  operator: ComparisonOperator;    // The comparison operator
  value: any;                     // The value to compare against
  customCompare?: (a: any, b: any) => boolean; // Optional custom comparison function
}
```

#### ConditionNode<T>
The `ConditionNode<T>` type allows for creating complex query conditions by combining simple conditions with logical operators.
```ts
export type ConditionNode<T> =
  | { $and: ConditionNode<T>[] }   // Logical AND between conditions
  | { $or: ConditionNode<T>[] }    // Logical OR between conditions
  | SimpleCondition<T>;             // A simple condition
```

Example Usage
Here is an example of how you might use these types in your queries:

```ts
const condition: ConditionNode<MyDocumentType> = {
  $and: [
    { field: 'age', operator: '$gte', value: 18 },
    { $or: [
        { field: 'status', operator: '$eq', value: 'active' },
        { field: 'status', operator: '$eq', value: 'pending' }
      ]
    }
  ]
};

```
This example creates a condition to find documents where the `age` is greater than or equal to 18 and the `status` is either 'active' or 'pending'.

