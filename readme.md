# Dead Simple ECS

A naive implementation of a dead simple Entity Component System, written in Typescript.

This implementation returns entities as Proxies, and detects when components are changed. The intended use case is that all entities are defined as:

```ts
type Entity {
    id: number|string|object;
    [componentName]?: ComponentData
}

type ComponentData = object;
```

All entities must have an id property, which should either be a primitive number, string, or an object; this id is expected to be unique and constant. Other properties are considered to be optional, and their keys are the names of Component types. Their values are objects containing arbitrary data.

Best practice would be to avoid storing anything in the component data that is not serializable, such as functions or symbols.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

## Installation

Installing the package is as simple as using the package manager of choice.

```bash
# Install dependencies
npm install ds-ecs
```

If you wish to install and build this package yourself, clone the repo and the simple run:

```bash
npm i
```

## Usage

```typescript
# Import the library
import { ECS } from 'de-ecs'

const myECS = new ECS({});

```

## Features

The basic ECS stores all entities within a Map, and maintains a number additional Maps and Sets so that queries for
entities with specific components are fast; a generic adhoc query function is also provided but should be expected to be slow and its use, especially in tight loops, is discouraged.

| Feature                      | Status        |
| ---------------------------- | ------------- |
| Adhoc Queries                | Completed     |
| Component Queries            | Completed     |
| Exclude Property List        | Completed     |
| Precompiled Queries          | Planned       |
| Adhoc Maintained Queries     | Planned       |
| Alternate Form - Observables | Planned       |
| Alternate Form - Signals     | Investigating |

## Contributing

Guidelines for contributing to the project.

1. Fork the repository.
2. Create a new branch (git checkout -b feature-branch).
3. Make your changes.
4. Commit your changes (git commit -m 'Add some feature').
5. Push to the branch (git push origin feature-branch).
6. Open a pull request.
