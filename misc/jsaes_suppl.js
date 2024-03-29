/**
 * jsaes.js supplement
 * This file is a part of CryptoPaste 
 */

/* see RFC 5652 for details
    basically padd with XX where XX is a byte whose value is the
    quantity of bits to be added */
function AES_pad(plain)
{
    /* length of padding; block size is 16 bytes (128 bits) */
    var pad_amt = plain.length % 16
    /* always pad */
    if(!pad_amt) {
        pad_amt = 16;
    }

    var pad = Array(pad_amt)

    /* pad it!  (see RFC 5652 for details) */
    for(var i=0; i<pad_amt; ++i) {
        pad[i] = pad_amt
    }

    /* done */
    return plain.concat(pad)
}

function AES_unpad(plain)
{
    var pad_amt = plain[plain.length - 1]
    return plain.slice(0, plain.length - pad_amt)
}

function AES_CBC_Encrypt(plain, key, iv)
{
    AES_ExpandKey(key)

    var ciphert = []
    var n_blocks = plain.length / 16
    var xor_in = iv

    for(var i=0; i<n_blocks; ++i) {
        /* grab section of plaintext */
        var block = plain.slice(16*i, 16*i+16)

        /* xor in the iv, then block_{i-1}, block_{i-2}, ... */
        block = array_xor(block, xor_in)

        /* ECB it */
        AES_Encrypt(block, key)

        /* save ciphertext */
        ciphert = ciphert.concat(block)

        /* this block become's next block's block_{i-1} */
        xor_in = block.slice()
    }

    /* result */
    return ciphert
}

function AES_CBC_Decrypt(ctext, key, iv)
{
    AES_ExpandKey(key)

    var ptext = []

    if(ctext.length % 16) {
        throw("ERROR: ciphertext is a size not a block-sized multiple!")
    }

    var n_blocks = ctext.length / 16
    var xor_next = iv

    for(var i=0; i < n_blocks; ++i) {
        var xor_val = xor_next.slice()

        /* grab section of ciphertext */
        block = ctext.slice(16*i, 16*i+16)
        
        /* it is xor value in next block */
        xor_next = block.slice()

        /* decrypt it ECB */
        AES_Decrypt(block, key)

        /* un-xor */
        block = array_xor(block, xor_val)

        /* save result */
        ptext = ptext.concat(block)
    }

    /* result */
    return ptext
}
