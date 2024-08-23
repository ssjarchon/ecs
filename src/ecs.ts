import { isNullish } from "./isNullish";
import { PropertyList } from "./PropertyList";

export type InvalidKeyName = 'constructor'|'hasOwnProperty'|'isPrototypeOf'|'propertyIsEnumerable'|'toLocaleString'|'toString'|'valueOf';

export type PrimitiveIdType<T extends string|number = string|number> = T; 

export type Entity<IdType extends PrimitiveIdType|{id:PrimitiveIdType} = PrimitiveIdType|{id:PrimitiveIdType}> = {
    id: IdType;
}

export class ECS<E extends Entity,
ExcludedComponentKeys extends PropertyList<E>|'id' = 'id',
ComponentName extends Exclude<keyof E, InvalidKeyName|ExcludedComponentKeys> = Exclude<keyof E, InvalidKeyName|ExcludedComponentKeys>
> {
    
    private entities: Map<E['id'],E & {_unwrap: ()=>E}>;
    private entitiesByComponent: Map<ComponentName, Set<E['id']>>;
    private weakMap: WeakMap<E, E & {_unwrap: ()=>E}>;
    
    toJSON(){
        return Array.from(this.entities.values()).map(e=>e._unwrap());
    }
    
    constructor({
        entities = [], 
    }:{
        entities?: E[],
        //excludedComponentKeys?: (ExcludedComponentKeys)[],
        
    }){
        this.weakMap = new WeakMap();
        this.entities = new Map();
        this.entitiesByComponent = new Map();
        for(let entity of entities){
            this.addEntity(entity);
        }
    }

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
                const thisKey = key as ComponentName & keyof E;
                const thisValue = value as E[typeof thisKey];
                if(isNullish(target[thisKey]) === isNullish(value)){
                    target[thisKey] = thisValue;
                    return true;
                }
                else if (!isNullish(value)){
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
        }) as E & { _unwrap: ()=>E };
        this.weakMap.set(entity, newresult);
        return newresult;
    }

    addEntity(entity: E){
        if(!['string','number','object'].includes(typeof entity.id)){
            throw new Error('Cannot add an entity without an id of the appropriate type');
        }

        
        this.entities.set(entity.id, this.generateProxyOfEntity(entity));
        Object.keys(entity).forEach((key)=>{
            let set = this.entitiesByComponent.get(key as ComponentName);
            if(!set){
                this.entitiesByComponent.set(key as ComponentName, new Set());
                set = this.entitiesByComponent.get(key as ComponentName);
            }
            if(!isNullish(entity[key as ComponentName & keyof E])){
                (set as Set<E['id']>).add(entity.id);
            }
        });
        return this.entities.get(entity.id);
    }
    getEntity(id: E['id']){
        const entity = this.entities.get(id);
        if(!entity){
            return undefined;
        }
        else{
            return entity;
        }
    }

    getEntitiesByComponent(componentName: ComponentName){
        const set = this.entitiesByComponent.get(componentName);
        if(!set){
            return [];
        }
        else{
            return Array.from(set.values()).map(k=>{
                const entity = this.entities.get(k);
                if(entity){
                    return entity;
                }
                else{
                    return undefined;
                }
            }).filter(e=>!!e) as unknown as (E & { _unwrap: ()=>E })[];
        }   
    }
    removeEntity(id: E['id']){
        this.entities.delete(id);
    }
}