/**
 * CryptoPaste 
 *
 * Copyright (c) 2013-2017 Andrew Lamoureux
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation; either version 2 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, write to the Free Software Foundation, Inc., 59 Temple
 * Place, Suite 330, Boston, MA 02111-1307 USA
 */

function test()
{
    test_SHA1()
    test_HMAC_SHA1()
    test_PBKDF2()
    test_HMAC_SHA256()
    test_AES()
    test_AES_CBC()
}

function test_PBKDF2()
{
    /* format is <password>, <salt>, <iterations>, <desired key length>, <derived key> */
    vectors = [
        /* from rfc6070 
            they do a good job providing an example with one iteration (c=1),
            then two iterations (c=2), etc... so you can progressively debug... */
        [
            str_decode_ascii('password'),
            str_decode_ascii('salt'),
            1,
            20,
            str_to_bytes('0c60c80f961f0e71f3a9b524af6012062fe037a6')
        ],
        [
            str_decode_ascii('password'),
            str_decode_ascii('salt'),
            2,
            20,
            str_to_bytes('ea6c014dc72d6f8ccd1ed92ace1d41f0d8de8957')
        ],
        [
            str_decode_ascii('password'),
            str_decode_ascii('salt'),
            3,
            20,
            str_to_bytes('6b 4e 26 12 5c 25 cf 21 ae 35 ea d9 55 f4 79 ea 2e 71 f6 ff')
        ],
        [
            str_decode_ascii('password'),
            str_decode_ascii('salt'),
            4096,
            20,
            str_to_bytes('4b 00 79 01 b7 65 48 9a be ad 49 d9 26 f7 21 d0 65 a4 29 c1')
        ],
        /* this one just takes too long in javascript...
        [
            str_decode_ascii('password'),
            str_decode_ascii('salt'),
            16777216,
            20,
            str_to_bytes('ee fe 3d 61 cd 4d a4 e4 e9 94 5b 3d 6b a2 15 8c 26 34 e9 84')
        ],
        */
        [
            str_decode_ascii('passwordPASSWORDpassword'),
            str_decode_ascii('saltSALTsaltSALTsaltSALTsaltSALTsalt'),
            4096,
            25,
            str_to_bytes('3d 2e ec 4f e4 1c 84 9b 80 c8 d8 36 62 c0 e4 4a 8b 29 1a 96 4c f2 f0 70 38')
        ]
    ]

    console.debug("test_PBKDF2() tests...")

    for(var i=0; i < vectors.length; ++i)
    {
        result = sprintf('test %d / %d ... ', i+1, vectors.length)

        password = vectors[i][0]
        salt = vectors[i][1]
        iterations = vectors[i][2]
        dkLen = vectors[i][3]
        expected = vectors[i][4]

        derived_key = PBKDF2(0, password, salt, iterations, dkLen)

        if(0 == array_cmp(derived_key, expected)) {
            result += 'PASS'
        }
        else {
            result += sprintf('FAIL\n expected %s, got %s', bytes_to_str(expected), bytes_to_str(derived_key))
        }

        console.debug(result)
    }
}

function test_HMAC_SHA1()
{
    /* format is <key>, <data>, <expected result> */
    vectors = [
        /* custom problem I'd run into... */
        [
            str_decode_ascii('passwordPASSWORDpassword'),
            str_to_bytes('CB8A7D54533C9562654BAEF3190501D82CA975FB'),
            str_to_bytes('d6477f04b0813240edbfec59488b2678b243e4c0')
        ],
        /* from fips-198a */
        [
            str_to_bytes('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f'),
            str_decode_ascii('Sample #1'),
            str_to_bytes('4f4ca3d5d68ba7cc0a1208c9c61e9c5da0403c0a')
        ],
        [   
            str_to_bytes('303132333435363738393a3b3c3d3e3f40414243'),
            str_decode_ascii('Sample #2'),
            str_to_bytes('0922d3405faa3d194f82a45830737d5cc6c75d24')
        ],
        [   
            str_to_bytes('505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3'),
            str_decode_ascii('Sample #3'),
            str_to_bytes('bcf41eab8bb2d802f3d05caf7cb092ecf8d1a3aa')
        ],
        [
            str_to_bytes('707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0'),
            str_decode_ascii('Sample #4'),
            str_to_bytes('9ea886efe268dbecce420c7524df32e0751a2a26')
        ],
        /* from wikipedia entry
        */
        [
            [],
            [],
            str_to_bytes('fbdb1d1b18aa6c08324b7d64b71fb76370690e1d')
        ],
        [
            str_decode_ascii('key'),
            str_decode_ascii('The quick brown fox jumps over the lazy dog'),
            str_to_bytes('de7c9b85b8b78aa6bc8a7a36f70a90701c9db4d9')
        ]
    ]

    console.debug("test_HMAC_SHA1() tests...")

    for(var i=0; i < vectors.length; ++i)
    {
        result = sprintf('test %d / %d ... ', i+1, vectors.length)

        key = vectors[i][0]
        data = vectors[i][1]
        expected = vectors[i][2]

        hmac = HMAC_SHA1(key, data)

        if(0 == array_cmp(hmac, expected)) {
            result += 'PASS'
        }
        else {
            result += sprintf('FAIL\n expected %s, got %s', bytes_to_str(expected), bytes_to_str(hmac))
        }

        console.debug(result)
    }
}

function test_SHA1()
{
    /* format is <text>, <expected hash> */
    vectors = [
        /* from wikipedia entry
            https://en.wikipedia.org/wiki/SHA-1
        */
        [   str_decode_ascii('The quick brown fox jumps over the lazy dog'),
            str_to_bytes('2fd4e1c67a2d28fced849ee1bb76e7391b93eb12')
        ],
        /* notice the dog -> cog change, demonstrating avalanche effect */
        [   str_decode_ascii('The quick brown fox jumps over the lazy cog'),
            str_to_bytes('de9f2c7fd25e1b3afad3e85a0bd17d9b100db4b3')
        ],
        /* empty string */
        [   [],
            str_to_bytes('da39a3ee5e6b4b0d3255bfef95601890afd80709')
        ]
    ]

    console.debug("test_SHA1() tests...")

    for(var i=0; i < vectors.length; ++i)
    {
        result = sprintf('test %d / %d ... ', i+1, vectors.length)

        data = vectors[i][0]
        expected = vectors[i][1]

        sha1 = SHA1(data)

        if(0 == array_cmp(sha1, expected)) {
            result += 'PASS'
        }
        else {
            result += sprintf('FAIL\n expected %s, got %s', bytes_to_str(expected), bytes_to_str(sha1str))
        }

        console.debug(result)
    }
}

function test_HMAC_SHA256()
{
    /* format is <key>, <data>, <expected result> */
    vectors = [
        /* from RFC 4231 */
        [   str_to_bytes('0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b'),
            str_to_bytes('4869205468657265'),
            str_to_bytes('b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7'),
        ],
        [   str_to_bytes('4a656665'),
            str_to_bytes('7768617420646f2079612077616e7420666f72206e6f7468696e673f'),
            str_to_bytes('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843'),
        ],
        [   str_to_bytes('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
            str_to_bytes('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'),
            str_to_bytes('773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe'),
        ],
        [   str_to_bytes('0102030405060708090a0b0c0d0e0f10111213141516171819'),
            str_to_bytes('cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd'),
            str_to_bytes('82558a389a443c0ea4cc819899f2083a85f0faa3e578f8077a2e3ff46729665b'),
        ],

        /* not sure what the point of this "truncation" test is
        [   str_to_bytes('0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c'),
            str_to_bytes('546573742057697468205472756e636174696f6e'),
            str_to_bytes('a3b6167473100ee06e0c796c2955552b'),
        ],
        */

        [   str_to_bytes('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
            str_to_bytes('54657374205573696e67204c6172676572205468616e20426c6f636b2d53697a65204b6579202d2048617368204b6579204669727374'),
            str_to_bytes('60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54'),
        ],
        [   str_to_bytes('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
            str_to_bytes('5468697320697320612074657374207573696e672061206c6172676572207468616e20626c6f636b2d73697a65206b657920616e642061206c6172676572207468616e20626c6f636b2d73697a6520646174612e20546865206b6579206e6565647320746f20626520686173686564206265666f7265206265696e6720757365642062792074686520484d414320616c676f726974686d2e'),
            str_to_bytes('9b09ffa71b942fcb27635fbcd5b0e944bfdc63644f0713938a7f51535c3a35e2'),
        ],

        /* from the wikipedia entry
            https://en.wikipedia.org/wiki/Hash-based_message_authentication_code#Examples_of_HMAC_.28MD5.2C_SHA1.2C_SHA256.29
        */
        [   str_to_bytes(''),
            str_to_bytes(''),
            str_to_bytes('b613679a0814d9ec772f95d778c35fc5ff1697c493715653c6c712144292c5ad')
        ],
        [   str_to_bytes('6B6579') /* "key" */,
            str_to_bytes('54686520717569636B2062726F776E20666F78206A756D7073206F76657220746865206C617A7920646F67') /* The quick brown fox jumps over the lazy dog */,
            str_to_bytes('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8')
        ]
    ]
    
    console.debug("test_HMAC_SHA256() tests...")

    for(var i=0; i < vectors.length; ++i)
    {
        result = sprintf('test %d / %d ... ', i+1, vectors.length)

        key = vectors[i][0]
        data = vectors[i][1]
        expected = vectors[i][2]

        mac_hex = HMAC_SHA256_MAC(key, data)

        if(0 == array_cmp(str_to_bytes(mac_hex), expected)) {
            result += 'PASS'
        }
        else {
            result += sprintf('FAIL\n expected %s, got %s', bytes_to_str(expected), mac_hex)
        }

        console.debug(result)
    }
}

function test_AES()
{
    AES_Init()

    /* format is <block>, <key>, <ciphertext> */
    vectors = [
        /* from fips-197 */
        [   str_to_bytes('00112233445566778899AABBCCDDEEFF'),
            str_to_bytes('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'),
            str_to_bytes('8EA2B7CA516745BFEAFC49904B496089')
        ],
        /*  from the NIST known-answer-test
            http://csrc.nist.gov/groups/STM/cavp/documents/aes/KAT_AES.zip */

        /* first, last, from varying key */
        [   str_to_bytes('00000000000000000000000000000000'),
            str_to_bytes('8000000000000000000000000000000000000000000000000000000000000000'),
            str_to_bytes('e35a6dcb19b201a01ebcfa8aa22b5759')
        ],
        [   str_to_bytes('00000000000000000000000000000000'),
            str_to_bytes('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
            str_to_bytes('4bf85f1b5d54adbc307b0a048389adcb')
        ],
        /* first, last, from varying text */
        [   str_to_bytes('80000000000000000000000000000000'),
            str_to_bytes('0000000000000000000000000000000000000000000000000000000000000000'),
            str_to_bytes('ddc6bf790c15760d8d9aeb6f9a75fd4e')
        ],
        [   str_to_bytes('ffffffffffffffffffffffffffffffff'),
            str_to_bytes('0000000000000000000000000000000000000000000000000000000000000000'),
            str_to_bytes('acdace8078a32b1a182bfa4987ca1347')
        ],
        /* from http://www.inconteam.com/software-development/41-encryption/55-aes-test-vectors */
        [   str_to_bytes('6bc1bee22e409f96e93d7e117393172a'),
            str_to_bytes('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4'),
            str_to_bytes('f3eed1bdb5d2a03c064b5a7e3db181f8')
        ],
        [   str_to_bytes('ae2d8a571e03ac9c9eb76fac45af8e51'),
            str_to_bytes('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4'),
            str_to_bytes('591ccb10d410ed26dc5ba74a31362870')
        ],
        [   str_to_bytes('30c81c46a35ce411e5fbc1191a0a52ef'),
            str_to_bytes('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4'),
            str_to_bytes('b6ed21b99ca6f4f9f153e7b1beafed1d')
        ],
        [   str_to_bytes('f69f2445df4f9b17ad2b417be66c3710'),
            str_to_bytes('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4'),
            str_to_bytes('23304b7a39f9f3ff067d8d8f9e24ecc7')
        ]
    ]   

    console.debug("test_AES() encryption tests...")

    for(var i=0; i < vectors.length; ++i) {
        result = sprintf('test %d / %d ... ', i+1, vectors.length)

        var block = vectors[i][0]
        var key = vectors[i][1]
        var ctext = vectors[i][2]
        
        AES_ExpandKey(key)
        AES_Encrypt(block, key)

        if(0 == array_cmp(block, ctext)) {
            result += 'PASS'
        }
        else {
            result += 'FAIL'
            result += '\n'
            result += sprintf("expected %s, got %s", bytes_to_str(ctext), bytes_to_str(block))
        }

        console.debug(result);
    }

    AES_Done()
}

function test_AES_CBC()
{
    AES_Init()

    /* format is <plaintext>, <key>, <iv> <ciphertext> */
    vectors = [
        /* from NIST special publication 800-38A
            http://csrc.nist.gov/publications/nistpubs/800-38a/sp800-38a.pdf
            also mirrored at: http://www.inconteam.com/software-development/41-encryption/55-aes-test-vectors */
        [   str_to_bytes('6bc1bee22e409f96e93d7e117393172a ae2d8a571e03ac9c9eb76fac45af8e51 30c81c46a35ce411e5fbc1191a0a52ef f69f2445df4f9b17ad2b417be66c3710'),
            str_to_bytes('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4'),
            str_to_bytes('000102030405060708090A0B0C0D0E0F'),
            str_to_bytes('f58c4c04d6e5f1ba779eabfb5f7bfbd6 9cfc4e967edb808d679f777bc6702c7d 39f23369a9d9bacfa530e26304231461 b2eb05e2c39be9fcda6c19078c6a9d1b')
        ]
    ]

    console.debug("test_AES_CBC() encryption tests...")

    for(var i=0; i < vectors.length; ++i) {
        result = sprintf('test %d / %d ... ', i+1, vectors.length)

        var plaint = vectors[i][0].slice()
        var key = vectors[i][1].slice()
        var iv = vectors[i][2].slice()
        var ciphert = vectors[i][3].slice()

        var block = AES_CBC_Encrypt(plaint, key, iv)

        if(0 == array_cmp(block, ciphert)) {
            result += 'PASS'
        }
        else {
            result += 'FAIL'
            result += '\n'
            result += sprintf("expected %s, got %s", bytes_to_str(ciphert), bytes_to_str(block))
        }

        console.debug(result);
    }

    console.debug("test_AES_CBC() decryption tests...")

    for(var i=0; i < vectors.length; ++i) {
        result = sprintf('test %d / %d ... ', i+1, vectors.length)

        var plaint = vectors[i][0]
        var key = vectors[i][1]
        var iv = vectors[i][2]
        var ciphert = vectors[i][3] 

        var block = AES_CBC_Decrypt(ciphert, key, iv)

        if(0 == array_cmp(block, plaint)) {
            result += 'PASS'
        }
        else {
            result += 'FAIL'
            result += '\n'
            result += sprintf("expected %s, got %s", bytes_to_str(plaint), bytes_to_str(block))
        }

        console.debug(result);
    }

    AES_Done()
}

