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
import { Memoz, FuzzySearchOptions } from "memoz";

interface IUser {
    readonly id?: string;
    name: string;
    age: number;
}

const memoz = new Memoz<IUser>({
    persistToDisk: true,  // to allow persist data on disk - default false
    storagePath: './data', // the location to persist data - default './data'
    useMutex: true, //  Whether to use a mutex for thread safety - default false
});


async function boot() {
    // Uncomment to create and store users in the database
    // const docs = Array.from({ length: 1000 }, (_, i) => ({ name: `User ${i}`, age: i }));
    // await memoz.createMany(docs);

    // Loop to get users with pagination and sorting to test caching
    const totalPages = 2; // Define the total number of pages to iterate over
    const usersPerPage = 10; // Number of users per page

    for (let index = 0; index < totalPages; index++) {
        try {
            const users = await memoz
                .getMany() // Retrieve all users
                .sort([{ name: 'asc' }]) // Sort users by name in ascending order
                .skip(index * usersPerPage) // Calculate the correct offset for pagination
                .limit(usersPerPage); // Limit the number of users retrieved

            console.log(`Page ${index + 1}:`, users); // Log the users for the current page
        } catch (error) {
            console.error(`Error retrieving users for page ${index + 1}:`, error); // Handle any errors
        }
    }

    // support regex 
      const user = await memoz.getOne({
        field: 'name',
        operator: '$regex',
        value: { $regex: '999', $options: 'i' }, // the $regex can be new RegExp
    });

    console.log(user);


      {
    const options: FuzzySearchOptions = {
      maxDistance: 2,
      scoringStrategy: 'default',
    };

    // Perform a fuzzy search
    const results = await memoz.fuzzySearch('User 999', ['age', 'name'], options, 5);

    console.log(results);
  }

  {
    const options: FuzzySearchOptions = {
      maxDistance: 2,
      scoringStrategy: 'tokenCount',
      fieldWeights: { title: 2, content: 1 }, // Title matches count more
    };

    // Perform a fuzzy search
    const results = await memoz.fuzzySearch('User 999', ['age', 'name'], options);
    console.log(results.slice(0, 2));
  }
  {
    const customScoringFn = (token: string, fieldToken: string, distance: number, fieldWeight: number) => {
      const baseScore = fieldWeight * (1 / (distance + 1)); // Decrease score as distance increases
      const titleBonus = fieldToken.includes(token) ? 1 : 0; // Bonus if the fieldToken contains the token
      return baseScore + titleBonus; // Total score
    };

    // Example usage
    const options: FuzzySearchOptions = {
      maxDistance: 2,
      scoringStrategy: 'custom',
      customScoringFn,
    };

    // Perform a fuzzy search
    const results = await memoz.fuzzySearch('User 999', ['age', 'name'], options);
    console.log(results.slice(0, 2));
  }
}

// Start the boot process
boot();
```
