import { Entity, Serializable, ProxiedEntity, InvalidKeyName, ECSOptions } from "./ecs-types";
import { PropertyList } from "./PropertyList";

export class ECS<E extends Entity = {id: string, [key: string]: any},
ExcludedComponentKeys extends PropertyList<E>|'id' = 'id',
NegativeValues extends (Serializable | string) = (null | undefined)
> {
    private entities: Map<E['id'],ProxiedEntity<E>>;
    private excludedComponentKeys: Set<ExcludedComponentKeys>;
    private entitiesByComponent: Map<Exclude<keyof E, InvalidKeyName|ExcludedComponentKeys>, Set<E['id']>>;
    private weakMap: WeakMap<E, ProxiedEntity<E>>;
    private isNegative: <T, Z extends T = T>(value: any) => value is Z;

    /**
     * Returns the ECS in a format that is prepared to be serialized to JSON. This format is identical to the ECSOptions format, allowing it to be used to recreate the ECS.
     *
     * @returns JSONString<ECSOptions<E,ExcludedComponentKeys, NegativeValues>>
     */
    public serialize(): ECSOptions<E,ExcludedComponentKeys, NegativeValues>{
        
        const result = {
            excludedComponentKeys: Array.from(this.excludedComponentKeys),
            entities: Array.from(this.entities.values()).map(e=>e._unwrap()),
            negativeValues: this.isNegative.toString() as NegativeValues
        };
        
       return result as ECSOptions<E,ExcludedComponentKeys, NegativeValues>;
    }
    
    private static reconstructIsNegativeFunction(negativeValues: string|Function){
        let reconstructedFunction: <T, Z extends T = T>(value: any) => value is Z;
            try{
                if(typeof negativeValues === 'function'){
                    reconstructedFunction = new Function('value', negativeValues.toString().slice(negativeValues.toString().indexOf('{')+1,negativeValues.toString().lastIndexOf('}'))) as <T, Z extends T = T>(value: any) => value is Z;
                }
                else{
                    reconstructedFunction =  new Function('value', negativeValues) as <T, Z extends T = T>(value: any) => value is Z;
                }
                        }
            catch(e){
                throw new Error('The negativeValues string could not be evaluated as a function');
            }
        return reconstructedFunction;
    }

    public constructor(options?:Partial<ECSOptions<E,ExcludedComponentKeys,NegativeValues>>){
        options?.negativeValues?.length;
        const theseOptions = options || {
            entities: [] as E[],
            excludedComponentKeys: ['id'] as ExcludedComponentKeys[],
            negativeValues: [null, undefined]
        } as ECSOptions<E,ExcludedComponentKeys,NegativeValues>;
        theseOptions.entities = theseOptions.entities || [];
        theseOptions.excludedComponentKeys = theseOptions.excludedComponentKeys || ['id'] as ExcludedComponentKeys[];
        theseOptions.negativeValues = theseOptions.negativeValues;// || ([null, undefined] as unknown as NegativeValues);
        
        this.weakMap = new WeakMap();
        
        this.excludedComponentKeys = new Set(theseOptions.excludedComponentKeys);
        if(!this.excludedComponentKeys.has('id' as ExcludedComponentKeys)){
            this.excludedComponentKeys.add('id' as ExcludedComponentKeys);
        }
        this.entities = new Map();
        this.entitiesByComponent = new Map();

        if(typeof theseOptions.negativeValues === 'string' || typeof theseOptions.negativeValues === 'function'){
            
            this.isNegative = ECS.reconstructIsNegativeFunction(theseOptions.negativeValues);
        }
        else if(theseOptions.negativeValues === undefined || Array.isArray(theseOptions.negativeValues)){
            const goon = crypto.randomUUID();
            this.isNegative = ECS.reconstructIsNegativeFunction(`return ${JSON.stringify(Array.isArray(theseOptions.negativeValues) && theseOptions.negativeValues.length > 0 ? theseOptions.negativeValues : [null, undefined], (key, val)=>{
                if(val === undefined){
                    return goon;
                }
                return val;
            }).replaceAll(`"${goon}"`,'undefined')}.some(k=>k===value || (typeof k === 'object' && typeof value === 'object' && JSON.stringify(k) === JSON.stringify(value)))`);
        }
        else{
            throw new Error('negativeValues must be a string, function, or array');
        }
        
        for(let i = 0; i < theseOptions.entities.length; i++){
            this.addEntity(theseOptions.entities[i]);
        }
    }

    /**
     * Creates the proxy for the entity. 
     * This is a private method and should not be called directly. 
     * The proxy detects set operations on the direct children, excluding the id, _unwrap, and any keys in the excludedComponentKeys set. It also updates the entitiesByComponent map to reflect the changes.
     * @param entity 
     * @returns ProxiedEntity<E>
     */
    private generateProxyOfEntity(entity: E){
        
        let result = this.weakMap.get(entity);
        if(result){
            return result;
        }
        const newresult = new Proxy(entity, {
            get: (target, key) => {
                if(key === '_unwrap'){
                    return ()=>target;
                }
                return Reflect.get(target, key);
            },
            set: (target, key, value) => {
                if(key === 'id'){
                    throw new Error('Cannot change the id of an entity');
                }
                if(key === '_unwrap'){
                    throw new Error('Cannot change the _unwrap of an entity');
                }
                if(this.excludedComponentKeys.has(key as ExcludedComponentKeys)){
                    target[key as ExcludedComponentKeys] = value;
                    return true;
                }
                const thisKey = key as Exclude<keyof E, InvalidKeyName|ExcludedComponentKeys> & keyof E;
                const thisValue = value as E[typeof thisKey];
                if(
                    this.isNegative(target[thisKey]) === this.isNegative(value)){
                    target[thisKey] = thisValue;
                    return true;
                }
                else if (!this.isNegative(value)){
                    target[thisKey] = thisValue;
                    this.entitiesByComponent.get(thisKey)?.delete(target.id);
                    return true;
                }
                else{
                    target[thisKey] = thisValue;
                    const set = this.entitiesByComponent.get(thisKey);
                    if(set){
                        set?.add(target.id);
                    }
                    else{
                        this.entitiesByComponent.set(thisKey, new Set([target.id]));
                    }
                    return true;
                }
            }
        }) as ProxiedEntity<E>;
        this.weakMap.set(entity, newresult);
        return newresult;
    }

    /**
     * This method reindexes an entity in the ECS. This is useful if you have changed a component on an entity in a way that the proxy cannot detect.
     * If you are using this frequently, you may want to consider what you are doing; this is only for very advanced use cases.
     * @param entity 
     */
    public indexEntity(entity: E){
        Object.keys(entity).forEach((key)=>{
            
            if(this.excludedComponentKeys.has(key as ExcludedComponentKeys)){
                return;
            }
            const thisKey = key as Exclude<keyof E, InvalidKeyName|ExcludedComponentKeys> & keyof E;
            let set = this.entitiesByComponent.get(thisKey);
            let existingSet = true;
            if(!set){
                this.entitiesByComponent.set(thisKey, new Set());
                set = this.entitiesByComponent.get(thisKey);
                existingSet = false;
            }
            if(!this.isNegative<Entity, Entity&{[key in typeof thisKey]: NegativeValues}>(entity[thisKey])){
                (set as Set<E['id']>).add(entity.id);
            }
            else if(existingSet){
                (set as Set<E['id']>).delete(entity.id);
            }
        });
    }

    /**
     * Adds an entity to the ECS
     * This method will return the id of the entity that was added. All indexing to internal maps is automatic.
     * @param entity 
     * @returns ProxiedEntity<E>
     */
    public addEntity(entity: E){
        if(!['string','number'].includes(typeof entity.id)){
            throw new Error('Cannot add an entity without an id of the appropriate type');
        }
        const e = this.generateProxyOfEntity(entity);
        if(this.entities.has(e.id)){
            throw new Error(`An entity with the id ${e.id} already exists in the ECS`);
        }
        this.entities.set(e.id, e);
        this.indexEntity(e);
        return this.entities.get(e.id) as ProxiedEntity<E>;
    }

    /**
     * Gets an entity from the ECS
     * @param id The id of the entity to get
     * @returns ProxiedEntity<E>|undefined
     */
    public getEntity(id: E['id']){
        const entity = this.entities.get(id);
        if(!entity){
            return undefined;
        }
        else{
            return entity;
        }
    }

    /**
     * Gets all entities in the ECS that have a component with the given name
     * Nullish values for those components are not included in the result. Utilizes internal maps for faster access.
     * @param componentName
     *   
     * */
    public getEntitiesByComponent<Name extends Exclude<keyof E, InvalidKeyName|ExcludedComponentKeys> & string>(componentName: Name) {
        const set = this.entitiesByComponent.get(componentName);
        if(!set){
            return [];
        }
        else{
            // The cleanupList should remain empty if all is going well; if it gets populated, that would indicate that indexes are getting out of sync in some way.
            let cleanupList: E['id'][] = [];
            const result = Array.from(set.values()).map(k=>{
                const entity = this.entities.get(k);
                if(entity){
                    return entity;
                }
                else{
                    cleanupList.push(k);
                    return undefined;
                }
            }).filter(e=>!!e);
            if(cleanupList.length > 0){
                console.warn('Cleaning up entities that were not found in the main entity map.');
                cleanupList.forEach(k=>set.delete(k));
            }
            
            
            
            
            return result as ProxiedEntity<E & {
                [z in Name]: Exclude<E[z], NegativeValues>
             }>[];
            
            
            /* as (ProxiedEntity<E & {
                [z in Name]: 
                NegativeValues extends Array<infer T> ? Exclude<E[z], T> : NegativeValues extends ((value: any)=>value is infer Z) ? Exclude<E[z], Z> : Exclude<E[z], NegativeValues>
            }>)[];*/
        }   
    }

    /**
     * Performs an adhoc filter on the entities in the ECS and returns the entities that match the predicate in array format.
     * @param filter 
     * @returns 
     */
    public getAdhocEntities<A extends E>(filter: (entity: E)=>entity is ProxiedEntity<A>): ProxiedEntity<A>[]{
        return Array.from(this.entities.values()).filter(filter);
    }

    /**
     * Removes an entity from the ECS
     * @param id The id of the entity to remove
     * @returns boolean True if the entity was removed, false if it was not found
     */
    public removeEntity(id: E['id']): boolean {
        this.entitiesByComponent.forEach((set)=>{
            set.delete(id);
        });
        return this.entities.delete(id);
    }

    /**
     * Clears all entities from the ECS
     */
    public clear(): void {
        this.entities.clear();
        this.entitiesByComponent.clear();
    }
}