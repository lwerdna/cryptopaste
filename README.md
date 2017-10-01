# cryptopaste
code for cryptopaste.com website

# notes
* `$ thttpd -p 8000 -c *.py -D`
* `$gpg -z 0 --output doc.gpg --symmetric doc`
* `$gpg --decrypt doc.gpg`
* `$gpg --output doc --decrypt doc.gpg`
* for httpd, `ln -s decrypt.html ./errors/err404.html` so http://url/RedBlueBird will serve decrypt.html
