/* @flow */

/* Copyright (c) 2008-2009 Bjoern Hoehrmann <bjoern@hoehrmann.de>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE. */

/* Adapted from `http://bjoern.hoehrmann.de/utf-8/decoder/dfa/`. */

import type { BytesR } from "@capnp-js/bytes";

type u32 = number;

import { get } from "@capnp-js/bytes";

const typeTable = new Uint8Array([
   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
   9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9,
   7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
   7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
   8, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
   2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  10, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 3, 3,
  11, 6, 6, 6, 5, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
]);

const transitionTable = new Uint8Array([
   0, 12, 24, 36, 60, 96, 84, 12, 12, 12, 48, 72,
  12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
  12,  0, 12, 12, 12, 12, 12,  0, 12,  0, 12, 12,
  12, 24, 12, 12, 12, 12, 12, 24, 12, 24, 12, 12,
  12, 12, 12, 12, 12, 12, 12, 24, 12, 12, 12, 12,
  12, 24, 12, 12, 12, 12, 12, 12, 12, 24, 12, 12,
  12, 12, 12, 12, 12, 12, 12, 36, 12, 36, 12, 12,
  12, 36, 12, 12, 12, 12, 12, 36, 12, 36, 12, 12,
  12, 36, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
]);

export class Utf8DecodeError extends Error {}

function stringFromCodePoint(point: u32): string {
  if (point <= 0xffff) {
    return String.fromCharCode(point);
  } else {
    point -= 0x00010000;
    const hi = (point >>> 10) + 0xd800;
    const lo = (point & 0x000003ff) + 0xdc00;
    return String.fromCharCode(hi) + String.fromCharCode(lo);
  }
}

export function decode(bytes: BytesR): string | Error {
  let string = "";
  let i = 0;

  /* The algorithm is guaranteed to find a code point in 4 or fewer bytes, so I
     stop iterating when 4 bytes remain. */
  const end = bytes.length - 4;
  while (i < end) {
    let byte = get(i++, bytes);
    let type = typeTable[byte];
    let point = (0xff >> type) & byte;
    let state = transitionTable[type];
    while (state !== 0) {
      if (state === 12) {
        return new Utf8DecodeError();
      }
      byte = get(i++, bytes);
      type = typeTable[byte];
      point = (byte & 0x3f) | (point << 6);
      state = transitionTable[state + type];
    }

    string += stringFromCodePoint(point);
  }

  /* This time I need to check that I haven't run out of bytes as I consume each
     byte. Otherwise it's an exact copy of the above loop. */
  while (i < bytes.length) {
    let byte = get(i++, bytes);
    let type = typeTable[byte];
    let point = (0xff >> type) & byte;
    let state = transitionTable[type];
    while (state !== 0) {
      /* Note the `i === bytes.length` check. */
      if (state === 12 || i === bytes.length) {
        return new Utf8DecodeError();
      }
      byte = get(i++, bytes);
      type = typeTable[byte];
      point = (byte & 0x3f) | (point << 6);
      state = transitionTable[state + type];
    }

    string += stringFromCodePoint(point);
  }

  return string;
}
