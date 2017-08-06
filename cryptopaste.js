/*
 main javascript file (utilities + glue + ...)

 Copyright (c) 2013-2017 Andrew Lamoureux

 This file is a part of CrytoPaste

 This program is free software; you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation; either version 2 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but WITHOUT
 ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 details.

 You should have received a copy of the GNU General Public License along with
 this program; if not, write to the Free Software Foundation, Inc., 59 Temple
 Place, Suite 330, Boston, MA 02111-1307 USA
*/

/******************************************************************************
	GLOBAL VARIABLES
******************************************************************************/
var elem_new_paste
var elem_result

/******************************************************************************
	FUNCTIONS
******************************************************************************/
function cryptopaste_init()
{
	elem_new_paste = document.getElementById('new_paste')
	elem_result = document.getElementById('result')
}

/******************************************************************************
	WEB UTILITIES
******************************************************************************/
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
	query is like 'foo=1&bar=2'
*/
function ajax_post(url, query) {
	var xmlhttp = new XMLHttpRequest()
	console.log("AJAX URL: " + url)
	xmlhttp.open("POST", url, false)
	/* forms have two content types
		- multipart/form-data : the HTTP message body is collection of parts
		  in a MIME blob (like email attachments) so each part has its own
		  'Content-Type' and 'Content-Disposition' and you have to concern
		  yourself with the boundary or divider
		- application/x-www-form-urlencoded : the body of the HTTP message is
		  a (potentially huge) query string of name/value pairs where you have
		  to take care not to collide with '?' '&' and '='
	*/
	xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
	//xmlhttp.setRequestHeader('Content-length', query.length)
	//xmlhttp.setRequestHeader('Connection', 'close')
	xmlhttp.send(query)
	var resp = xmlhttp.responseText
	console.log("AJAX RESP: " + resp)
	return resp
}

/* url is like 'backend.py'
	data_string is like "-----BEGIN PGP..."

	returns the generated file name from the backend */
function ajaxFile(url, data_string) {
	query = 'op=upload&fdata='+encodeURIComponent(data_string)
	return ajax_post(url, query)
}

function hide_elem(elem) {
	elem.style.display = 'none'
}

function unhide_elem(elem) {
	elem.style.display = 'block'
}

/******************************************************************************
	GENERAL UTILITIES
******************************************************************************/

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
function ascii_decode(string)
{
	array = []

	for(var i=0; i<string.length; ++i) {
		array.push(string.charCodeAt(i))
	}

	return array
}

/* converts [0x41, 0x41, 0x41, 0x41] to "AAAA" */
function ascii_encode(array)
{
	string = ''

	for(var i=0; i<array.length; ++i) {
		string += String.fromCharCode(array[i])
	}

	return string
}

/* converts [0xDE, 0xAD, 0xBE, 0xEF] to "DEADBEEF" */
function bytes_pretty(bytes)
{
	var string = ''

	for(var i=0; i < bytes.length; ++i) {
		string += sprintf('%02X', bytes[i])
	}

	return string
}

/* converts [0xDE, 0xAD, 0xBE, 0xEF] to "\xDE\xAD\xBE\xEF" */
function bytes_to_string(bytes)
{
	var lookup = {
		0x00:'\x00', 0x01:'\x01', 0x02:'\x02', 0x03:'\x03', 0x04:'\x04', 0x05:'\x05', 0x06:'\x06', 0x07:'\x07',
		0x08:'\x08', 0x09:'\x09', 0x0A:'\x0A', 0x0B:'\x0B', 0x0C:'\x0C', 0x0D:'\x0D', 0x0E:'\x0E', 0x0F:'\x0F',
		0x10:'\x10', 0x11:'\x11', 0x12:'\x12', 0x13:'\x13', 0x14:'\x14', 0x15:'\x15', 0x16:'\x16', 0x17:'\x17',
		0x18:'\x18', 0x19:'\x19', 0x1A:'\x1A', 0x1B:'\x1B', 0x1C:'\x1C', 0x1D:'\x1D', 0x1E:'\x1E', 0x1F:'\x1F',
		0x20:'\x20', 0x21:'\x21', 0x22:'\x22', 0x23:'\x23', 0x24:'\x24', 0x25:'\x25', 0x26:'\x26', 0x27:'\x27',
		0x28:'\x28', 0x29:'\x29', 0x2A:'\x2A', 0x2B:'\x2B', 0x2C:'\x2C', 0x2D:'\x2D', 0x2E:'\x2E', 0x2F:'\x2F',
		0x30:'\x30', 0x31:'\x31', 0x32:'\x32', 0x33:'\x33', 0x34:'\x34', 0x35:'\x35', 0x36:'\x36', 0x37:'\x37',
		0x38:'\x38', 0x39:'\x39', 0x3A:'\x3A', 0x3B:'\x3B', 0x3C:'\x3C', 0x3D:'\x3D', 0x3E:'\x3E', 0x3F:'\x3F',
		0x40:'\x40', 0x41:'\x41', 0x42:'\x42', 0x43:'\x43', 0x44:'\x44', 0x45:'\x45', 0x46:'\x46', 0x47:'\x47',
		0x48:'\x48', 0x49:'\x49', 0x4A:'\x4A', 0x4B:'\x4B', 0x4C:'\x4C', 0x4D:'\x4D', 0x4E:'\x4E', 0x4F:'\x4F',
		0x50:'\x50', 0x51:'\x51', 0x52:'\x52', 0x53:'\x53', 0x54:'\x54', 0x55:'\x55', 0x56:'\x56', 0x57:'\x57',
		0x58:'\x58', 0x59:'\x59', 0x5A:'\x5A', 0x5B:'\x5B', 0x5C:'\x5C', 0x5D:'\x5D', 0x5E:'\x5E', 0x5F:'\x5F',
		0x60:'\x60', 0x61:'\x61', 0x62:'\x62', 0x63:'\x63', 0x64:'\x64', 0x65:'\x65', 0x66:'\x66', 0x67:'\x67',
		0x68:'\x68', 0x69:'\x69', 0x6A:'\x6A', 0x6B:'\x6B', 0x6C:'\x6C', 0x6D:'\x6D', 0x6E:'\x6E', 0x6F:'\x6F',
		0x70:'\x70', 0x71:'\x71', 0x72:'\x72', 0x73:'\x73', 0x74:'\x74', 0x75:'\x75', 0x76:'\x76', 0x77:'\x77',
		0x78:'\x78', 0x79:'\x79', 0x7A:'\x7A', 0x7B:'\x7B', 0x7C:'\x7C', 0x7D:'\x7D', 0x7E:'\x7E', 0x7F:'\x7F',
		0x80:'\x80', 0x81:'\x81', 0x82:'\x82', 0x83:'\x83', 0x84:'\x84', 0x85:'\x85', 0x86:'\x86', 0x87:'\x87',
		0x88:'\x88', 0x89:'\x89', 0x8A:'\x8A', 0x8B:'\x8B', 0x8C:'\x8C', 0x8D:'\x8D', 0x8E:'\x8E', 0x8F:'\x8F',
		0x90:'\x90', 0x91:'\x91', 0x92:'\x92', 0x93:'\x93', 0x94:'\x94', 0x95:'\x95', 0x96:'\x96', 0x97:'\x97',
		0x98:'\x98', 0x99:'\x99', 0x9A:'\x9A', 0x9B:'\x9B', 0x9C:'\x9C', 0x9D:'\x9D', 0x9E:'\x9E', 0x9F:'\x9F',
		0xA0:'\xA0', 0xA1:'\xA1', 0xA2:'\xA2', 0xA3:'\xA3', 0xA4:'\xA4', 0xA5:'\xA5', 0xA6:'\xA6', 0xA7:'\xA7',
		0xA8:'\xA8', 0xA9:'\xA9', 0xAA:'\xAA', 0xAB:'\xAB', 0xAC:'\xAC', 0xAD:'\xAD', 0xAE:'\xAE', 0xAF:'\xAF',
		0xB0:'\xB0', 0xB1:'\xB1', 0xB2:'\xB2', 0xB3:'\xB3', 0xB4:'\xB4', 0xB5:'\xB5', 0xB6:'\xB6', 0xB7:'\xB7',
		0xB8:'\xB8', 0xB9:'\xB9', 0xBA:'\xBA', 0xBB:'\xBB', 0xBC:'\xBC', 0xBD:'\xBD', 0xBE:'\xBE', 0xBF:'\xBF',
		0xC0:'\xC0', 0xC1:'\xC1', 0xC2:'\xC2', 0xC3:'\xC3', 0xC4:'\xC4', 0xC5:'\xC5', 0xC6:'\xC6', 0xC7:'\xC7',
		0xC8:'\xC8', 0xC9:'\xC9', 0xCA:'\xCA', 0xCB:'\xCB', 0xCC:'\xCC', 0xCD:'\xCD', 0xCE:'\xCE', 0xCF:'\xCF',
		0xD0:'\xD0', 0xD1:'\xD1', 0xD2:'\xD2', 0xD3:'\xD3', 0xD4:'\xD4', 0xD5:'\xD5', 0xD6:'\xD6', 0xD7:'\xD7',
		0xD8:'\xD8', 0xD9:'\xD9', 0xDA:'\xDA', 0xDB:'\xDB', 0xDC:'\xDC', 0xDD:'\xDD', 0xDE:'\xDE', 0xDF:'\xDF',
		0xE0:'\xE0', 0xE1:'\xE1', 0xE2:'\xE2', 0xE3:'\xE3', 0xE4:'\xE4', 0xE5:'\xE5', 0xE6:'\xE6', 0xE7:'\xE7',
		0xE8:'\xE8', 0xE9:'\xE9', 0xEA:'\xEA', 0xEB:'\xEB', 0xEC:'\xEC', 0xED:'\xED', 0xEE:'\xEE', 0xEF:'\xEF',
		0xF0:'\xF0', 0xF1:'\xF1', 0xF2:'\xF2', 0xF3:'\xF3', 0xF4:'\xF4', 0xF5:'\xF5', 0xF6:'\xF6', 0xF7:'\xF7',
		0xF8:'\xF8', 0xF9:'\xF9', 0xFA:'\xFA', 0xFB:'\xFB', 0xFC:'\xFC', 0xFD:'\xFD', 0xFE:'\xFE', 0xFF:'\xFF'
	}

	var tmp = ''
	for(i=0; i<bytes.length; ++i)
		tmp += lookup[bytes[i]]

	return tmp
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

/******************************************************************************
	OPENPGP FUNCTIONS
******************************************************************************/

g_fname = "ptext.txt"
g_message = "Hello, world!"
g_passphrase = "pw"

function create_pkt(body, tagid)
{
	tag_byte = 0x80
	tag_byte |= (tagid << 2)

	length_bytes = ''
	if(body.length < 256) {
		tag_byte |= 0								/* length type = 0 (1 byte length) */
		length_bytes = [body.length]
	}
	else if(body.length < 65536) {
		tag_byte |= 1								/* length type = 1 (2 byte length) */
		length_bytes = uint16_to_bytes(body.length, "big")
	}
	else if(body.length < 1048576) {
		tag_byte |= 2								/* length type = 2 (4 byte length) */
		length_bytes = uint32_to_bytes(body.length, "big")
	}

	pkt_hdr = [tag_byte].concat(length_bytes)		/* hdr = tag byte + length bytes */

	return pkt_hdr.concat(body)						/* add hdr */
}

function create_pkt3(salt)
{
	body = [0x04]									/* version */
	body = body.concat(0x03)						/* block algo: CAST5 */
	body = body.concat(0x03)						/* s2k id: Iterated+Salted */
	body = body.concat(0x02)						/* hash id: sha1 */
	body = body.concat(salt)
	body = body.concat(0x60)						/* count (decodes to 65536) */
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
	console.debug('CAST5 key: ' + bytes_pretty(key))

	c5 = new OpenpgpSymencCast5()
	c5.setKey(key)

	/* encrypt with OpenPGP CFB Mode (see 13.9) */
	//prefix = os.urandom(8)
	prefix = [0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8]

	FR = [0,0,0,0,0,0,0,0]
	FRE = c5.encrypt(FR)
	console.debug('CAST5 first output: ' + bytes_pretty(FRE))
	ctext = array_xor(prefix, FRE)
	console.debug('first ctext: ' + bytes_pretty(ctext))

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
	body = body.concat(ascii_decode(g_fname))		/* filename */
	body = body.concat([0,0,0,0])					/* date */
	body = body.concat(ascii_decode(g_message))
	return create_pkt(body, 11)
}

function crc24(bytes)
{
	crc = 0xB704CE

	for(i=0; i<bytes.length; ++i) {
		crc ^= (bytes[i] << 16);

		for(j=0; j<8; ++j) {
			crc <<= 1
			if(crc & 0x1000000) {
				crc ^= 0x1864CFB
			}
		}
	}

	return crc & 0xFFFFFF;
}

/******************************************************************************
	FORM INTERACTION, CALLBACKS
******************************************************************************/

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

	var ptext = ascii_decode(elem_pt.value)
	//var ptext = str_to_uni16(elem_pt.value)

	console.debug("ptext: " + elem_pt.value)

	/* packet 11 is Literal Data Packet (holding the plaintext) */
	var pkt11 = create_pkt11(elem_pt);
	console.debug("pkt11: " + bytes_pretty(pkt11))

	/* packet 9 is Symmetrically Encrypted Data Packet
		(encapsulating (encrypted) the packet 9) */
	salt = [0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]
	pkt9 = create_pkt9(pkt11, ascii_decode("pw"), salt)
	console.debug("pkt9: " + bytes_pretty(pkt9))

	/* packet 3 is Encrypted Session Key Packet (holds the salt) */
	pkt3 = create_pkt3(salt)
	console.debug("pkt3: " + bytes_pretty(pkt3))

	/* convert packet 3 and packet 9 to a string, eg:
		[0xDE, 0xAD, 0xBE, 0xEF] -> '\xDE\xAD\xBE\xEF' */
	data = pkt3.concat(pkt9)
	console.debug("data: " + bytes_pretty(data))
	tmp = bytes_to_string(data)

	/* convert to base64, eg:
		'\xDE\xAD\xBE\xEF' -> '3q2+7w==' */
	tmp = btoa(tmp)
	console.debug("b64(data): " + tmp)

	/* checksum */
	csum = crc24(data)
	console.debug("csum: " + csum.toString(16))
	csum = uint32_to_bytes(csum, 'big')
	console.debug("csum bytes: " + bytes_pretty(csum))
	csum = bytes_to_string(csum.slice(1,4))
	csum = btoa(csum)
	console.debug("csum b64: " + csum)

	output = '-----BEGIN PGP MESSAGE-----\n\n'
	output += tmp
	output += '\n='
	output += csum
	output += '\n-----END PGP MESSAGE-----\n'
	console.debug(output)

	fname = ajaxFile('backend.py', output)
	console.debug("backend generated file name: " + fname)
}
