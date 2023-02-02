// const esm = require('esm')(module);
// const se = esm('../string-encode');
const se = require('../dist/string-encode.js');

// Export functions to the global scope for simplicity
Object.assign(typeof global == 'undefined' ? window : global, se);
/*globals str2buffer, buffer2str, hex2buffer, buffer2hex, toString*/
/*globals hasMultibyte, isBinary, isASCII, isUTF8, utf8bytes, guessEncoding, utf8Encode*/

const { expect } = require('chai');

/*globals describe, it*/
describe('stringEncode', () => {
    const emptyStr = '';
    const hexStr = '00 11 01 ff abcd ef42';
    const asciiStr = 'Any text using the 26 latin letters, digits and punctuation!';
    const binStr = 'when © × ® = ?';
    const mbStr = '$ ⚔ ₽ 😄 € ™';
    const utf8Str = utf8Encode(mbStr);
    const mbUtf8Str = 'X×©'; // looks like UTF8 and unicode string at the same time
    const asyncUtf8Str = '© binary? ×';

    describe('.str2buffer(str, ?asUtf8), .buffer2str(buf, ?asUtf8)', () => {
        const binary = [
            emptyStr, asciiStr, binStr, asyncUtf8Str,
        ];
        const utf8 = [
            utf8Str, mbUtf8Str, asyncUtf8Str,
        ];
        const mb = [
            mbStr, mbUtf8Str,
        ];
        const canGuess = binary.concat([
            mbStr,
        ]);
        const wrongGuess = [
            utf8Str, mbUtf8Str, mbUtf8Str,
        ];

        it(`should convert any String to/from Uint8Array`, () => {
            // No need to encode binary string as utf8
            binary.forEach((str) => {
                let buf = str2buffer(str);
                expect(buf instanceof Uint8Array).to.be.true;
                expect(buf.length).to.equal(str.length);
                expect(buffer2str(buf)).to.equal(str);
                expect(toString.call(buf, false)).to.equal(str);

                // could encode as well
                buf = str2buffer(str, true);
                expect(buffer2str(buf, true)).to.equal(str);

                // or force no guess
                buf = str2buffer(str, false);
                expect(buffer2str(buf, false)).to.equal(str);
            });

            // Don't encode already encoded utf8 strings
            utf8.forEach((str) => {
                let buf = str2buffer(str, false);
                expect(buf instanceof Uint8Array).to.be.true;
                expect(buf.length).to.equal(str.length);
                expect(buffer2str(buf, false)).to.equal(str);
                expect(toString.call(buf, 'binary')).to.equal(str);
            });

            // Encode multibyte strings as utf8
            mb.forEach((str) => {
                let buf = str2buffer(str, true);
                expect(buf instanceof Uint8Array).to.be.true;
                expect(buf.length).to.be.greaterThan(str.length);
                expect(buffer2str(buf, true)).to.equal(str);
                expect(toString.call(buf, 'utf8')).to.equal(str);
            });

            canGuess.forEach((str) => {
                let buf = str2buffer(str);
                expect(buffer2str(buf)).to.equal(str);
                expect(toString.call(buf)).to.equal(str);
            });

            wrongGuess.forEach((str) => {
                let buf = str2buffer(str);
                expect(buffer2str(buf)).not.to.equal(str);
                expect(toString.call(buf)).not.to.equal(str);
            });
        });
    });

    describe('.hex2buffer(str), .buffer2hex(buf)', () => {
        it(`should convert any hex string to/from Uint8Array`, () => {
            let buf = str2buffer(mbUtf8Str);
            let hex = toString.call(buf, 'hex');
            let unhex = hex2buffer(hex);

            expect(hex).to.equal('58d7a9');
            expect(buffer2str(unhex, false)).to.equal(buffer2str(buf, false));

            // Ignore non-hex symbols
            unhex = hex2buffer('03 12 ef a8');
            hex = buffer2hex(unhex);
            expect(hex).to.equal('0312efa8');
        });
    });

    describe('.hasMultibyte(str)', () => {
        it(`should check for multibyte characters in a string`, () => {
            expect(Boolean(hasMultibyte(mbStr))).to.be.true;

            expect(hasMultibyte(emptyStr)).to.be.false;
            expect(hasMultibyte(asciiStr)).to.be.false;
            expect(hasMultibyte(binStr)).to.false;
            expect(hasMultibyte(utf8Str)).to.be.false;
            expect(hasMultibyte(asyncUtf8Str)).to.be.false;
            expect(hasMultibyte(mbUtf8Str)).to.be.false;
        });

        it(`should return the first multibyte character of a string when found`, () => {
            expect(hasMultibyte(mbStr)).to.equal('⚔');
        });
    });

    describe('.isBinary(str)', () => {
        it(`should return true when a string doesn't have any multibyte characters`, () => {
            expect(isBinary(emptyStr)).to.be.true;
            expect(isBinary(asciiStr)).to.be.true;
            expect(isBinary(binStr)).to.true;
            expect(isBinary(utf8Str)).to.be.true;
            expect(isBinary(asyncUtf8Str)).to.be.true;
            expect(isBinary(mbUtf8Str)).to.be.true;

            expect(isBinary(mbStr)).to.be.false;
        });
    });

    describe('.isASCII(str)', () => {
        it(`should return true when the string consists of ASCII characters only`, () => {
            expect(isASCII(emptyStr)).to.be.true;
            expect(isASCII(asciiStr)).to.be.true;

            expect(isASCII(binStr)).to.be.false;
            expect(isASCII(mbStr)).to.be.false;
            expect(isASCII(utf8Str)).to.be.false;
            expect(isASCII(asyncUtf8Str)).to.be.false;
            expect(isASCII(mbUtf8Str)).to.be.false;
        });
    });

    describe('.isUTF8(str)', () => {
        it(`should return true for valid UTF8 encoded strings`, () => {
            expect(isUTF8(emptyStr)).to.be.true;
            expect(isUTF8(asciiStr)).to.be.true;

            expect(isUTF8(utf8Str)).to.be.true;
            expect(isUTF8(mbUtf8Str)).to.be.true;

            expect(isUTF8(asyncUtf8Str)).to.be.false;

            expect(isUTF8(binStr)).to.be.false;
            expect(isUTF8(mbStr)).to.be.false;
        });
    });

    describe('.isHEX(str)', () => {
        it(`should return true when the string consists of ASCII characters only`, () => {
            expect(isHEX(emptyStr)).to.be.true;
            expect(isHEX(hexStr)).to.be.true;

            expect(isHEX(asciiStr)).to.be.false;
            expect(isHEX(binStr)).to.be.false;
            expect(isHEX(mbStr)).to.be.false;
            expect(isHEX(utf8Str)).to.be.false;
            expect(isHEX(asyncUtf8Str)).to.be.false;
            expect(isHEX(mbUtf8Str)).to.be.false;
        });
    });

    describe('.utf8bytes(str)', () => {
        it(`should return the number of utf8-encoded bytes in the string`, () => {
            expect(utf8bytes(emptyStr)).to.equal(0);
            expect(utf8bytes(asciiStr)).to.equal(0);

            expect(utf8bytes(binStr)).to.be.false;
            expect(utf8bytes(mbStr)).to.be.false;

            expect(utf8bytes(asyncUtf8Str)).to.be.false;
            expect(utf8bytes(utf8Str)).to.equal(16);
            expect(utf8bytes(mbUtf8Str)).to.equal(2);
        });
    });

    describe('.utf8bytes(str, true)', () => {
        it(`should return the number of utf8-encoded bytes in the string`, () => {
            expect(utf8bytes(emptyStr, true)).to.equal(0);
            expect(utf8bytes(asciiStr, true)).to.equal(0);

            expect(utf8bytes(utf8Str, true)).to.equal(16);
            expect(utf8bytes(mbUtf8Str, true)).to.equal(2);
            expect(utf8bytes(asyncUtf8Str, true)).to.equal(2);

            expect(utf8bytes(binStr, true)).to.be.false;
            expect(utf8bytes(mbStr, true)).to.be.false;
        });
    });

    describe('.guessEncoding(str)', () => {
        it(`should return the encoding name of a string (mb|binary|ascii|utf8|~utf8)`, () => {
            [
                [emptyStr, 'hex'],
                [asciiStr, 'ascii'],
                [utf8Str, 'utf8'],
                [mbUtf8Str, 'utf8'],
                [asyncUtf8Str, '~utf8'],
                [binStr, 'binary'],
                [mbStr, 'mb'],
            ].forEach(([str, encoding]) => {
                expect(guessEncoding(str)).to.equal(encoding);
            });
        });
    });

});
