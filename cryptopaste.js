/*
 Main CryptoPaste JS Program

 Copyright (c) 2013-2017 Andrew Lamoureux

 This file is a part of CryptoPaste

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
 SETTINGS, GLOBAL VARIABLES
******************************************************************************/

// one of {'hideall', 'encrypt', 'staging', 'decrypt', 'decrypted', 'hosted'} */
var mode

var elem_plaintext
var elem_ciphertext
var elem_passphrase

var elem_plaintext_label
var elem_ciphertext_label
var elem_passphrase_label

var elem_decrypt_btn
var elem_encrypt_btn
var elem_buttons_staging

var elem_url_share_info
var elem_url_share

var elem_url_raw_info
var elem_url_raw

var elem_about

/******************************************************************************
 FUNCTIONS
******************************************************************************/
function set_globals()
{
	console.debug("set_globals()")

	mode = 'encrypt'

	/* collect important elements */
	elem_plaintext = document.getElementById('plaintext')
	elem_ciphertext = document.getElementById('ciphertext')
	elem_passphrase = document.getElementById('passphrase')

	elem_plaintext_label = document.getElementById('plaintext_label')
	elem_ciphertext_label = document.getElementById('ciphertext_label')
	elem_passphrase_label = document.getElementById('passphrase_label')

	elem_decrypt_btn = document.getElementById('decrypt_btn')
	elem_encrypt_btn = document.getElementById('encrypt_btn')

	elem_buttons_staging = document.getElementById('buttons_staging')
	elem_url_share_info = document.getElementById('url_share_info')
	elem_url_share = document.getElementById('url_share')

	elem_url_raw_info = document.getElementById('url_raw_info')
	elem_url_raw = document.getElementById('url_raw')
	
	elem_about = document.getElementById('about')
}

function cryptopaste_init()
{
	set_globals()

	mode = 'hideall'
	gui_switch()

	var pathname = window.location.pathname
	if(pathname[0] == '/')
		pathname = pathname.substr(1)
	
	/* if nothing is in the pathname, eg: www.cryptopaste.com, then go into
		normal encrypt mode */
	if(pathname == '' || pathname == 'index.html') {
		mode = 'encrypt'
	}
	/* if the pathname is AdjAdjAnimal, seek the .gpg from backend and go into
		decrypt mode, eg:
		https://cryptopaste.com/RedBlueBird.gpg */
	else 
	if(/^[A-Za-z]+(\.gpg)?$/.test(pathname)) {
		var adj_adj_animal = pathname
		if(adj_adj_animal[0] == '/')
			adj_adj_animal = adj_adj_animal.substr(1)
		console.debug("adj_adj_animal: " + adj_adj_animal)
	
		/* form new url */
		var path_gpg = window.location.href.replace(adj_adj_animal,
		  "backend.py?op=read&fname=" + adj_adj_animal)

		if(!path_gpg.endsWith('.gpg'))
			path_gpg += '.gpg'
		console.debug("seeking: " + path_gpg)
	
		/* read GPG data into the decrypt field */
		var resp = ajax_get(path_gpg).trim()

		if(resp == 'MALFORMED')
			errQuit('malformed file name (don\'t hack me bro)')
		if(resp == 'NONEXISTENT')
			errQuit('missing file (did it expire?)')
		if(resp.substr(0, 27) != '-----BEGIN PGP MESSAGE-----')
			errQuit('backend didn\'t serve up PGP data')

		elem_ciphertext.value = resp

		mode = 'decrypt'
	}
	/* else */
	else {
		errQuit('don\'t know how to handle pathname: ' + pathname)
	}

	gui_switch()
}

/* show elements corresponding to the current mode */
function gui_switch()
{
	console.debug("gui_switch(): " + mode)

	/* hide everything */
	elem_plaintext.style.display = 'none'
	elem_ciphertext.style.display = 'none'
	elem_passphrase.style.display = 'none'

	elem_plaintext_label.style.display = 'none'
	elem_ciphertext_label.style.display = 'none'
	elem_passphrase_label.style.display = 'none'

	elem_encrypt_btn.style.display = 'none'
	elem_decrypt_btn.style.display = 'none'
	elem_buttons_staging.style.display = 'none'

	elem_url_share_info.style.display = 'none'
	elem_url_share.style.display = 'none'

	elem_url_raw_info.style.display = 'none'
	elem_url_raw.style.display = 'none'

	elem_about.style.display = 'none'

	if(mode == 'encrypt') {
		elem_plaintext_label.style.display = ''
		elem_plaintext.style.display = ''
		elem_passphrase_label.style.display = ''
		elem_passphrase.style.display = ''
		elem_passphrase.placeholder="(choose a strong passphrase)"
		elem_encrypt_btn.style.display = ''
		elem_about.style.display = ''
	}
	else
	if(mode == 'staging') {
		elem_ciphertext_label.style.display = ''
		elem_ciphertext.style.display = ''
		elem_buttons_staging.style.display = ''
	}
	else
	if(mode == 'decrypt') {
		elem_ciphertext_label.style.display = ''
		elem_ciphertext.style.display = ''
		elem_passphrase_label.style.display = ''
		elem_passphrase.style.display = ''
		elem_passphrase.placeholder="(matching passphrase)"
		elem_decrypt_btn.style.display = ''
	}
	else
	if(mode == 'decrypted') {
		elem_plaintext_label.style.display = ''
		elem_plaintext.style.display = ''
	}
	else
	if(mode == 'hosted') {
		elem_url_share_info.style.display = ''
		elem_url_share.style.display = ''

		elem_url_raw_info.style.display = ''
		elem_url_raw.style.display = ''
	}
	else
	if(mode == 'hideall') {
		
	}
	else {
		errQuit("unknown mode: " + mode)
	}
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

	if(resp.length > 16)
		console.log("AJAX: " + resp.substr(0,16) + '...')
	else
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

	if(resp.length > 16)
		console.log("AJAX: " + resp.substr(0,16) + '...')
	else
		console.log("AJAX: " + resp)

	if(resp.search("A problem occurred in a Python script.") >= 0) {
		document.write(resp);
		errQuit("backend error: python script");
	}
	return resp
}

/* url is like 'backend.py'
	data_string is like "-----BEGIN PGP..."

	returns the generated file name from the backend */
function ajax_file(url, data_string) {
	query = 'op=upload&fdata='+encodeURIComponent(data_string)
	return ajax_post(url, query)
}

/******************************************************************************
 GENERAL UTILITIES
******************************************************************************/

function bytes_pretty(bytes)
{
	/* map doesn't work right on UInt8Array, eg:
		var foo = Uint8Array([154])
		foo.map(function(x) { return x.toString(16) })
		return a Uint8Array :/
	*/
	var suffix = ''
	var tmp = Array.from(bytes)
	if(tmp.length > 32) {
		tmp = tmp.slice(0,32)
		suffix = '...'
	}

	return tmp.map(
		function(x) {
			var t = x.toString(16)
			if (x<16)
				return '0'+t;
			else
				return t;
		}
	).join('') + suffix
}

/*  INPUT: string to be encoded (javascript string)
   OUTPUT: encoding (array of bytes: Uint8Array) */
function utf8_encode(str)
{
	/* map the string to char codes */
	var charCodes = Array.from(str)
	charCodes = charCodes.map(function(x) { return x.charCodeAt(0) })

	/* first pass: count the bytes needed */
	var bytesNeeded = charCodes.reduce(
		function(sum, charCode) {
			if(charCode <= 0x7F) return sum+1
			if(charCode <= 0x7FF) return sum+2
			if(charCode <= 0xFFFF) return sum+3
			if(charCode <= 0x10FFFF) return sum+4
			errQuit('unexpected character code: ' + charCode + ' in utf8_encode()')
		},
		0 /* initial reduce value */
	)
	
	/* allocate the result */
	var result = new Uint8Array(bytesNeeded)

	/* map the char codes to bytes */
	var src, dst	
	for(dst=0, src=0; src < charCodes.length; ++src) {

		var cc = charCodes[src]

		if(cc <= 0x7F) {
			result[dst] = cc;
			dst += 1
		}
		else if(cc <= 0x7FF) {
			result[dst] = 0xC0 | (cc >> 6)				// 110xxxxx
			result[dst+1] = 0x80 | (cc & 0x3F)			// 10xxxxxx
			dst += 2
		}
		else if(cc <= 0xFFFF) {
			result[dst] = 0xE0 | (cc >> 12)				// 1110xxxx
			result[dst+1] = 0x80 | ((cc & 0xFC0)>>6)	// 10xxxxxx
			result[dst+2] = 0x80 | (cc & 0x3F)			// 10xxxxxx
			dst += 3
		}
		else {
			result[dst] = 0xF0 | (cc >> 18)				// 11110xxx
			result[dst+1] = 0x80 | ((cc & 0x3F000)>>12)	// 10xxxxxx
			result[dst+2] = 0x80 | ((cc & 0xFC0)>>6)	// 10xxxxxx
			result[dst+3] = 0x80 | (cc & 0x3F)			// 10xxxxxx
			dst += 4
		}
	}

	/* return the bytes */
	return result
}

/*  INPUT: Uint8Array (array of bytes)
	OUTPUT: javascript string
*/
function utf8_decode(bytes)
{
	/* first pass: count the number of char codes to allocate */
	var src, dst, numChars

	for(src=0, numChars=0; src < bytes.length; numChars += 1) {
		var b = bytes[src]
	
		if((b & 0x80) == 0)
			src += 1
		else if((b & 0xE0) == 0xC0)
			src += 2
		else if((b & 0xF0) == 0xE0)
			src += 3
		else if((b & 0xF8) == 0xF0)
			src += 4
		else
			errQuit('unexpected utf8 byte: ' + b + ' in utf8_decode()')
	}

	/* allocate the char codes */
	var charCodes = new Uint32Array(numChars)
	
	/* second pass: translate the bytes into char codes */

	for(src=0, dst=0; src < bytes.length; ++dst) {
		var b = bytes[src]
		var charCode = 0

		if((b & 0x80) == 0) {
			charCode = bytes[src]
			src += 1
		}
		else if((b & 0xE0) == 0xC0) {
			charCode = (bytes[src] & 0x1F) << 6
			charCode |= (bytes[src+1] & 0x3F)
			src += 2
		}
		else if((b & 0xF0) == 0xE0) {
			charCode = (bytes[src] & 0x0F) << 12
			charCode |= (bytes[src+1] & 0x3F) << 6
			charCode |= (bytes[src+2] & 0x3F)
			src += 3
		}
		else if((b & 0xF8) == 0xF0) {
			charCode = (bytes[src] & 0x07) << 18
			charCode |= (bytes[src+1] & 0x3F) << 12
			charCode |= (bytes[src+2] & 0x3F) << 6
			charCode |= (bytes[src+3] & 0x3F)
			src += 4
		}

		charCodes[dst] = charCode
	}

	/* map the char codes to a string */
	return String.fromCharCode.apply(null, charCodes)
}

function crypt_gen_random(len)
{
	var arr = new Uint8Array(len)
	window.crypto.getRandomValues(arr)
	return arr
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

	return new Uint8Array(rv)
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

	return new Uint8Array(rv)
}

/* converts 'QUFBQQo=' to [0x41, 0x41, 0x41, 0x41] */
function b64_to_bytes(str)
{
	var tmp = atob(str)
	result = new Uint8Array(tmp.length)
	for(var i=0; i<tmp.length; ++i)
		result[i] = tmp.charCodeAt(i)
	return result
}

/* converts [0x41, 0x41, 0x41, 0x41] to 'QUFBQQo='
	and adds appropriate newlines */
function b64_encode(big)
{
	/* 6.3. Encoding Binary in Radix-64
		The encoded output stream must be represented in lines of no more
		than 76 characters each */
	big = btoa(big)
	if(big.len < 76)
		return big

	/* convert string to array, 'AAAA' -> ['A', 'A', 'A', 'A'] */
	big = Array.from(big)
	/* run an accumulator over the whole thing, returning nothing except at
		indices multiple of 76, where we grab a chunk and save it */
	big = big.reduce(
		function(sum,value,idx,arr) {
			return idx%76 ? sum : sum.concat(arr.slice(idx,idx+76).join(''))
		},
		[] /* initial value */
	)

	return big.join('\n')
}

function u8cmp(a, b)
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

/* c = a^b */
function u8xor(c,cOffs, a,aOffs, b,bOffs, len)
{
	for(var i=0; i<len; ++i)
		c[cOffs+i] = a[aOffs+i] ^ b[bOffs+i];
}

function arr_move(arr, dst, src, len)
{
	for(var i=dst; i<len; ++i)
		arr[dst+(len-1)-i] = arr[src+(len-1)-i]
}

/* a = b */
function u8memcpy(a, aOffs, b, bOffs, len)
{
	/* assume .set() is optimized, use it when possible */
	if(bOffs == 0 && b.length == len) {
		a.set(b, aOffs)
		return
	}
	
	for(var i=0; i<len; ++i)
		a[aOffs+i] = b[bOffs+i]
}

/* return new concatenation of a, b */
function u8concat(a, b)
{
	var c = new Uint8Array(a.length + b.length);
	c.set(a);
	c.set(b, a.length)
	return c
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

function errQuit(msg)
{
	alert(msg)
	throw('ERROR: ' + msg)
}

function assert(condition)
{
	if(!condition)
		errQuit('assertion failed')
}

function assertType(inst, typeName)
{
	if(typeof(inst) == "object")
		assert(inst.constructor.name == typeName)
	else
		assert(typeof(inst) == typeName)
}

/******************************************************************************
 OPENPGP FUNCTIONS
******************************************************************************/

/* in:
	body: Uint8Array
    tagid: integer
   out:
	Uint8Array
*/
function create_pkt(body, tagid)
{
	assertType(body, 'Uint8Array')

	var tag_byte = 0x80
	tag_byte |= (tagid << 2)

	var length_bytes
	if(body.length < 256) {
		tag_byte |= 0								/* length type = 0 (1 byte length) */
		length_bytes = new Uint8Array([body.length])
	}
	else if(body.length < 65536) {
		tag_byte |= 1								/* length type = 1 (2 byte length) */
		length_bytes = uint16_to_bytes(body.length, "big")
	}
	else if(body.length < 16777216) {
		tag_byte |= 2								/* length type = 2 (4 byte length) */
		length_bytes = uint32_to_bytes(body.length, "big")
	}
	else {
		errQuit('not expecting more than 16mb')
	}

	var pkt = new Uint8Array([tag_byte])			/* pkt = tag byte */
	console.log('length_bytes: ' + bytes_pretty(length_bytes))
	pkt = u8concat(pkt, length_bytes)				/* pkt += length bytes (completing header) */
	pkt = u8concat(pkt, body)						/* pkt += body */

	return pkt
}

function read_pkt(data)
{
	assertType(data, 'Uint8Array')
	
	var result
	var tag_byte = data[0]

	if(!(tag_byte & 0x80))
		errQuit("tag byte should have MSB set")

	if(tag_byte & 0x40)
		errQuit("new stream format unsupported")

	var hdr_len, body_len
	var tag_val = (tag_byte & 0x2C) >>> 2
	var len_type = tag_byte & 0x3

	if(len_type == 0) {
		body_len = data[1]
		hdr_len = 2
	}
	else if(len_type == 1) {
		body_len = (data[1] << 8) | data[2]
		hdr_len = 3
	}
	else if(len_type == 2) {
		body_len = (data[1]<<24) | (data[2]<<16) | (data[3]<<8) | data[4]
		hdr_len = 5
	}
	else {
		errQuit("indeterminate packet length unsupported")
	}
	
	//console.log("pkt     type: " + tag_val)
	//console.log("pkt  hdr_len: " + hdr_len)
	//console.log("pkt body_len: " + body_len)

	if(hdr_len + body_len > data.length)
		errQuit("packet is larger than available data")
	
	var body = data.slice(hdr_len, hdr_len + body_len)

	return {'type': tag_val,
			'length': hdr_len + body_len,
			'header': data.slice(0, hdr_len),
			'body': body
		}
}

function create_pkt3(salt)
{
	assertType(salt, 'Uint8Array')
	body = new Uint8Array(13)
	body[0] = 0x04						/* version */
	body[1] = 0x03						/* block algo: CAST5 */
	body[2] = 0x03						/* s2k id: Iterated+Salted */
	body[3] = 0x02						/* hash id: sha1 */
	body.set(salt, 4)					/* salt */
	body[12] = 0x60						/* count (decodes to 65536) */
	return create_pkt(body, 3)
}

/* pgp's key derivation function (KDF) */
function s2k(passphrase, salt, hash_id, count, key_len)
{
	/* if sent "AAAA" convert to [0x41, 0x41, 0x41, 0x41] */
	if(typeof(passphrase) == "string") {
		var tmp = utf8_encode(passphrase)
		console.debug("passphrase: " + passphrase + " -> " + bytes_pretty(tmp))
		passphrase = tmp
	}

	assertType(salt, 'Uint8Array')
	assertType(passphrase, 'Uint8Array')

	var msg = u8concat(salt, passphrase)
	
	while(msg.length < count)
		msg = u8concat(msg, msg)
	msg = msg.slice(0,count)

	var digest
	if(hash_id == 2)
		digest = SHA1(msg)							/* hash it */
	else
		errQuit("support only for hash id 2 (SHA1)");

	assertType(digest, 'Uint8Array')
	return digest.slice(0, key_len)
}

function create_pkt9(ptext, passphrase, salt, prefix)
{
	assertType(ptext, 'Uint8Array')
	assertType(passphrase, 'Uint8Array')
	assertType(salt, 'Uint8Array')

	var key = s2k(passphrase, salt, 2, 65536, 16)
	console.debug('CAST5            key: ' + bytes_pretty(key))

	var c5 = new OpenpgpSymencCast5()
	c5.setKey(key)

	/* encrypt with OpenPGP CFB Mode (see 13.9) */
	if(prefix == undefined)
		prefix = crypt_gen_random(8)
	console.debug('CAST5         prefix: ' + bytes_pretty(prefix))

	var ctext = new Uint8Array(10 + ptext.length)
	var FR = new Uint8Array([0,0,0,0,0,0,0,0])
	var FRE = c5.encrypt(FR)
	console.debug('CAST5    initial FRE: ' + bytes_pretty(FRE))

	u8xor(ctext,0, prefix,0, FRE,0, 8)		/* ctext[0,7] */
	console.debug('CAST5   prefix ctext: ' + bytes_pretty(ctext))

	u8memcpy(FR,0, ctext,0, 8)				/* FR = ctext[0..7] */
	FRE = c5.encrypt(FR, key)				/* FRE = cast5(FR, key) */

	u8xor(ctext,8, prefix,6, FRE,0, 2)		/* ctext[8,9] = check */
	u8memcpy(FR,0, ctext,2, 8)				/* FR = ctext[2..9] */
	console.debug('CAST5 ctext w/ check: ' + bytes_pretty(ctext))

	var dstI = 10
	var srcI = 0
	var remaining = ptext.length
	while(remaining > 0) {
		FRE = c5.encrypt(FR, key)			/* FRE = cast5(FR, key) */
		u8xor(FR,0, ptext,srcI, FRE,0, 8)	/* FR = ptext ^ FRE */

		if(remaining >= 8)
			u8memcpy(ctext,dstI, FR,0, 8)	/* ctext += FR */
		else
			u8memcpy(ctext,dstI, FR,0, remaining)
	
		//console.debug('CAST5   ctext update: ' + bytes_pretty(ctext))

		dstI += 8
		srcI += 8
		remaining -= 8
	}

	return create_pkt(ctext, 9);
}

// inputs:
//   msg: bytes eg: [0x41, 0x41, 0x41, 0x41]
function create_pkt11(msg)
{
	assertType(msg, 'Uint8Array')
	
	fname = 'ptext.txt'
	body = new Uint8Array(2 + fname.length + 4)
	body[0] = 0x62									/* 'b' format (binary) */
	body[1] = fname.length							/* filename len */
	body.set(utf8_encode(fname), 2)				/* filename */
	body.set([0,0,0,0], 2 + fname.length)			/* date */
	body = u8concat(body, msg)						/* message */
	
	return create_pkt(new Uint8Array(body), 11)
}

function crc24(bytes)
{
	assertType(bytes, 'Uint8Array')

	var crc = 0xB704CE

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

/* input:
	ptext: plaintext (array of byte values)
	pass: passphrase (array of byte value)
   output:
	result (string like '-----BEGIN PGP MESSAGE-----....')
*/
function encrypt(ptext, pass, salt, prefix)
{
	assertType(ptext, 'Uint8Array')
	assertType(pass, 'Uint8Array')

	/* 1) Select a salt S */
	if(salt == undefined)
		salt = crypt_gen_random(8)
	console.debug("salt: " + bytes_pretty(salt));
	
	/* packet 11 is Literal Data Packet (holding the plaintext) */
	console.debug("ptext: " + bytes_pretty(ptext))
	var pkt11 = create_pkt11(ptext);
	console.debug("pkt11 (full, plain): " + bytes_pretty(pkt11))

	/* packet 9 is Symmetrically Encrypted Data Packet
		(encapsulating (encrypted) the packet 9) */
	console.debug("pass: " + bytes_pretty(pass))
	pkt9 = create_pkt9(pkt11, pass, salt, prefix)
	console.debug("pkt9 (full): " + bytes_pretty(pkt9))

	/* packet 3 is Encrypted Session Key Packet (holds the salt) */
	pkt3 = create_pkt3(salt)
	console.debug("pkt3 (full): " + bytes_pretty(pkt3))

	/* convert packet 3 and packet 9 to a string, eg:
		[0xDE, 0xAD, 0xBE, 0xEF] -> '\xDE\xAD\xBE\xEF' */
	data = u8concat(pkt3, pkt9)
	console.debug("data: " + bytes_pretty(data))
	tmp = bytes_to_string(data)

	/* convert to base64, eg:
		'\xDE\xAD\xBE\xEF' -> '3q2+7w==' */
	tmp = b64_encode(tmp)
	//console.debug("b64(data): " + tmp)

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

	return output
}

/* input:
	ctext: string like '-----BEGIN PGP MESSAGE-----....'
	pword: passphrase (Uint8Array)
   output:
	ptext: plaintext (Uint8Array)
*/
function decrypt(ctext, passphrase)
{
	/* strip header */
	if(ctext.substr(0,29) != '-----BEGIN PGP MESSAGE-----\n\n')
		errQuit("missing .gpg header");
	ctext = ctext.substr(29)

	/* eat whitespace */
	var realLen = ctext.length
	while(ctext[realLen-1] == '\n' || ctext[realLen-1] == ' ')
		realLen -= 1
	ctext = ctext.substr(0, realLen)

	/* strip footer */
	if(ctext.substr(-26) != '\n-----END PGP MESSAGE-----')
		errQuit("missing .gpg footer");
	ctext = ctext.substr(0, ctext.length - 26)

	/* split body, checksum, verify */
	var idx_last_nl = ctext.length-1
	for(var i=0; i<8; ++i) {
		if(ctext[idx_last_nl] == '\n')
			break
		idx_last_nl -= 1
	}

	if(idx_last_nl == ctext.length-1)
		errQuit("missing ascii armor checksum");

	if(ctext[idx_last_nl+1] != '=')
		errQuit("malformed ascii armor checksum");

	var csum = b64_to_bytes(ctext.substr(idx_last_nl+2))
	if(csum.length != 3)
		errQuit("expected checksum to decode to 3 bytes");

	csum = (csum[0]<<16) | (csum[1]<<8) | csum[2];
	console.log("csum given: " + csum.toString(16))

	ctext = b64_to_bytes(ctext.substr(0, idx_last_nl))

	var csum_calc = crc24(ctext)
	console.log("csum calculated: " + csum_calc.toString(16))
	if(csum != csum_calc)
		errQuit("checksum mismatch")

	/* extract, check pkt3 */
	var pkt_info = read_pkt(ctext)
	console.log("pkt3: " + bytes_pretty(pkt_info['body']))
	ctext = ctext.slice(pkt_info['header'].length + pkt_info['body'].length)

	if(pkt_info['type'] != 3)
		errQuit("expected gpg packet 3 (encrypted session key params)")

	if(pkt_info['body'][0] != 4)
		errQuit("support only for pkt3 version 4")
	if(pkt_info['body'][1] != 3)
		errQuit("support only for pkt3 block algo 3 (CAST5)")
	if(pkt_info['body'][2] != 3)
		errQuit("support only for pkt3 s2k algo 3 (iterated+salted)")
	if(pkt_info['body'][3] != 2)
		errQuit("support only for pkt3 hash id 2 (sha1)")

	if(pkt_info['length'] - pkt_info['header'].length != 13)
		errQuit("expected len(pkt3) == 13")

	var salt = pkt_info['body'].slice(4, 4+8)
	console.debug('salt: ' + bytes_pretty(salt))

	if(pkt_info['body'][12] != 0x60)
		errQuit("support only for pkt3 s2k iterations id 60 (65536)")

	/* extract, check packet 9 */
	pkt_info = read_pkt(ctext)
	if(pkt_info['type'] != 9)
		errQuit("expected gpg packet 9 (symm. encrypted data)")
	ctext = pkt_info['body']

	console.debug('CAST5  initial ctext: ' + bytes_pretty(ctext))

	/* derive key */
	var key = s2k(passphrase, salt, 2, 65536, 16)
	console.debug('CAST5            key: ' + bytes_pretty(key))

	/* decrypt */
	var c5 = new OpenpgpSymencCast5()
	c5.setKey(key)

	var FR = new Uint8Array([0,0,0,0,0,0,0,0])
	var FRE = c5.encrypt(FR)
	console.debug('CAST5  FRE = encr(0): ' + bytes_pretty(FRE))

	var prefix = new Uint8Array([0,0,0,0,0,0,0,0])
	u8xor(prefix,0, ctext,0, FRE,0, 8)					/* prefix = ctext ^ FRE */
	console.debug('CAST5         prefix: ' + bytes_pretty(prefix))

	u8memcpy(FR,0, ctext,0, 8)							/* FR = ctext[0..7] */
	FRE = c5.encrypt(FR)								/* FRE = cast5(FR, key) */

	if((ctext[8]^FRE[0]) != prefix[6] || (ctext[9]^FRE[1]) != prefix[7])
		errQuit("key check failed (likely wrong passphrase)")

	u8memcpy(FR,0, ctext,2, 8)							/* FR = ctext[2..9] */

	var ptext = new Uint8Array(ctext.length - 10)
	console.debug('CAST5   ptext update: ' + bytes_pretty(ptext))

	var dstI = 0
	var srcI = 10
	var remaining = ptext.length
	while(remaining > 0) {
		FRE = c5.encrypt(FR)							/* FRE = cast5(FR, key) */
		u8memcpy(FR,0, ctext,srcI, 8)					/* FR = ctext */

		if(remaining >= 8)								/* ptext += FRE^ctext */
			u8xor(ptext,dstI, ctext,srcI, FRE,0, 8)
		else
			u8xor(ptext,dstI, ctext,srcI, FRE,0, remaining)
		
		//console.debug('CAST5   ptext update: ' + bytes_pretty(ptext))

		dstI += 8
		srcI += 8
		remaining -= 8
	}

	console.log('ptext: ' + bytes_pretty(ptext))

	/* treat the plaintext as a pkt 11 */
	pkt_info = read_pkt(ptext)
	if(pkt_info['type'] != 11)
		errQuit("expected gpg packet 11 (literal data)")

	var pkt11 = pkt_info['body']
	console.log('pkt11: ' + bytes_pretty(pkt11))
	if(pkt11[0] != 0x62)
		errQuit("expected to decrypt binary data")
	if(u8cmp(pkt11.slice(1,1+10), [0x09, 0x70, 0x74, 0x65, 0x78, 0x74, 0x2e, 0x74, 0x78, 0x74]))
		errQuit("expected to decrypt dummy filename ptext.txt")
	if(u8cmp(pkt11.slice(11,11+4), [0, 0, 0, 0]))
		errQuit("expected to decrypt dummy date 00000000")
	msg = pkt11.slice(15)

	return msg
}

/******************************************************************************
 FORM INTERACTION, CALLBACKS
******************************************************************************/

function btn_decrypt()
{
	var ctext = elem_ciphertext.value
	var passphrase = elem_passphrase.value

	if(!passphrase.length)
		errQuit('missing passphrase')

	msg = decrypt(ctext, passphrase)

	console.log("msg: " + msg)

	elem_plaintext.value = utf8_decode(msg)

	mode = 'decrypted'
	gui_switch()
}

function btn_encrypt()
{
	var plaintext = utf8_encode(elem_plaintext.value)
	var pass_bytes = utf8_encode(elem_passphrase.value)

	output = encrypt(plaintext, pass_bytes)

	/* clear plaintext, password */
	elem_plaintext.value = ''
	elem_passphrase.value = ''

	elem_ciphertext.value = output
	mode = 'staging'
	gui_switch()
}

function btn_save_sdd()
{
	var sdd = ajax_get('sdd.html')
	sdd = sdd.replace('<!-- CIPHERTEXT -->', elem_ciphertext.value)

	/* temporary anchor tag */
	var elem = document.createElement('a');
	//elem.href = 'data:text/plain;base64,' + btoa(sdd)
	elem.href = URL.createObjectURL(new Blob([sdd]))
	elem.download = 'encrypted.html'
	elem.style.display = 'none'

	/* fake click it */
	document.body.appendChild(elem)
	elem.click()
	//document.body.removeChild(elem)
}

function btn_host()
{
	ctext = elem_ciphertext.value

	if(ctext == '')
		errQuit("ciphertext is empty")

	resp = ajax_file('backend.py', ctext)
	resp = resp.trim()
	console.log('backend response: ' + resp)
	if(resp == 'THROTTLED')
		errQuit("too many uploads (limit: 24 per day)")
	if(resp == 'TOOBIG')
		errQuit("too large (limit: 2mb after encoding)")
	if(resp.substr(resp.length-4) != ".gpg")
		errQuit("backend generating file name");

	fname = resp
	adj_adj_anim = fname.substr(0,fname.length-4)

	/* update gui stuff */
	elem_url_share.value = 'https://cryptopaste.com/' + adj_adj_anim
	elem_url_raw.value = 'https://cryptopaste.com/pastes/' + fname

	mode = 'hosted'
	gui_switch()
}

/******************************************************************************
 TEST
******************************************************************************/
function test()
{
	var known, salt, prefix
	var ptext, ptext_enc, ctext, ctext_enc, pass, pass_enc
	var tmp

	known = '-----BEGIN PGP MESSAGE-----\n\n'
	known += 'jA0EAwMCESIzRFVmd4hgpCi+L/NDluevyPWFyNZ5Ue71k0/0/aYt1A0Yol+QCECr'
	known += 'uTROYGQ/Q5AI\n=hjCh\n-----END PGP MESSAGE-----\n'

	/* encrypt against known result with fixed salt, prefix */
	console.log('"Hello, world!" with fixed salt, prefix')
	salt = new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88])
	prefix = new Uint8Array([0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8])
	ptext = "Hello, world!"	
	ptext_enc = utf8_encode(ptext)
	pass = 'pw'
	pass_enc = utf8_encode(pass)

	console.log('encrypt()')
	ctext_enc = encrypt(ptext_enc, pass_enc, salt, prefix)
	assert(ctext_enc == known)

	console.log('decrypt()')
	tmp = decrypt(ctext_enc, pass_enc)
	tmp = utf8_decode(tmp)
	assert(!u8cmp(tmp, ptext))

	/* encrypt again, this time with salt, prefix unspecified */
	console.log('"Hello, world!" with random salt, prefix')
	console.log('encrypt()')
	ctext_enc = encrypt(ptext_enc, pass_enc)
	assert(ctext_enc != known)
	console.log('decrypt()')
	tmp = decrypt(ctext_enc, pass_enc)
	tmp = utf8_decode(tmp)
	assert(!u8cmp(tmp, ptext))
	
	/* now some foreign language action */
	console.log('foreign language action')
	ptext = ''
	ptext += 'На берегу пустынных волн\n'
	ptext += 'Стоял он, дум великих полн,\n'
	ptext += 'И вдаль глядел. Пред ним широко\n'
	ptext += 'Река неслася; бедный чёлн\n'
	ptext += 'По ней стремился одиноко.\n'
	ptext += 'По мшистым, топким берегам\n'
	ptext += 'Чернели избы здесь и там,\n'
	ptext += 'Приют убогого чухонца;\n'
	ptext += 'И лес, неведомый лучам\n'
	ptext += 'В тумане спрятанного солнца,\n'
	ptext += 'Кругом шумел.\n'
	ptext_enc = utf8_encode(ptext)
	pass_enc = crypt_gen_random(8)

	ctext_enc = encrypt(ptext_enc, pass_enc)
	tmp = decrypt(ctext_enc, pass_enc)
	tmp = utf8_decode(tmp)
	assert(!u8cmp(tmp, ptext))
	
	/* done */	
	console.log('success!')
}
