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
function str_encode_ascii(string)
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
	var result = []
	
	min = Math.min(a.length, b.length)
	for(var i=0; i < min; ++i) {
		result = result.concat(a[i] ^ b[i]);
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

/* converts 0xDEAD to [0xDE, 0xAD] */
function uint16_to_bytes(x, endian)
{
	var rv = []

	/* default endian is little */
	endian = (typeof(endian) == 'undefined') ? 'little' : endian

	for(var i=0; i<2; ++i) {
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
	OPENPGP FUNCTIONS
 *****************************************************************************/

g_fname = "ptext.txt"
g_message = "Hello, world!"
g_passphrase = "pw"

function create_pkt(body, tagid)
{
	tag_byte = 0x80
	tag_byte |= (tagid << 2)	

	length_bytes = ''
	if(body.length < 256) {
		tag_byte |= 0							/* length type = 0 (1 byte length) */
		length_bytes = [body.length]
	}
	else if(body.length < 65536) {
		tag_byte |= 1							/* length type = 1 (2 byte length) */
		length_bytes = uint16_to_bytes(body.length, "big")
	}
	else if(body.length < 1048576) {
		tag_byte |= 2							/* length type = 2 (4 byte length) */
		length_bytes = uint32_to_bytes(body.length, "big")
	}

	pkt_hdr = [tag_byte].concat(length_bytes)	/* hdr = tag byte + length bytes */
	
	return pkt_hdr.concat(body)					/* add hdr */
}

function create_pkt3(salt)
{
	body = [0x04]									/* version */
	body = body.concat(0x03)								/* block algo: CAST5 */
	body = body.concat(0x03)								/* s2k id: Iterated+Salted */
	body = body.concat(0x02)								/* hash id: sha1 */
	body = body.concat(salt)
	body = body.concat(0x60)								/* count (decodes to 65536) */
	return create_pkt(body, 3)
}

function create_pkt9(ptext, passphrase, salt)
{
	msg = []
	while(msg.length < 65536) {
		msg = msg.concat(salt, passphrase)
	}
	msg = msg.slice(0,65536)
	
	digest = SHA1(msg)								/* hash it */

	key = digest.slice(0,16)						/* CAST5 key is 16 bytes of hash */
	console.debug('CAST5 key: ' + bytes_to_str(key))

	c5 = new OpenpgpSymencCast5()
	c5.setKey(key)

	/* encrypt with OpenPGP CFB Mode (see 13.9) */
	//prefix = os.urandom(8)
	prefix = [0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8]

	FR = [0,0,0,0,0,0,0,0]
	FRE = c5.encrypt(FR)
	console.debug('CAST5 first output: ' + bytes_to_str(FRE))
	ctext = array_xor(prefix, FRE)
	console.debug('first ctext: ' + bytes_to_str(ctext))

	FR = ctext
	FRE = c5.encrypt(FR, key)
	ctext = ctext.concat(array_xor(prefix.slice(6,8), FRE.slice(0,2)))

	FR = ctext.slice(2,10)
	while(ptext.length) {
		FRE = c5.encrypt(FR, key)
		FR = array_xor(ptext.slice(0,8), FRE)
		ctext = ctext.concat(FR)
		ptext = ptext.slice(8)
	}

	return create_pkt(ctext, 9);
}

function create_pkt11(msg)
{
	body = [0x62]									/* 'b' format (binary) */
	body = body.concat(g_fname.length)				/* filename len */
	body = body.concat(str_encode_ascii(g_fname))	/* filename */
	body = body.concat([0,0,0,0])					/* date */
	body = body.concat(str_encode_ascii(g_message))
	return create_pkt(body, 11)
}

/******************************************************************************
	FORM INTERACTION, CALLBACKS
 *****************************************************************************/

function encrypt()
{
	/* 1) Select a salt S and an iteration count c */
	var salt_ui8 = new Uint8Array(8)
	window.crypto.getRandomValues(salt_ui8)
	var salt = []
	for(var i=0; i<8; ++i) {
		salt[i] = salt_ui8[i]
	}

	salt = [0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]

	var elem_pt = document.getElementsByName("plaintext")[0]

	var ptext = str_encode_ascii(elem_pt.value)
	//var ptext = str_to_uni16(elem_pt.value)

	console.debug("ptext: " + elem_pt.value)

	/* packet 11 is Literal Data Packet (holding the plaintext) */
	var pkt11 = create_pkt11(elem_pt);
	console.debug("pkt11: " + bytes_to_str(pkt11))

	/* packet 9 is Symmetrically Encrypted Data Packet
		(encapsulating (encrypted) the packet 9) */
	salt = [0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]
	pkt9 = create_pkt9(pkt11, str_encode_ascii("pw"), salt)
	console.debug("pkt9: " + bytes_to_str(pkt9))

	/* packet 3 is Encrypted Session Key Packet (holds the salt) */
	pkt3 = create_pkt3(salt)
	console.debug("pkt3: " + bytes_to_str(pkt3))
}
