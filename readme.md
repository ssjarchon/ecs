# Dead Simple ECS

A naive implementation of a dead simple Entity Component System, written in Typescript.

This is intended to be, as the title says, dead simple to use. No having to use get and set functions for properties, or learning a query language.

This implementation returns entities as Proxies, and detects when components are changed. The intended use case is that all entities are defined as:

```ts
type Entity {
    id: number|string;
    [componentName]?: ComponentData
}

type ComponentData = object;
```

All entities must have an id property, which should either be a primitive number or string; this id is expected to be unique and constant for a given entity. Other properties are considered to be optional, and their keys are the names of Component types. Their values are usually objects containing arbitrary data, but can be primitives such as strings, numbers, booleans, dates, etc.. Nullishness determines if an Entity 'has' a component or not. Either Null or Undefined. This can be overwritten in the options. You can exclude keys from being considered components if needed.

Best practice would be to avoid storing anything in the component data that is not serializable, such as functions or symbols.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Internals](#internals)
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

To create your Dead Simple Entity Component System, simply new it up as follows.

```typescript
import { ECS } from "de-ecs";

const myECS = new ECS();
```

You will almost certainly want to pass some type information to the ECS. It accepts 3 generic parameters, the first being the shape of Entities, the second being the excludedComponentKeys, and the third is the isNegative option.

Here is a larger example:

```typescript
import { ECS } from 'de-ecs'

type Components = {
    actor: {

    };
    hostility: 'Hostile'|'Neutral'|'Ally'|'?';
    controller: {
        controlledByType: 'player'|'computer';
        controlledAs: 'Pet'|'Ally'|'Summon'|'Character'|null;
        controllerId: null|string;
    };
    position: {
        vector: {
            x: number;
            y: number;
            velocity: number;
        },
    };
    graphics:{
        isVisible: boolean;
        textureURL?: string;
        currentAnimation?: string;
        lastAnimatedOn?: number;
    };
}

type Entity {
    id: number;
    name: string;
    timestamp: Date;
} & Partial<Components>;

const myECS = new ECS<
Entity,
'timestamp'|'name',
null|undefined|'?'>({
    excludedComponentKeys: ['timestamp','name'],
    negativeValues: <Z>(val: any): val is Z => val === undefined || val === null || val === '?'
});

```

### Exclude Properties as Component Keys

Occasionally you may wish to exclude a property of your entity (other than 'id') from being considered a component key. To do so, pass it in the constructor, like so:

```typescript
const myECS = new ECS({
  excludedComponentKeys: ["additionalData"],
});
```

The name 'id' is always considered an excluded key, and you do not need to include it in the array.

### Query Entities by Component

This is the primary way and advantage currently to this ECS; you can query easily by the existence (or simply the exclusion by the negativeValues clause). This makes use of stored internal maps for fast data fetching. Queries returned in this way will return with a type that matches this existence (or when negativeValues is defined, the exclusion of its type predicate.)

```typescript
const entitiesWithAnimationComponent =
  myECS.getEntitiesByComponent("animationComponent");
```

### Query Entities by Id

To get a specific entity by its id, use the getEntity method.

```typescript
const myEntity = myECS.getEntity(343);
```

### Query by Adhoc Predicate

Note that adhoc queries cannot make use of cached maps, and so should be avoided, especially in tight loops. Consider if a query by Component followed by a further filtering would be more effective (it probably would be.) You can always create a new Component, even if its value is as simple as a boolean true.

```typescript
type Entity = {
  id: string;
  animation?: {
    active: boolean;
  };
  transition?: {
    transitioning: boolean;
  };
};

const myAnimatingEntities = myECS.getAdhocEntities(
  (ent) => ent.animation?.active || ent.transition?.transitioning
);
```

## Internals

Behind the scenes, the ECS is really just a Map of entities, utilizing their keys, and an additional Map of Sets of those keys. These Sets are not weakSets, (because weakSets cannot be iterated over and as such are not useful here.) As such, these are updated on set actions to the proxied components. There is a weakMap used for the detection of entities that are already proxied, so that the original proxy can be returned (so proxies don't get proxied themselves.)

Note that when quantities are small, it would be expected that the ECS would actually be slower than a filter predicate on an array; the ECS isn't expected to show performance advantages until tens of thousands of entities exist. In small applications, the primary advantage is simply the organizational advantage of the component model.

Proxies are known to be slow in V8 and similar engines; features where alternatives to proxies are planned, but the idea was to make this as simple to use as possible.

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

### Precompiled Queries

This is a planned feature, where queries will be precomputed and dedicated cache maps maintained for them. This is intended to take a form such as:

```typescript
type PrecomputedQuery<Z extends Entity> = [
  <Q extends Entity>(val: Q) => Q is Z,
  PropertyList<Entity>[]
];
```

Where the first member of the tuple is the actual predicate that determines the if the entity qualifies, and the second is an array of property paths to 'listen' to for determining recalculation of the predicate.

## Contributing

Guidelines for contributing to the project.

1. Fork the repository.
2. Create a new branch (git checkout -b feature-branch).
3. Make your changes.
4. Commit your changes (git commit -m 'Add some feature').
5. Push to the branch (git push origin feature-branch).
6. Open a pull request.
