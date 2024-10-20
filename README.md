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
import { Memoz } from "memoz";

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
    const docs = Array.from({ length: 1000 }, (_, i) => ({ name: `User ${i}`, age: i }));
    await memoz.createMany(docs);

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
}

// Start the boot process
boot();
```
