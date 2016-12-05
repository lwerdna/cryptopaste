/**
 * main javascript file (utilities + glue + ...)
 *
 * Copyright (c) 2013-2016 Andrew Lamoureux
 *
 * This file is a part of CrytoPaste
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

/******************************************************************************
    GLOBAL VARIABLES
 *****************************************************************************/
var elem_new_paste
var elem_result

/******************************************************************************
    FUNCTIONS
 *****************************************************************************/
function cryptopaste_init() 
{
    elem_new_paste = document.getElementById('new_paste')
    elem_result = document.getElementById('result')
}

/******************************************************************************
    WEB UTILITIES
 *****************************************************************************/
function ajax_get(url)
{
    var xmlhttp = new XMLHttpRequest()
    console.log("AJAX: " + url)
    xmlhttp.open("GET", url, false)
    xmlhttp.send()
    var resp = xmlhttp.responseText
    console.log("AJAX: " + resp)
    return resp
}

/* url is like 'backend.py'
    data is like 'foo=1&bar=2'
*/
function ajax_post(url, data) {
    var xmlhttp = new XMLHttpRequest()
    console.log("AJAX URL: " + url)
    xmlhttp.open("POST", url, false)
    xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    //xmlhttp.setRequestHeader('Content-length', data.length)
    //xmlhttp.setRequestHeader('Connection', 'close')
    xmlhttp.send(data)
    var resp = xmlhttp.responseText
    console.log("AJAX RESP: " + resp)
    return resp
}

function hide_elem(elem) {
    elem.style.display = 'none'
}

function unhide_elem(elem) {
    elem.style.display = 'block'
}

/******************************************************************************
    GENERAL UTILITIES
 *****************************************************************************/

/* converts "AA" to [0x41, 0x00, 0x41, 0x00,] */
function str_to_uni16(string)
{
    array = []

    for(var i=0; i<string.length; ++i) {
        var cc = string.charCodeAt(i)

        if(cc > 65536) {
            throw("ERROR: char code is greater than 2-bytes!")
        }

        array.push(cc & 0xFF)
        array.push(cc >> 8)
    }

    return array
}

/* convert [0x41, 0x00, 0x41, 0x00] to "AA" */
function uni16_to_str(array)
{
    var string = ''

    if(array.length % 2) {
        throw("ERROR: array size not a multiple of 2 when decoding uni16")
    }

    for(var i=0; i<array.length; i+=2) {
        var cc = array[i] | (array[i+1] << 8)
        string += String.fromCharCode(cc)
    }   

    return string
}

/* converts "AAAA" to [0x41, 0x41, 0x41, 0x41] */
function str_decode_ascii(string)
{
    array = []

    for(var i=0; i<string.length; ++i) {
        array.push(string.charCodeAt(i))
    }

    return array
}

/* converts [0x41, 0x41, 0x41, 0x41] to "AAAA" */
function ascii_encode_str(array)
{
    string = ''

    for(var i=0; i<array.length; ++i) {
        string += String.fromCharCode(array[i])
    }

    return string
}

/* converts [0xDE, 0xAD, 0xBE, 0xEF] to "DEADBEEF" */
function bytes_to_str(bytes)
{
    var string = ''

    for(var i=0; i < bytes.length; ++i) {
        string += sprintf('%02X', bytes[i])
    }

    return string
}

/* converts "DEADBEEF" to [0xDE, 0xAD, 0xBE, 0xEF] */
function str_to_bytes(string)
{
    var bytes = [];

    string = string.replace(/\s+/g, '')

    for(var i=0; i < string.length; i += 2) {
        bytes.push(parseInt(string.substring(i, i+2), 16))
    }

    return bytes;
}

function array_cmp(a, b)
{
    if (a.length != b.length) {
        return -1
    }

    for(var i=0; i < a.length; ++i) {
        if(a[i] != b[i]) {
            return -1
        }
    }

    return 0
}

function array_xor(a, b)
{
    /* result is initialized as copy from longer array to support extending */
    var result
    
    if(a.length >= b.length) {
        result = a.slice()
    }
    else {
        result = b.slice()
    }
    
    /* compute as long as the smaller array (trailing bytes are assumed xor'd
        with zero and remain as-is from the initial copy */
    min = Math.min(a.length, b.length)

    for(var i=0; i < min; ++i) {
        result[i] = a[i] ^ b[i]
    }

    return result
}

function stricmp(a, b)
{
    if(a.length != b.length) {
        return -1;
    }

    if(a.toUpperCase() == b.toUpperCase()) {
        return 0;
    }

    return -1;
}

/* converts 0xDEADBEEF to [0xEF, 0xBE, 0xAD, 0xDE] */
function uint32_to_bytes(x, endian)
{
    var rv = []

    /* default endian is little */
    endian = (typeof(endian) == 'undefined') ? 'little' : endian

    for(var i=0; i<4; ++i) {
        if(endian == 'little') {
            rv.push(x & 0xFF)
        }
        else {
            rv = [x & 0xFF].concat(rv)
        }

        /* >>> is zero-filling (>> is sign extending) */
        x >>>= 8
    }

    return rv
}

/******************************************************************************
    KEY DERIVATION
 *****************************************************************************/

/* password-based key derivation function 2 
    from RSA Lab's Public-Key Cryptography Standards, PKCS #5 v.20
    also published in RFC 2898

    hLen is hash length (number of octets)
    with sha256, hLen == 32 octets of output (32*8 = 256)
    with aes256, dkLen == 32 octets of key material

    iteration count minimum 1000
    salt should be at least eight octets (64 bits)
*/
function PBKDF2(prf, pw, salt, n_iterations, dkLen)
{
    /* derived key */
    var DK = []

    /* hash length is 20 for sha1 */
    hLen = 20

    /* number of hash outputs needed to fill dkLen */
    n_prfs = Math.ceil(dkLen / hLen)

    for(var i = 1; i <= n_prfs; ++i) {
        DK = DK.concat( PBKDF2_F(pw, salt, n_iterations, i) )
    }

    return DK.slice(0, dkLen)
}

function PBKDF2_F(pw, salt, n_iterations, idx)
{
    var temp

    /* idx is used only to append 4-bytes to the end of the salt */
    var INT_i = [ (idx & 0xFF000000) >>> 24, (idx & 0xFF0000) >>> 16, (idx & 0xFF00) >>> 8, idx & 0xFF ]

    /* the password is the HMAC key, the salt and 4-bytes are the HMAC message */
    /* compute U_1 */
    temp = salt.concat(INT_i)
    var U_curr = HMAC_SHA1(pw, temp)

    /* result is initially U_1 */
    var result = U_curr.slice()

    /* and we iterate, computing U_2, U_3, ..., U_{n_iterations} */
    for(var i=2; i <= n_iterations; ++i) {
        temp = U_curr
        U_curr = HMAC_SHA1(pw, U_curr)

        temp = result
        result = array_xor(temp, U_curr)
    }

    return result
}

/******************************************************************************
    FORM INTERACTION, CALLBACKS
 *****************************************************************************/

function encrypt()
{
    AES_Init()

    /* 1) Select a salt S and an iteration count c */
    var salt_ui8 = new Uint8Array(8)
    window.crypto.getRandomValues(salt_ui8)
    var salt = []
    for(var i=0; i<8; ++i) {
        salt[i] = salt_ui8[i]
    }

    iterations = 4096

    /* 2) Select the length in octents, dkLen, for the derived
        key for the underlying encryption scheme */
    dk_len = 32
    /* derive also the IV */
    dk_len += 16

    /* 3, Apply the key derivation function to the password
        P, the salt S, and the iteration count c to produce
        a derived key DK of length dkLen octets */
    var elem_pw = document.getElementsByName("password")[0]
    console.debug("using password: " + elem_pw.value)
    var password = str_to_uni16(elem_pw.value)
    console.debug("password array: " + password)

    derived_data = PBKDF2(0, password, salt, iterations, dk_len)
    key = derived_data.slice(0, 32)
    iv = derived_data.slice(32, 48)

    console.debug("derived key: " + bytes_to_str(key))
    console.debug("derived iv: " + bytes_to_str(iv))

    /* Encrypt the message M with the underlying encypriont scheme
        under the derived key DK to produce a ciphertext C. (This
        step may involve selection of parameters such as an
        initialization vector and padding, depending on the
        underlying scheme ) */
    var elem_pt = document.getElementsByName("plaintext")[0]
    console.debug("encrypting text: " + elem_pt.value)
    var ptext = str_to_uni16(elem_pt.value)
    console.debug("plaintext array: " + bytes_to_str(ptext))

    ptext = AES_pad(ptext)
    console.debug("plaintext after padding: " + bytes_to_str(ptext))

    ctext = AES_CBC_Encrypt(ptext, key, iv)
    console.debug("ciphertext as bytes: " + bytes_to_str(ctext))
    ctext = encode64(ctext)
    console.debug("ciphertext as base64: " + ctext)

    var data = ''
    data += '// key_derivation_algo: PBKDF2\n'
    data += '// key_derivation_hmac: HMAC_SHA1\n'
    data += '// key_derivation_iterations: 4096\n'
    data += '// cipher: AES256\n'
    data += '// mode: CBC\n'
    data += '// salt: ' + bytes_to_str(salt) + '\n'
    data += '// notes: PBKDF2 derives 48 bytes, [0,31] for key, [32,47] for IV\n'
    data += ctext
    var resp = ajax_post('backend.py', 'op=save&paste=' + data)

    var re = /OK:(.*)/
    var match = re.exec(resp)

    if(match) {
        var fname = match[1]
        var url = document.URL

        if(!(/\/$/.exec(url))) {
            url += '/'
        }

        var url_raw = url + 'pastes/' + fname
        var url_share = url + 'read.py?p=' + fname
        var url_save = url + 'save.py?p=' + fname

        console.debug(url)

        /* build output dialogue */
        document.getElementById('url_share').innerHTML = url_share
        document.getElementById('url_raw').innerHTML = url_raw
        document.getElementById('url_save').innerHTML = url_save
        unhide_elem(result)
        
        /* hide the input dialogue */
        hide_elem(elem_new_paste)
    }

    /* 5) Output the ciphertext C. */
    AES_Done()

    /* temporary testing....could we recover plaintext? */
    AES_Init()
    derived_data = PBKDF2(0, password, salt, iterations, dk_len)
    key = derived_data.slice(0, 32)
    iv = derived_data.slice(32, 48)
    console.debug("derived key: " + bytes_to_str(key))
    console.debug("derived iv: " + bytes_to_str(iv))
    ptext = AES_CBC_Decrypt(decode64(ctext), key, iv)
    console.debug("ptext: " + bytes_to_str(ptext))
    ptext = AES_unpad(ptext)
    console.debug("ptext (pad removed): " + bytes_to_str(ptext))
    console.debug("recovered string: " + uni16_to_str(ptext))
    AES_Done()

    
}
