
export type PropertyList<E> = E extends Date ? never : E extends object ? {
    [K in keyof E]: K | (E[K] extends object ? `${K & string}.${string & PropertyList<E[K]>}` : never);
}[keyof E] : never;
