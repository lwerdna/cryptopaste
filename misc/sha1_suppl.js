/* RFC 2104 

    fips-198a has good examples with intermediate values
*/
function HMAC_SHA1(key, data)
{
    /* recall:
        160 bit (20 byte) output
        512 bit (64 byte) internal block length
    */

    /* clamp key to input block length of 64 bytes */
    if(key.length > 64) {
        key = SHA1(key)
    }

    /* inner padding is the key extended (if necessary) to input block length (64 bytes)
        and then xor'd with [0x36, 0x36, ...]

        outer padding is the same, except the xor value is [0x5c, 0x5c, ...]
    */
    i_key_pad = key.slice()
    o_key_pad = key.slice()

    while(i_key_pad.length < 64) {
        i_key_pad.push(0)
        o_key_pad.push(0)
    }

    for(var i=0; i<i_key_pad.length; ++i) {
        i_key_pad[i] ^= 0x36
        o_key_pad[i] ^= 0x5c
    }

    /* now the concatenation and hashing ... */
    var result
    result = i_key_pad.concat(data)
    result = SHA1(result)
    result = o_key_pad.concat(result)
    result = SHA1(result)

    /* done */
    return result
}

