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