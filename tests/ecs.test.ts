import { ECS } from "../src/ecs";

test('constructor', ()=>{
    const ecs = new ECS({});
    // @ts-ignore
    expect(ecs.entities).toBeInstanceOf(Map);
    // @ts-ignore
    expect(ecs.entitiesByComponent).toBeInstanceOf(Map);
});

test('addEntity', ()=>{
    const ecs = new ECS<{id: number, x: number, y: number}>({});
    
    ecs.addEntity({id: 1, x: 0, y: 0});
    const entity = ecs.getEntity(1);
    // @ts-ignore
    expect(ecs.entities.get(1)).toBe(entity);
    
    expect(ecs.getEntitiesByComponent('x')[0]).toBe(entity);
    // @ts-ignore
    expect(ecs.getEntitiesByComponent('y')[0]).toBe(entity);
});

test('addEntity - entity with no components', ()=>{
    const ecs = new ECS<{id: number}>({});
    
    ecs.addEntity({id: 1});

    // @ts-ignore
    expect(ecs.entities.get(1)).toEqual({id: 1});
    // @ts-ignore
    expect(ecs.getEntitiesByComponent('x')).toEqual([]);
    // @ts-ignore
    expect(ecs.getEntitiesByComponent('y')).toEqual([]);
});

test('addEntities', ()=>{
    const ecs = new ECS<{id: number, x: number|null, y: number}>({});
    
    ecs.addEntity({id: 1, x: 0, y: 0});
    ecs.addEntity({id: 2, x: null, y: 0});
    
    expect(ecs.getEntitiesByComponent('x').length).toBe(1);
    expect(ecs.getEntitiesByComponent('y').length).toBe(2);
});

test('negativeValues', ()=>{
    const ecs = new ECS<{id: number, x?: number|null, y: number},never,null|undefined>({
        negativeValues: <Q extends null|undefined>(value: any): value is Q => {
            console.log('negative test: ',value);
            return value === null || value === undefined;
        }
    });
    
    ecs.addEntity({id: 1, x: 0, y: 0});
    ecs.addEntity({id: 2, x: null, y: 0});
    expect(ecs.getEntitiesByComponent('x').length).toBe(1);
    expect(ecs.getEntitiesByComponent('y').length).toBe(2);
});


test('default negativeValues', ()=>{
    const ecs = new ECS<{id: number, x?: number|null, y: number},never,null|undefined>();
    
    ecs.addEntity({id: 1, x: 0, y: 0});
    ecs.addEntity({id: 2, x: null, y: 0});
    expect(ecs.getEntitiesByComponent('x').length).toBe(1);
    expect(ecs.getEntitiesByComponent('y').length).toBe(2);
});

test('oddly specific negativeValues', ()=>{
    const ecs = new ECS<{id: number, x?: number|null, y: number},never,null|undefined|1>({
        negativeValues: [null, undefined, 1]
    });
    
    ecs.addEntity({id: 1, x: 0, y: 0});
    ecs.addEntity({id: 2, x: null, y: 0});
    ecs.addEntity({id: 3, x: 1, y: 0});
    expect(ecs.getEntitiesByComponent('x').length).toBe(1);
    
    expect(ecs.getEntitiesByComponent('y').length).toBe(3);
});