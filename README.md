# string-encode.js [![Build Status](https://travis-ci.org/duzun/string-encode.js.svg?branch=master)](https://travis-ci.org/duzun/string-encode.js) [![codecov](https://codecov.io/gh/duzun/string-encode.js/branch/master/graph/badge.svg)](https://codecov.io/gh/duzun/string-encode.js)

Convert different types of JavaScript String to/from Uint8Array.

## Install

```sh
npm i -S string-encode
```

Or add it directly to the browser:

```html
<script src="https://unpkg.com/string-encode"></script>
<script>
const { str2buffer, buffer2str /* ... */ } = stringEncode;
// ...
</script>
```

## Usage

### str2buffer() and buffer2str()

The most important functions of this library are `str2buffer(str, asUtf8)` and `buffer2str(buf, asUtf8)`
for converting any `String`, including multibyte, to and from `Uint8Array`.

```js
import { str2buffer, buffer2str } from 'string-encode';

// When you know your string doesn't contain multibyte characters:
let buffer = str2buffer(binaryString, false);
// ... do something with buffer ...
let processedSting = buffer2str(buffer, false);

// When you know your string might contain multibyte characters:
let buffer = str2buffer(ut8EncodedStr, true);
// ...
let processedUtf8Sting = buffer2str(buffer, true);

// Let it guess whether to utf8 encode/decode or not:
let buffer = str2buffer(anyStr);
// ...
let processedSting = buffer2str(buffer);

```

#### Example

Simple `sha1` function for browser that works with `String`, using crypto, compatible with the PHP counterpart:

```js
import { str2buffer, toString } from 'string-encode';

async function sha1(str, enc='hex') {
    let buf = str2buffer(str, true);
    buf = await crypto.subtle.digest('SHA-1', buf);
    buf = new Uint8Array(buf);
    return toString.call(buf, enc);
}

// How to use the sha1() function:
await sha1('something'); // "1af17e73721dbe0c40011b82ed4bb1a7dbe3ce29"
await sha1('something', false); // "\u001añ~sr\u001d¾\f@\u0001\u001b\u0082íK±§ÛãÎ)"
await sha1('что-то'); // "991fe0590dfec23402d71c0e817bc7a7ab217e2b"
await sha1('что-то', 'base64'); // "mR/gWQ3+wjQC1xwOgXvHp6shfis="
```

### utf8Encode() and utf8Decode()

#### Example

Base64 encode/decode a multibyte string:

```js
import { utf8Encode, utf8Decode } from 'string-encode';

btoa(utf8Encode('⚔ или 😄')); // "4pqUINC40LvQuCDwn5iE"
utf8Decode(atob('4pqUINC40LvQuCDwn5iE')); // "⚔ или 😄"
```

### .toString()

If you want your `Uint8Array` to be one step closer to the Node.js's `Buffer`,
just add the `.toString()` method to it.

```js
import { toString } from 'string-encode';

let buf = Uint8Array.from([65, 108, 111, 104, 97, 44]);
buf.toString = toString; // the magic method

console.log(buf + ' world!');
console.log(buf.toString('hex')); // "416c6f68612c"
console.log(buf.toString('base64')); // "QWxvaGEs"
```

---

# The theory of `String` 😉

A JavaScript [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) is a unicode string, which means that it is a [list of unicode characters](https://en.wikipedia.org/wiki/List_of_Unicode_characters), not a list of bytes!
And it does not map one-to-one to an array of bytes without some encoding either.
This is because a unicode character requires 3 bytes to be able to encode any of the growing list of 137 000 symbols.
Thus `String` is not the best data type for working with binary data.

This is the main reason why the Node.js devs have come up with the [Buffer](https://nodejs.org/api/buffer.html) type.
Later on there have been invented the [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) standard to the rescue and the Node.js devs have adopted the new type as the parent type for the existing `Buffer` type (starting with Node.js v4).

Meanwhile there have been written many libraries to encode, encrypt, hash or otherwise transform the data, all using the plain `String` type that was available to the community since the beginning of JS.

Even some browser built-in functions that came before the `TypedArray` standard rely on the `String` type to do their encoding (eg. [btoa](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa) == "binary to ASCII").

## String kinds (or encodings)

Judging by content, there are a few kinds of JS `String`s used in almost all applications.

### Binary

Any `String` that do not contain multibyte characters can be considered a **binary** string.
In other words, each character's code is in the range [0..255].
These strings can be mapped one-to-one to arrays of bytes, which `Uint8Array`s basically are.

```js
const binStr = 'when © × ® = ?';
isBinary(binStr); // true
hasMultibyte(binStr); // false
btoa(binStr); // "qSBpcyCu"
str2buffer(binStr); // Uint8Array([169, 32, 105, 115, 32, 174])
```

Most old-fashion encoding functions accept only this type of strings (eg. `btoa`).

### Multibyte

In JS the most common string is a **Multibyte** string, with unicode characters,
which means some (or all) characters require more than a byte of memory.

```js
const mbStr = '$ ⚔ ₽ 😄 € ™';
isBinary(mbStr); // false
hasMultibyte(mbStr); // '⚔'
ord(mbStr[2]); // 9876
```

Most encoding algorithms would not accept a multibyte `String`.

### ASCII

A subset of binary strings is [**ASCII**](https://www.asciitable.com/) only strings,
which represent the class of strings with character codes in the range [0..127].
Each ASCII character can be represented with only 7 bits.

```js
const asciiStr = 'Any text using the 26 English letters, digits and punctuation!';
isASCII(asciiStr); // true

isASCII(binStr); // false
isASCII(utf8Str); // false
```

### UTF8 encoded

[UTF8](https://en.wikipedia.org/wiki/UTF-8) is the most used byte encoding of unicode/multibyte strings in computers today. It is the default encoding of web pages that travel over the wire (`content-type: text/html; charset=UTF-8`) and the default in many programing languages.
The important feature of UTF8 is that it is fully compatible with ASCII strings, which means any ASCII string is also a valid UTF8 encoded string. Unless you need symbols outside the ASCII table, this encoding is very compact, and uses more than a byte per character only where needed.

```js
const mbStr = '$ ⚔ ₽ 😄 € ™';
const utf8Str = utf8Encode(mbStr);
isBinary(utf8Str); // true
isUTF8(utf8Str); // true

isUTF8(asciiStr); // true

btoa(utf8Str); // '4oK9IOKalCAkIPCfmIQg4oKsIOKEog=='
str2buffer(utf8Str); // Uint8Array([226, 130, 189, 32, 226, 154, 148, 32, 36, 32, 240, 159, 152, 132, 32, 226, 130, 172, 32, 226, 132, 162])
```

Even though `utf8Str` is still a `String`, it is no longer a multibyte string.

---

## String Types Table

All table headers are functions exported by this library.

|           String          | guessEncoding | hasMultibyte | isBinary | isASCII | isUTF8 | utf8bytes |
|:-------------------------:|:-------------:|:------------:|:--------:|:-------:|:------:|:---------:|
|             ""            |     ascii     |     false    |   true   |   true  |  true  |     0     |
|  "English alphabet is 26" |     ascii     |     false    |   true   |   true  |  true  |     0     |
|       "$ ⚔ ₽ 😄 € ™"       |       mb      |      "⚔"     |   false  |  false  |  false |   false   |
| utf8Encode("$ ⚔ ₽ 😄 € ™") |      utf8     |     false    |   true   |  false  |  true  |     16    |
|      "when © × ® = ?"     |     binary    |     false    |   true   |  false  |  false |   false   |
|            "X×©"          |      utf8     |     false    |   true   |  false  |  true  |     2     |
|      utf8Decode("X×©")    |       mb      |      "Xש"    |   false  |  false  |  false |   false   |
|       "© binary? ×"       |     ~utf8     |     false    |   true   |  false  |  false | false \| 2 |

**Note 1:**

Sometimes you can't tell whether the string has been `utf8Encode`ed
or it is just a unicode string that by coincidence is also a valid utf8 string.

In the table above `"X×©"` could be the original string or could be the encoded string.

**Note 2:**

When slicing utf8 encoded strings, you might cut a multibyte character in half.
What you get as a result could be considered a valid utf8 string, with async utf8 characters at the edges.

In the table above `"© binary? ×"` is such a slice.
The `"©"` symbol could be the last byte of a utf8 encoded character,
and `"×"` - the first of the two bytes of another character.

---

To be continued...
