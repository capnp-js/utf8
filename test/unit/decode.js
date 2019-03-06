/* @flow */

import * as assert from "assert";
import { create, set } from "@capnp-js/bytes";
import { describe, it } from "mocha";
import { Utf8DecodeError, decode } from "../../src/decode";

//TODO: Round trip some foreign language text

describe("decode", t => {
  it("handles single octets", function () {
    const value = create(2);
    set(0, 1, value);
    let i = 0;

    /* 00000000 to 01111111 */
    for (; i<128; ++i) {
      set(i, 0, value);
      assert.ok(!(decode(value) instanceof Utf8DecodeError));
    }

    /* 10000000 to 10111111 */
    /* An earlier 11... octet must anticipate these octets. */
    for (; i<192; ++i) {
      set(i, 0, value);
      assert.ok(decode(value) instanceof Utf8DecodeError);
    }
  });

  it("handles double octets", function () {
    const value = create(3);
    set(0, 2, value);
    let i = 192;

    /* * Single octet bits: 0xxxxxxx          =>     xxxxxxx
       * Double octet bits: 110yyyyy 10zzzzzz => yyyyyzzzzzz
       * Given a double octet beginning yyyyyzzzzzz = 0000..., the double's bit
         pattern yzzzzzz fits into a single's bit pattern xxxxxxx. All double
         octets beginning yyyyyzzzzzz = 0000... are therefore invalid. */
    /* 11000000 to 11000001 */
    for (; i<194; ++i) {
      set(i, 0, value);
      let j = 0;

      /* 00000000 to 01111111 */
      /* The preceding 110... octet requires a single, following 10... octet. */
      for (; j<128; ++j) {
        set(j, 1, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }

      /* 10000000 to 10111111 */
      for (; j<192; ++j) {
        set(j, 1, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }

      /* 11000000 to 11111111 */
      for (; j<256; ++j) {
        set(j, 1, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }
    }

    /* 11000010 to 11011111 */
    for (; i<224; ++i) {
      set(i, 0, value);
      let j = 0;

      /* 00000000 to 01111111 */
      /* The preceding 110... octet requires a single, following 10... octet. */
      for (; j<128; ++j) {
        set(j, 1, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }

      /* 10000000 to 10111111 */
      for (; j<192; ++j) {
        set(j, 1, value);
        assert.ok(!(decode(value) instanceof Utf8DecodeError));
      }

      /* 11000000 to 11111111 */
      for (; j<256; ++j) {
        set(j, 1, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }
    }
  });

  //TODO: Comment on how canonicalization is not handled by my implementation.
  it("handles triple octets", function () {
    this.timeout(20000);
    const value = create(4);
    set(0, 3, value);
    let i = 224;

    /* 11100000 alone */
    for (; i<225; ++i) {
      set(i, 0, value);
      let j = 0;

      /* 00000000 to 01111111 */
      for (; j<128; ++j) {
        set(j, 1, value);
        let k = 128;

        /* The `j` bits should trigger an error regardless of `k`. */
        set(k, 2, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }

      /* * Double octet bits: 110vvvvv 10wwwwww          =>      vvvvvwwwwww
         * Triple octet bits: 1110xxxx 10yyyyyy 10zzzzzz => xxxxyyyyyyzzzzzz
         * Given a triple octet beginning xxxxyyyyyyzzzzzz = 00000..., the
           triple's bit pattern yyyyyzzzzzz fits into a double's bit pattern
           vvvvvwwwwww. All triple octets beginning xxxxyyyyyyzzzzzz = 00000...
           are therefore invalid. There exists an analogous argument where
           single octets degenerate like double octets, but this yields a
           xxxxyyyyyyzzzzzz = 00000000..., which is contained within the prior
           case. */
      /* 10000000 to 10011111 */
      for (; j<160; ++j) {
        set(j, 1, value);
        let k = 128;

        /* The `j` bits should trigger an error regardless of `k`. */
        set(k, 2, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }

      /* 10100000 to 10111111 */
      for (; j<192; ++j) {
        set(j, 1, value);
        let k = 0;

        /* 00000000 to 01111111 */
        for (; k<128; ++k) {
          set(k, 2, value);
          assert.ok(decode(value) instanceof Utf8DecodeError);
        }

        /* 10000000 to 10111111 */
        for (; k<192; ++k) {
          set(k, 2, value);
          assert.ok(!(decode(value) instanceof Utf8DecodeError));
        }

        /* 11000000 to 11111111 */
        for (; k<256; ++k) {
          set(k, 2, value);
          assert.ok(decode(value) instanceof Utf8DecodeError);
        }
      }

      /* 11000000 to 11111111 */
      for (; j<256; ++j) {
        set(j, 1, value);
        let k = 128;

        /* The `j` bits should trigger an error regardless of `k`. */
        set(k, 2, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }
    }

    /* 11100001 to 11101111 */
    for (; i<240; ++i) {
      set(i, 0, value);
      let j = 0;

      /* 00000000 to 01111111 */
      for (; j<128; ++j) {
        set(j, 1, value);
        let k = 128;

        /* The `j` bits should trigger an error regardless of `k`. */
        set(k, 2, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }

      /* 10000000 to 10011111 */
      for (; j<160; ++j) {
        set(j, 1, value);
        let k = 0;

        /* 00000000 to 01111111 */
        for (; k<128; ++k) {
          set(k, 2, value);
          assert.ok(decode(value) instanceof Utf8DecodeError);
        }

        /* 10000000 to 10111111 */
        for (; k<192; ++k) {
          set(k, 2, value);
          assert.ok(!(decode(value) instanceof Utf8DecodeError));
        }

        /* 11000000 to 11111111 */
        for (; k<256; ++k) {
          set(k, 2, value);
          assert.ok(decode(value) instanceof Utf8DecodeError);
        }
      }

      /* 10100000 to 10111111 */
      if (i === 237) {
        /* 0xd800 - 0xdfff are forbidden */
        for (; j<192; ++j) {
          set(j, 1, value);
          let k = 128;

          /* The `j` bits should trigger an error regardless of `k`. */
          set(k, 2, value);
          assert.ok(decode(value) instanceof Utf8DecodeError);
        }
      } else {
        for (; j<192; ++j) {
          set(j, 1, value);
          let k = 0;

          /* 00000000 to 01111111 */
          for (; k<128; ++k) {
            set(k, 2, value);
            assert.ok(decode(value) instanceof Utf8DecodeError);
          }

          /* 10000000 to 10111111 */
          for (; k<192; ++k) {
            set(k, 2, value);
            assert.ok(!(decode(value) instanceof Utf8DecodeError));
          }

          /* 11000000 to 11111111 */
          for (; k<256; ++k) {
            set(k, 2, value);
            assert.ok(decode(value) instanceof Utf8DecodeError);
          }
        }
      }

      /* 11000000 to 11111111 */
      for (; j<256; ++j) {
        set(j, 1, value);
        let k = 128;

        /* The `j` bits should trigger an error regardless of `k`. */
        set(k, 2, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }
    }
  });

  it("handles quad octets", function () {
    this.timeout(200000);
    const value = create(5);

    set(0, 4, value);
    let i = 240;

    /* 11110000 alone */
    for (; i<241; ++i) {
      set(i, 0, value);
      let j = 0;

      /* 00000000 to 01111111 */
      for (; j<128; ++j) {
        set(j, 1, value);
        let k = 128;
        set(k, 2, value);
        let l = 128;

        set(l, 3, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }

      /* 10000000 to 10001111 */
      for (; j<144; ++j) {
        set(j, 1, value);
        let k = 128;
        set(k, 2, value);
        let l = 128;

        set(l, 3, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }

      /* Triple octet bits: 1110tttt 10uuuuuu 10vvvvvv          =>      ttttuuuuuuvvvvvv
       * Quad octet bits:   11110www 10xxxxxx 10yyyyyy 10zzzzzz => wwwxxxxxxyyyyyyzzzzzz
       * Given a quad octet beginning wwwxxxxxxyyyyyyzzzzzz = 00000..., the
         quad's bit pattern xxxxyyyyyyzzzzzz fits into a triple's bit pattern
         ttttuuuuuuvvvvvv. All triple octets beginning xxxxyyyyyyzzzzzz =
         00000... are therefore invalid. There exists an analogous argument
         where double and triple octets degenerate, but are contained within the
         elaborated case. */
      /* 10010000 to 10111111 */
      for (; j<192; ++j) {
        set(j, 1, value);
        let k = 0;

        /* 00000000 to 01111111 */
        for (; k<128; ++k) {
          set(k, 2, value);
          let l = 128;

          set(l, 3, value);
          assert.ok(decode(value) instanceof Utf8DecodeError);
        }

        /* 10000000 to 10111111 */
        for (; k<192; ++k) {
          set(k, 2, value);
          let l = 0;

          /* 00000000 to 01111111 */
          for (; l<128; ++l) {
            set(l, 3, value);
            assert.ok(decode(value) instanceof Utf8DecodeError);
          }

          /* 10000000 to 10111111 */
          for (; l<192; ++l) {
            set(l, 3, value);
            assert.ok(!(decode(value) instanceof Utf8DecodeError));
          }

          /* 11000000 to 11111111 */
          for (; l<256; ++l) {
            set(l, 3, value);
            assert.ok(decode(value) instanceof Utf8DecodeError);
          }
        }

        /* 11000000 to 11111111 */
        for (; k<256; ++k) {
          set(k, 2, value);
          let l = 128;

          set(l, 3, value);
          assert.ok(decode(value) instanceof Utf8DecodeError);
        }
      }

      /* 11000000 to 11111111 */
      for (; j<256; ++j) {
        set(j, 1, value);
        let k = 128;
        set(k, 2, value);
        let l = 128;

        set(l, 3, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }
    }

    /* 11110001 to 11110011 */
    for (; i<244; ++i) {
      set(i, 0, value);
      let j = 0;

      /* 00000000 to 01111111 */
      for (; j<128; ++j) {
        set(j, 1, value);
        let k = 128;
        set(k, 2, value);
        let l = 128;

        set(l, 3, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }

      /* 10000000 to 10111111 */
      for (; j<192; ++j) {
        set(j, 1, value);
        let k = 0;

        /* 00000000 to 01111111 */
        for (; k<128; ++k) {
          set(k, 2, value);
          let l = 128;

          set(l, 3, value);
          assert.ok(decode(value) instanceof Utf8DecodeError);
        }

        /* 10000000 to 10111111 */
        for (; k<192; ++k) {
          set(k, 2, value);
          let l = 0;

          /* 00000000 to 01111111 */
          for (; l<128; ++l) {
            set(l, 3, value);
            assert.ok(decode(value) instanceof Utf8DecodeError);
          }

          /* 10000000 to 10111111 */
          for (; l<192; ++l) {
            set(l, 3, value);
            assert.ok(!(decode(value) instanceof Utf8DecodeError));
          }

          /* 11000000 to 11111111 */
          for (; l<256; ++l) {
            set(l, 3, value);
            assert.ok(decode(value) instanceof Utf8DecodeError);
          }
        }

        /* 11000000 to 11111111 */
        for (; k<256; ++k) {
          set(k, 2, value);
          let l = 128;

          set(l, 3, value);
          assert.ok(decode(value) instanceof Utf8DecodeError);
        }
      }

      /* 11000000 to 11111111 */
      for (; j<256; ++j) {
        set(j, 1, value);
        let k = 128;
        set(k, 2, value);
        let l = 128;

        set(l, 3, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }
    }

    /* 11110100 alone */
    for (; i<245; ++i) {
      set(i, 0, value);
      let j = 0;

      /* 00000000 to 01111111 */
      for (; j<128; ++j) {
        set(j, 1, value);
        let k = 128;
        set(k, 2, value);
        let l = 128;

        set(l, 3, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }

      /* 10000000 to 10001111 */
      for (; j<144; ++j) {
        set(j, 1, value);
        let k = 0;

        /* 00000000 to 01111111 */
        for(; k<128; ++k) {
          set(k, 2, value);
          let l = 128;

          set(l, 3, value);
          assert.ok(decode(value) instanceof Utf8DecodeError);
        }

        /* 10000000 to 10111111 */
        for (; k<192; ++k) {
          set(k, 2, value);
          let l = 0;

          /* 00000000 to 01111111 */
          for (; l<128; ++l) {
            set(l, 3, value);
            assert.ok(decode(value) instanceof Utf8DecodeError);
          }

          /* 10000000 to 10111111 */
          for (; l<192; ++l) {
            set(l, 3, value);
            assert.ok(!(decode(value) instanceof Utf8DecodeError));
          }

          /* 11000000 to 11111111 */
          for (; l<256; ++l) {
            set(l, 3, value);
            assert.ok(decode(value) instanceof Utf8DecodeError);
          }
        }

        /* 11000000 to 11111111 */
        for (; k<256; ++k) {
          set(k, 2, value);
          let l = 128;

          set(l, 3, value);
          assert.ok(decode(value) instanceof Utf8DecodeError);
        }
      }

      /* 10010000 to 11111111 */
      for (; j<256; ++j) {
        set(j, 1, value);
        let k = 128;
        set(k, 2, value);
        let l = 128;

        set(l, 3, value);
        assert.ok(decode(value) instanceof Utf8DecodeError);
      }
    }

    /* 11110000 to 11110111 */
    for (; i<248; ++i) {
      set(i, 0, value);
      let j = 128;
      set(j, 1, value);
      let k = 128;
      set(k, 2, value);
      let l = 128;

      set(l, 3, value);
      assert.ok(decode(value) instanceof Utf8DecodeError);
    }
  });

  it("handles illegal octets", function () {
    const value = create(2);
    set(0, 1, value);
    let i = 248;

    /* 11111000 to 11111111 */
    for (; i<256; ++i) {
      set(i, 0, value);
      assert.ok(decode(value) instanceof Utf8DecodeError);
    }

    /* 11000000 */
    set(0xc0, 0, value);
    assert.ok(decode(value) instanceof Utf8DecodeError);
  
    /* 11000001 */
    set(0xc1, 0, value);
    assert.ok(decode(value) instanceof Utf8DecodeError);
  
    /* 11110101 */
    set(0xf5, 0, value);
    assert.ok(decode(value) instanceof Utf8DecodeError);
  
    /* 11111111 */
    set(0xff, 0, value);
    assert.ok(decode(value) instanceof Utf8DecodeError);
  });
});
