import type { PropertyList } from "./PropertyList"

type SingleLevel<T extends string> = `${T}.${string}` extends never ? `${string}.${T}` extends never ? T : never : never;

type TopLevel<T, O = any> = (T extends `${infer Rest}.${string}` ? Rest : never) & keyof O; 
type ChildPathes<T, O = any, Path extends TopLevel<T,O> = TopLevel<T,O>> = (T extends `${Path}.${infer Rest}` ? Rest : T) & (PropertyList<O[keyof O]>);

type Functions


const test ={
    a: {
        b: {
            c: 1
        }
    },
    d: 1,
    e: {
        f: {
            g: 1
        }
    }
};

const n = 'a.b.c' as PropertyList<typeof test>;

type Test = TopLevel<typeof n, typeof test>;
type Test2 = ChildPathes<typeof n, typeof test, 'a'>;

const constructQueryHookMap = <Z,X extends PropertyList<Z>>(pathMap: {
    [key: string]: [<Q extends Z>(val:Z)=>val is Q, X[]]
}) => {
    const queryHookMap: {
        [key in TopLevel<Z>]: {
            function:(val: Z) => boolean;
            children: {
                []
            }
        } & PropertyList<Z> extends `${key & (string|number)}.${infer Rest}` ? Rest extends Z[key] {
            [ChildKey in Rest]: {
        }
    } = {
        
    }
    
}

const createProxy = <Z,X extends PropertyList<Z>>(target: Z, pathMap: {
    [key: string]: [<Q extends Z>(val:Z)=>val is Q, X[]]
}) => {
    const queryHookMap: {

    }
}