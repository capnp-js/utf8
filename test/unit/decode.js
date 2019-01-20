/* @flow */

import test from "ava";

import { Utf8DecodeError, decode } from "../../src/decode";

//TODO: Round trip some foreign language text

test("Octet single", t => {
  t.plan(192);

  const value = new Uint8Array(2);
  value[1] = 0;
  let i = 0;

  /* 00000000 to 01111111 */
  for (; i<128; ++i) {
    value[0] = i;
    t.false(decode(value) instanceof Utf8DecodeError);
  }

  /* 10000000 to 10111111 */
  /* An earlier 11... octet must anticipate these octets. */
  for (; i<192; ++i) {
    value[0] = i;
    t.true(decode(value) instanceof Utf8DecodeError);
  }
});

test("Octet double", t => {
  t.plan(32 * 256);

  const value = new Uint8Array(3);
  value[2] = 0;
  let i = 192;

  /* Single octet bits: 0xxxxxxx          =>     xxxxxxx
   * Double octet bits: 110yyyyy 10zzzzzz => yyyyyzzzzzz
   * Given a double octet beginning yyyyyzzzzzz = 0000..., the double's bit
   * pattern yzzzzzz fits into a single's bit pattern xxxxxxx. All double octets
   * beginning yyyyyzzzzzz = 0000... are therefore invalid. */
  /* 11000000 to 11000001 */
  for (; i<194; ++i) {
    value[0] = i;
    let j = 0;

    /* 00000000 to 01111111 */
    /* The preceding 110... octet requires a single, following 10... octet. */
    for (; j<128; ++j) {
      value[1] = j;
      t.true(decode(value) instanceof Utf8DecodeError);
    }

    /* 10000000 to 10111111 */
    for (; j<192; ++j) {
      value[1] = j;
      t.true(decode(value) instanceof Utf8DecodeError);
    }

    /* 11000000 to 11111111 */
    for (; j<256; ++j) {
      value[1] = j;
      t.true(decode(value) instanceof Utf8DecodeError);
    }
  }

  /* 11000010 to 11011111 */
  for (; i<224; ++i) {
    value[0] = i;
    let j = 0;

    /* 00000000 to 01111111 */
    /* The preceding 110... octet requires a single, following 10... octet. */
    for (; j<128; ++j) {
      value[1] = j;
      t.true(decode(value) instanceof Utf8DecodeError);
    }

    /* 10000000 to 10111111 */
    for (; j<192; ++j) {
      value[1] = j;
      t.false(decode(value) instanceof Utf8DecodeError);
    }

    /* 11000000 to 11111111 */
    for (; j<256; ++j) {
      value[1] = j;
      t.true(decode(value) instanceof Utf8DecodeError);
    }
  }
});
//TODO: Comment on how canonicalization is not handled by my implementation.

test("Octet triple", t => {
  const upper = 128 + 32 + 32*256 + 64;
  const lower = 15*128 + 15*32*128 + 15*32*64 + 15*32*64 + 1*32 + 14*32*256 + 15*64;
  t.plan(upper + lower);

  const value = new Uint8Array(4);
  value[3] = 0;
  let i = 224;

  /* 11100000 alone */
  for (; i<225; ++i) {
    value[0] = i;
    let j = 0;

    /* 00000000 to 01111111 */
    for (; j<128; ++j) {
      value[1] = j;
      let k = 128;

      /* The `j` bits should trigger an error regardless of `k`. */
      value[2] = k;
      t.true(decode(value) instanceof Utf8DecodeError);
    }

    /* Double octet bits: 110vvvvv 10wwwwww          =>      vvvvvwwwwww
     * Triple octet bits: 1110xxxx 10yyyyyy 10zzzzzz => xxxxyyyyyyzzzzzz
     * Given a triple octet beginning xxxxyyyyyyzzzzzz = 00000..., the triple's
     * bit pattern yyyyyzzzzzz fits into a double's bit pattern vvvvvwwwwww. All
     * triple octets beginning xxxxyyyyyyzzzzzz = 00000... are therefore
     * invalid. There exists an analogous argument where single octets
     * degenerate like double octets, but this yields a
     * xxxxyyyyyyzzzzzz = 00000000..., which is contained within the prior case.
     */
    /* 10000000 to 10011111 */
    for (; j<160; ++j) {
      value[1] = j;
      let k = 128;

      /* The `j` bits should trigger an error regardless of `k`. */
      value[2] = k;
      t.true(decode(value) instanceof Utf8DecodeError);
    }

    /* 10100000 to 10111111 */
    for (; j<192; ++j) {
      value[1] = j;
      let k = 0;

      /* 00000000 to 01111111 */
      for (; k<128; ++k) {
        value[2] = k;
        t.true(decode(value) instanceof Utf8DecodeError);
      }

      /* 10000000 to 10111111 */
      for (; k<192; ++k) {
        value[2] = k;
        t.false(decode(value) instanceof Utf8DecodeError);
      }

      /* 11000000 to 11111111 */
      for (; k<256; ++k) {
        value[2] = k;
        t.true(decode(value) instanceof Utf8DecodeError);
      }
    }

    /* 11000000 to 11111111 */
    for (; j<256; ++j) {
      value[1] = j;
      let k = 128;

      /* The `j` bits should trigger an error regardless of `k`. */
      value[2] = k;
      t.true(decode(value) instanceof Utf8DecodeError);
    }
  }

  /* 11100001 to 11101111 */
  for (; i<240; ++i) {
    value[0] = i;
    let j = 0;

    /* 00000000 to 01111111 */
    for (; j<128; ++j) {
      value[1] = j;
      let k = 128;

      /* The `j` bits should trigger an error regardless of `k`. */
      value[2] = k;
      t.true(decode(value) instanceof Utf8DecodeError);
    }

    /* 10000000 to 10011111 */
    for (; j<160; ++j) {
      value[1] = j;
      let k = 0;

      /* 00000000 to 01111111 */
      for (; k<128; ++k) {
        value[2] = k;
        t.true(decode(value) instanceof Utf8DecodeError);
      }

      /* 10000000 to 10111111 */
      for (; k<192; ++k) {
        value[2] = k;
        t.false(decode(value) instanceof Utf8DecodeError);
      }

      /* 11000000 to 11111111 */
      for (; k<256; ++k) {
        value[2] = k;
        t.true(decode(value) instanceof Utf8DecodeError);
      }
    }

    /* 10100000 to 10111111 */
    if (i === 237) {
      /* 0xd800 - 0xdfff are forbidden */
      for (; j<192; ++j) {
        value[1] = j;
        let k = 128;

        /* The `j` bits should trigger an error regardless of `k`. */
        value[2] = k;
        t.true(decode(value) instanceof Utf8DecodeError);
      }
    } else {
      for (; j<192; ++j) {
        value[1] = j;
        let k = 0;

        /* 00000000 to 01111111 */
        for (; k<128; ++k) {
          value[2] = k;
          t.true(decode(value) instanceof Utf8DecodeError);
        }

        /* 10000000 to 10111111 */
        for (; k<192; ++k) {
          value[2] = k;
          t.false(decode(value) instanceof Utf8DecodeError);
        }

        /* 11000000 to 11111111 */
        for (; k<256; ++k) {
          value[2] = k;
          t.true(decode(value) instanceof Utf8DecodeError);
        }
      }
    }

    /* 11000000 to 11111111 */
    for (; j<256; ++j) {
      value[1] = j;
      let k = 128;

      /* The `j` bits should trigger an error regardless of `k`. */
      value[2] = k;
      t.true(decode(value) instanceof Utf8DecodeError);
    }
  }
});

test("Octet quad", t => {
  const upper = 1*128 + 1*16 + 1*48*128 + 1*48*64*128 + 1*48*64*64 + 1*48*64*64 + 1*48*64 + 1*64;
  const middle = 3*128 + 3*64*128 + 3*64*64*128 + 3*64*64*64 + 3*64*64*64 + 3*64*64 + 3*64;
  const lower = 1*128 + 1*16*128 + 1*16*64*128 + 1*16*64*64 + 1*16*64*64 + 1*16*64 + 1*112;
  t.plan(upper + middle + lower + 3);

  const value = new Uint8Array(5);
  value[4] = 0;
  let i = 240;

  /* 11110000 alone */
  for (; i<241; ++i) {
    value[0] = i;
    let j = 0;

    /* 00000000 to 01111111 */
    for (; j<128; ++j) {
      value[1] = j;
      let k = 128;
      value[2] = k;
      let l = 128;

      value[3] = l;
      t.true(decode(value) instanceof Utf8DecodeError);
    }

    /* 10000000 to 10001111 */
    for (; j<144; ++j) {
      value[1] = j;
      let k = 128;
      value[2] = k;
      let l = 128;

      value[3] = l;
      t.true(decode(value) instanceof Utf8DecodeError);
    }

    /* Triple octet bits: 1110tttt 10uuuuuu 10vvvvvv          =>      ttttuuuuuuvvvvvv
     * Quad octet bits:   11110www 10xxxxxx 10yyyyyy 10zzzzzz => wwwxxxxxxyyyyyyzzzzzz
     * Given a quad octet beginning wwwxxxxxxyyyyyyzzzzzz = 00000..., the quad's
     * bit pattern xxxxyyyyyyzzzzzz fits into a triple's bit pattern
     * ttttuuuuuuvvvvvv. All triple octets beginning xxxxyyyyyyzzzzzz = 00000...
     * are therefore invalid. There exists an analogous argument where double
     * and triple octets degenerate, but are contained within the elaborated
     * case. */
    /* 10010000 to 10111111 */
    for (; j<192; ++j) {
      value[1] = j;
      let k = 0;

      /* 00000000 to 01111111 */
      for (; k<128; ++k) {
        value[2] = k;
        let l = 128;

        value[3] = l;
        t.true(decode(value) instanceof Utf8DecodeError);
      }

      /* 10000000 to 10111111 */
      for (; k<192; ++k) {
        value[2] = k;
        let l = 0;

        /* 00000000 to 01111111 */
        for (; l<128; ++l) {
          value[3] = l;
          t.true(decode(value) instanceof Utf8DecodeError);
        }

        /* 10000000 to 10111111 */
        for (; l<192; ++l) {
          value[3] = l;
          t.false(decode(value) instanceof Utf8DecodeError);
        }

        /* 11000000 to 11111111 */
        for (; l<256; ++l) {
          value[3] = l;
          t.true(decode(value) instanceof Utf8DecodeError);
        }
      }

      /* 11000000 to 11111111 */
      for (; k<256; ++k) {
        value[2] = k;
        let l = 128;

        value[3] = l;
        t.true(decode(value) instanceof Utf8DecodeError);
      }
    }

    /* 11000000 to 11111111 */
    for (; j<256; ++j) {
      value[1] = j;
      let k = 128;
      value[2] = k;
      let l = 128;

      value[3] = l;
      t.true(decode(value) instanceof Utf8DecodeError);
    }
  }

  /* 11110001 to 11110011 */
  for (; i<244; ++i) {
    value[0] = i;
    let j = 0;

    /* 00000000 to 01111111 */
    for (; j<128; ++j) {
      value[1] = j;
      let k = 128;
      value[2] = k;
      let l = 128;

      value[3] = l;
      t.true(decode(value) instanceof Utf8DecodeError);
    }

    /* 10000000 to 10111111 */
    for (; j<192; ++j) {
      value[1] = j;
      let k = 0;

      /* 00000000 to 01111111 */
      for (; k<128; ++k) {
        value[2] = k;
        let l = 128;

        value[3] = l;
        t.true(decode(value) instanceof Utf8DecodeError);
      }

      /* 10000000 to 10111111 */
      for (; k<192; ++k) {
        value[2] = k;
        let l = 0;

        /* 00000000 to 01111111 */
        for (; l<128; ++l) {
          value[3] = l;
          t.true(decode(value) instanceof Utf8DecodeError);
        }

        /* 10000000 to 10111111 */
        for (; l<192; ++l) {
          value[3] = l;
          t.false(decode(value) instanceof Utf8DecodeError);
        }

        /* 11000000 to 11111111 */
        for (; l<256; ++l) {
          value[3] = l;
          t.true(decode(value) instanceof Utf8DecodeError);
        }
      }

      /* 11000000 to 11111111 */
      for (; k<256; ++k) {
        value[2] = k;
        let l = 128;

        value[3] = l;
        t.true(decode(value) instanceof Utf8DecodeError);
      }
    }

    /* 11000000 to 11111111 */
    for (; j<256; ++j) {
      value[1] = j;
      let k = 128;
      value[2] = k;
      let l = 128;

      value[3] = l;
      t.true(decode(value) instanceof Utf8DecodeError);
    }
  }

  /* 11110100 alone */
  for (; i<245; ++i) {
    value[0] = i;
    let j = 0;

    /* 00000000 to 01111111 */
    for (; j<128; ++j) {
      value[1] = j;
      let k = 128;
      value[2] = k;
      let l = 128;

      value[3] = l;
      t.true(decode(value) instanceof Utf8DecodeError);
    }

    /* 10000000 to 10001111 */
    for (; j<144; ++j) {
      value[1] = j;
      let k = 0;

      /* 00000000 to 01111111 */
      for(; k<128; ++k) {
        value[2] = k;
        let l = 128;

        value[3] = l;
        t.true(decode(value) instanceof Utf8DecodeError);
      }

      /* 10000000 to 10111111 */
      for (; k<192; ++k) {
        value[2] = k;
        let l = 0;

        /* 00000000 to 01111111 */
        for (; l<128; ++l) {
          value[3] = l;
          t.true(decode(value) instanceof Utf8DecodeError);
        }

        /* 10000000 to 10111111 */
        for (; l<192; ++l) {
          value[3] = l;
          t.false(decode(value) instanceof Utf8DecodeError);
        }

        /* 11000000 to 11111111 */
        for (; l<256; ++l) {
          value[3] = l;
          t.true(decode(value) instanceof Utf8DecodeError);
        }
      }

      /* 11000000 to 11111111 */
      for (; k<256; ++k) {
        value[2] = k;
        let l = 128;

        value[3] = l;
        t.true(decode(value) instanceof Utf8DecodeError);
      }
    }

    /* 10010000 to 11111111 */
    for (; j<256; ++j) {
      value[1] = j;
      let k = 128;
      value[2] = k;
      let l = 128;

      value[3] = l;
      t.true(decode(value) instanceof Utf8DecodeError);
    }
  }

  /* 11110000 to 11110111 */
  for (; i<248; ++i) {
    value[0] = i;
    let j = 128;
    value[1] = j;
    let k = 128;
    value[2] = k;
    let l = 128;

    value[3] = l;
    t.true(decode(value) instanceof Utf8DecodeError);
  }
});

test("Octets remainder", t => {
  t.plan(8);

  const value = new Uint8Array(2);
  value[1] = 0;
  let i = 248;

  /* 11111000 to 11111111 */
  for (; i<256; ++i) {
    value[0] = i;
    t.true(decode(value) instanceof Utf8DecodeError);
  }
});

test("Forbidden octets", t => {
  t.plan(4);

  const value = new Uint8Array(2);
  value[1] = 0;

  /* 11000000 */
  value[0] = 0xc0;
  t.true(decode(value) instanceof Utf8DecodeError);
  
  /* 11000001 */
  value[0] = 0xc1;
  t.true(decode(value) instanceof Utf8DecodeError);
  
  /* 11110101 */
  value[0] = 0xf5;
  t.true(decode(value) instanceof Utf8DecodeError);
  
  /* 11111111 */
  value[0] = 0xff;
  t.true(decode(value) instanceof Utf8DecodeError);
});
