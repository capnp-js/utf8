/* @flow */

import type { BytesB } from "@capnp-js/bytes";

type uint = number;

export function stringBytes(string: string): uint {
  let length = 0;

  for (let i=0; i<string.length; ++i) {
    let c = string.charCodeAt(i);

    if (0xd800 <= c && c <= 0xdbff) {
      if (i < string.length - 1) {
        const lo = string.charCodeAt(i + 1);
        if (0xdc00 <= lo && lo <= 0xdfff) {
          /* Surrogate pair found. */
          ++i;
          c -= 0xd800;
          c <<= 10;
          c += lo - 0xdc00;
          c += 0x10000;
        }
      }
    }

    if (c <= 0x7f) {
      length += 1;
    } else if (c <= 0x07ff) {
      length += 2;
    } else if (c <= 0xffff) {
      length += 3;
    } else {
      length += 4;
    }
  }

  return length;
}

export function encode(string: string, target: BytesB): void {
  let j = 0;

  for (let i=0; i<string.length; ++i) {
    let c = string.charCodeAt(i);

    if (0xd800 <= c && c <= 0xdbff) {
      if (i < string.length - 1) {
        const lo = string.charCodeAt(i + 1);
        if (0xdc00 <= lo && lo <= 0xdfff) {
          /* Surrogate pair found. */
          ++i;
          c -= 0xd800;
          c <<= 10;
          c += lo - 0xdc00;
          c += 0x10000;
        }
      }
    }

    if (c <= 0x7f) {
      target[j++] = c;
    } else if (c <= 0x07ff) {
      target[j++] = 0xc0 | (c >>> 6);
      target[j++] = 0x80 | ((c >>> 0) & 0x3f);
    } else if (c <= 0xffff) {
      target[j++] = 0xe0 | (c >>> 12);
      target[j++] = 0x80 | ((c >>> 6) & 0x3f);
      target[j++] = 0x80 | ((c >>> 0) & 0x3f);
    } else {
      target[j++] = 0xf0 | (c >>> 18);
      target[j++] = 0x80 | ((c >>> 12) & 0x3f);
      target[j++] = 0x80 | ((c >>> 6) & 0x3f);
      target[j++] = 0x80 | ((c >>> 0) & 0x3f);
    }
  }
}
