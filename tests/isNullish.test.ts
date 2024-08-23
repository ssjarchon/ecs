import { isNullish } from "../src/isNullish";

test('isNullish - null', ()=>{
    expect(isNullish(null)).toBe(true);
});

test('isNullish - undefined', ()=>{
    expect(isNullish(undefined)).toBe(true);
});

test('isNullish - 0', ()=>{
    expect(isNullish(0)).toBe(false);
});

test('isNullish - false', ()=>{
    expect(isNullish(false)).toBe(false);
});

test('isNullish - empty string', ()=>{
    expect(isNullish('')).toBe(false);
});

test('isNullish - empty array', ()=>{
    expect(isNullish([])).toBe(false);
});

test('isNullish - empty object', ()=>{
    expect(isNullish({})).toBe(false);
});

test('isNullish - NaN', ()=>{
    expect(isNullish(NaN)).toBe(false);
});

test('isNullish - Infinity', ()=>{
    expect(isNullish(Infinity)).toBe(false);
});

test('isNullish - -Infinity', ()=>{
    expect(isNullish(-Infinity)).toBe(false);
});

test('isNullish - Symbol', ()=>{
    expect(isNullish(Symbol())).toBe(false);
});

test('isNullish - function', ()=>{
    expect(isNullish(()=>{})).toBe(false);
});

test('isNullish - class', ()=>{
    expect(isNullish(class{})).toBe(false);
});