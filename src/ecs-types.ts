import { PropertyList } from "./PropertyList";


export type InvalidKeyName = 'constructor' | 'hasOwnProperty' | 'isPrototypeOf' | 'propertyIsEnumerable' | 'toLocaleString' | 'toString' | 'valueOf';

export type PrimitiveIdType<T extends string | number = string | number> = T;

export type Entity<IdType extends PrimitiveIdType = PrimitiveIdType> = {
    id: IdType;
};

export type ProxiedEntity<E extends Entity> = E & { _unwrap: () => E; };

export type Serializable = (Date | string | number | boolean | null | undefined) | Serializable[] | Exclude<{ [key: string]: Serializable; }, null>;

export type ECSOptions<E extends Entity,
    ExcludedComponentKeys extends PropertyList<E> | 'id' = 'id',
    NegativeValues extends Serializable = (null | undefined)
> = {
    /**
     * Entities to add to the ECS. If you are reconstructing an ECS from a serialized version, you can provide the entities here. Alternatively, you can add them later with the addEntity method.
     */
    entities?: E[];
    /**
     * The excludedComponentKeys parameter is used to determine what keys are not considered to be Components. The default is 'id', but you can change this to any value(s) by providing an array of keys.
     * 'id' will always be included in the excludedComponentKeys, so you do not need to include it.
     */
    excludedComponentKeys?: (ExcludedComponentKeys)[];
    /**
     * The negativeValues parameter is used to determine what values are considered to be a lack of a Component.
     * The default is null and undefined, but you can change this to any value(s) by providing an array of values.
     * Alternatively you can provide a test function. Note that any values provided are tested by value; objects will be serialized to JSON and compared.
     * If a test function is provided, it must be completely pure and have no side effects, so that it can be serialized and reconstructed.
     */
    negativeValues?: (NegativeValues extends Serializable ? (<Q extends NegativeValues>(value: any) => value is Q) : never) |
    string |
    (Exclude<NegativeValues extends Serializable ? NegativeValues : never, Function>[]);
};
