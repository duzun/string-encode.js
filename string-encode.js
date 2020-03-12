/*requires Uint8Array*/
/*globals escape, unescape, encodeURI, decodeURIComponent, btoa*/

export const chr = String.fromCharCode;

export function ord(chr) {
    return chr.charCodeAt(0);
}

export function buffer2bin(buf) {
    buf = view8(buf);
    return chr.apply(String, buf);
}

export function buffer2hex(buf) {
    const bpe = buf.BYTES_PER_ELEMENT << 1;
    return buf.reduce((r, c) => r += (c >>> 0).toString(16).padStart(bpe,'0'), '');
}

export function buffer2str(buf, asUtf8) {
    if(typeof buf == 'string') return buf;
    buf = buffer2bin(buf);
    if (asUtf8 !== false && !isASCII(buf)) {
        if(asUtf8) {
            buf = utf8Decode(buf);
        } else if(asUtf8 == undefined) {
            try {
                buf = utf8Decode(buf);
            } catch(err) {}
        }
    }
    return buf;
}

export function str2buffer(str, asUtf8) {
    if(asUtf8 == undefined) {
        // Some guessing
        asUtf8 = hasMultibyte(str); // || !isASCII(str)
    }
    if (asUtf8) {
        str = utf8Encode(str);
    }
    return new Uint8Array(String(str).split('').map(ord));
}

const nonHexDigitRE = /[^0-9a-f]/g;

/**
 * Read a hex string into a buffer (Uint8Array), ignoring non-hex chars.
 *
 * @param   {String}  str
 *
 * @return  {Uint8Array}
 */
export function hex2buffer(str) {
    str = str.replace(nonHexDigitRE, '');
    let len = str.length;
    let ret = new Uint8Array((len + 1) >>> 1);

    for(let i=0; i<len; i+=2) {
        ret[i >>> 1] = parseInt(str.slice(i, i+2), 16);
    }

    return ret;
}

/**
 * This method is a replacement of Buffer.toString(enc)
 * for Browser, where Buffer is not available.
 *
 * @param   {String}  enc  'binary' | 'hex' | 'base64' | 'utf8' | undefined
 *
 * @return  {String}
 */
export function toString(enc) {
    // The Node.js equivalent would be something like:
    // if(typeof Buffer == 'function') {
    //     if(enc === false) enc = 'binary';
    //     if(enc === true) enc = 'utf8';
    //     return Buffer.from(this.buffer, this.byteOffset, this.byteLength).toString(enc);
    // }
    switch(enc) {
        case false:
        case 'binary': return buffer2bin(this);
        case 'hex': return buffer2hex(this);
        case 'base64': return btoa(buffer2bin(this));
        case 'utf8': enc = true; break;
    }
    return buffer2str(this, enc);
}

export function view8(buf, start, len) {
    // If buf is a Buffer, we still want to make it an Uint8Array
    if(!start && !len && buf instanceof Uint8Array && !buf.copy) return buf;
    start = start >>> 0;
    if(len == undefined) len = buf.byteLength - start;
    return new Uint8Array(buf.buffer, buf.byteOffset+start, len);
}

let _isLittleEndian;
export function isLittleEndian() {
    if(_isLittleEndian != undefined) return _isLittleEndian;
    _isLittleEndian = !!(new Uint8Array(new Uint16Array([1]).buffer)[0]);
    isLittleEndian = () => _isLittleEndian;
    return _isLittleEndian;
}

export function switchEndianness32(i) {
    return (i&0xFF)<<24
        | (i&0xFF00)<<8
        | i>>8&0xFF00
        | i>>24&0xFF
    ;
}

export function guessEncoding(str) {
    if(hasMultibyte(str)) return 'mb';

    // @todo: test which is faster, utf8bytes() or RegExp
    // if(isASCII(str)) return 'ascii';
    // if(isUTF8(str)) return 'utf8';

    let mbLen = utf8bytes(str);
    if(mbLen) return 'utf8';
    if(mbLen === 0) return 'ascii';
    if(mbLen === false) {
        mbLen = utf8bytes(str, true);
        if(mbLen) return '~utf8'; // UTF8, but with async characters at the edges
    }
    return 'binary';
}

const hasMultibyteRE = /([^\x00-\xFF])/;
const isASCIIRE = /^[\x00-\x7F]*$/;
const isUTF8RE = /^(?:[\x00-\x7F]|[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF][\x80-\xBF]|[\xF0-\xF7][\x80-\xBF][\x80-\xBF][\x80-\xBF])*$/;

export function hasMultibyte(str) {
    let m = hasMultibyteRE.exec(str);
    return m ? m[1] : false;
}

export function isBinary(str) {
    return !hasMultibyte(str);
}

export function isASCII(str) {
    return isASCIIRE.test(str);
}

export function isUTF8(str) {
    return isUTF8RE.test(str);
}

export function utf8bytes(str, allowAsyncChars) {
    var l = str.length
    ,   i = 0
    ,   u = 0
    ,   c
    ,   a = -1
    ,   asy = +!!allowAsyncChars
    ;

    for( ; i < l ; ) {
        c = str.charCodeAt(i++);
        if( c < 0x80 ) continue; // ASCII
        if( 0xFF <= c ) return false; // has multi-byte

        // async UTF8 character
        if( (c & 0xC0) == 0x80 ) {
            // Ignore async UTF8 characters at the beginning
            if(asy == i) {
                ++u;
                ++asy;
                continue;
            }
            return false;
        }

        // Check sync UTF8 bytes
        a   = (c & 0xE0) !== 0xC0
            ? (c & 0xF0) !== 0xE0
            ? (c & 0xF8) !== 0xF0
            ? false
            : 3
            : 2
            : 1
        ;
        if(!a) return false; // Not an ASCII, nor sync UTF8 bytes

        for( ; (u += 1) && a-- && i < l; ) {
            c = str.charCodeAt(i++);
            if((c & 0xC0) !== 0x80) {
                return false; // Not an ASCII, nor sync UTF8 bytes
            }
        }
    }

    // Ignore async UTF8 characters at the end
    if(~a && !allowAsyncChars) return false;

    return u;
}

export function utf8Encode(str) {
    return unescape(encodeURI(str));
}

export function utf8Decode(str) {
    return decodeURIComponent(escape(str));
}
