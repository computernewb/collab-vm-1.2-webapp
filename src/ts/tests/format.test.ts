import { Format } from '../format';

test('a string without any format specifiers in it is unaltered', () => {
	expect(Format('Hello World')).toBe('Hello World');
});

test('formatting a string works', () => {
	expect(Format('Hello, {0}!', 'World')).toBe('Hello, World!');
});

test('a cut off format specifier throws', () => {
	expect(() => Format('a{0', 1)).toThrow('Cutoff/invalid format specifier');
});

test('a malformed format specifier throws', () => {
	expect(() => Format('a{-0}', 1)).toThrow('Malformed format specifier');
	expect(() => Format('a{0-}', 1)).toThrow('Malformed format specifier');
	expect(() => Format('a{0ab}', 1)).toThrow('Malformed format specifier');
	expect(() => Format('a{ab0ab}', 1)).toThrow('Malformed format specifier');

	// Whitespace is not permitted inside a format specifier
	expect(() => Format('a{0 }', 1)).toThrow('Whitespace inside format specifier');
	expect(() => Format('a{ 0}', 1)).toThrow('Whitespace inside format specifier');
	expect(() => Format('a{ 0 }', 1)).toThrow('Whitespace inside format specifier');
});

test("a OOB format specifier doesn't work", () => {
	expect(() => Format('a {37}', 1)).toThrow('Argument index out of bounds');
});
