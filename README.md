CryptoPaste is project that allows users to:

* share encrypted text by linking to a website (internet or intranet)
* generate self decrypting documents (attached to email, thumb drive, etc.)

A minimal amount of the OpenPGP standard ([RFC4880](./misc/rfc4880_OpenPGP_Message_Format.txt)) is implemented in javascript so that all enciphering and deciphering happens client side.

CryptoPaste make *NO* claims about practical security. It only attempts a faithful implementation of OpenPGP standards and algorithms in a convenient form. 

## What kind of encryption is used? How strong is it?

The default settings of `gpg` in symmetric mode:

* block cipher is cast5 with 128-bit key
* [KDF](https://en.wikipedia.org/wiki/Key_derivation_function) is OpenPGP's iterated and salted s2k with 65536 iterations

I can't comment on the parameters' strength. The reasoning was "If it's good enough for GnuPG, it's good enough CryptoPaste."

## What are the sources of the random data?

When encrypting, the client must generate a random salt and a random initializing value for PGP's block chaining scheme. Both of these values come from [RandomSource.getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/RandomSource/getRandomValues). Grep cryptopaste.js for `getRandomValues`.

On the backend, random values are needed to generate the "adjective adjective animal" name for hosted files. For this I use [os.urandom()](https://docs.python.org/2/library/os.html) from python, which is supposed to be suitable for cryptographic use, querying `/dev/urandom` on the server. Grep namegen.py for `urandom`.

## How can I verify the claims of the encryption?

Encipher some test data and copy paste the OpenPGP output to a .gpg file. Then you can run `gpg` with `--list-packets` or fully try to decrypt it with `--decrypt`. There is a lot of debugging output shown in the browser's developer console log that you can watch, too.

## Does my plaintext go on the network?

No, it happens in your browser. If you choose to create a link on cryptopaste, the ciphertext will be put on the network and stored on the server.

## How can I know the plaintext didn't travel on the network?

Some ideas:

* developer tools "network tab" in Firefox and Chrome
* network sniffers like `tcpdump` and `wireshark`
* reading the source code to see how it works

## Does CryptoPaste log users?

It does not log any ip address to file mapping.

However, it must remember who's visited in the previous 24-hours to prevent an abusive user from uploading inordinate amounts of data. See `maintain()` in maintenance.py.

Currently CryptoPaste is hosted on [Dreamhost](https://www.dreamhost.com/) on a lower tier shared server and I can only configure the logging options made available through their web interface. Site statistics are turned off. Day, Month, and Longterm reports are disabled. The minimum number of logging days is 3, which is the current setting.

## Can you recover my data or my password?

No, CryptoPaste never sees either the original data or the password. It only has the result of encryption, the ciphertext.

## Can I trust CryptoPaste to protect my data?

No! Google for "javascript encryption criticism" to see many issues raised by those smarter than me in both cryptography and web development.

If some advanced adversary were targetting you, and controlled the path between CryptoPaste and your browser, they could modify the javascript as your browser downloads it and (for example) weaken the parameters or outright send the plaintext somewhere. The use of https should reduce this risk.

## Will any other encryption parameters be available in the future?

Yes I plan to add some beefier options for the paranoid. I needed something to get going so went with the `GnuPG` defaults, and also wanted the service to be easy and simple to use.

## How does the self decrypting document work?

It works just like the full CryptoPaste service, except that the stylesheet, javascript files, and ciphertext are inlined into one html file which is stripped of all features except decryption.

## What dependencies are there for a client?

There are no libraries like SJCL, openpgpjs, or jquery.

You need a browser that supports non-ancient versions of javascript. I'd guess these are the more modern features that cryptopaste uses:

* [getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/RandomSource/getRandomValues) for generating the salt and block chaining IV
* [typed arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays) because Uint8Array is used everywhere
* [data URLs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs) and [blobs](https://developer.mozilla.org/en-US/docs/Web/API/Blob) to popup the self decrypting document download dialogue from javascript

## What dependencies are there for a host? How do I set up my own cryptopaste?

Clone the repo to your webserver.

Then configure the server so that backend.py is executable when a client makes a request. Browse to `http://domain.com/backend.py?op=test` and you should see 'OK'.

Configure index.html to be your 404 handler. This is so that requests to `http://domain.com/AdjAdjAnimal` will get dynamically processed (transferred to a request for pastes/AdjAdjAnimal.gpg).

Logs are cleared and expired pastes are deleted everytime backend.py is executed. But you can also set up a cron job to execute maintenance.py periodically.

If `log24.txt` doesn't exist, create it.

You may wish to disable the server's directory listing.

My .htaccess file in the root is:

```
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
ErrorDocument 404 /index.html
```

And the .htaccess file in thepastes directory:

```
Options -Indexes
```

Test decryption by browsing to `http://domain.com/AbaftAbandonedAardvark` and using passphrase `pw`.

# notes
* `$ thttpd -p 8000 -D -c "*.py"`
* `$ gpg -z 0 --output doc.gpg --symmetric doc`
* `$ gpg --decrypt doc.gpg`
* `$ gpg --output doc --decrypt doc.gpg`
* for httpd, `ln -s decrypt.html ./errors/err404.html` so http://url/RedBlueBird will serve decrypt.html
