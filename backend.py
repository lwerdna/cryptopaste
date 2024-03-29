#!/usr/bin/env python3
#
# cryptopaste backend (for storing data, etc.)

import os
import re
import sys
import cgi
import time
import namegen
import maintenance

import log24

# if running on localhost, enable debugging
if ('HTTP_HOST' in os.environ) and (os.environ['HTTP_HOST'] == 'localhost'):
    import cgitb
    cgitb.enable()

#------------------------------------------------------------------------------
# MAIN
#------------------------------------------------------------------------------

print("Content-Type: text/html\x0d\x0a\x0d\x0a", end='')

maintenance.maintain()

form = cgi.FieldStorage()

op = ''
if 'op' in form:
    op = form['op'].value

if op == '':
    print('<p>This is the CryptoPaste backend, meant to be called from the frontend (index.html) javascript code.</p>')
    print('<p>Try backend.py?op=test or backend.py?op=read&fname=RedBlueBird.gpg to see it in action.</p>')
    sys.exit(-1)

if op == 'upload':
    # uploads limited to 24 in a day (average 1/hour)
    if log24.log24gethits(os.environ['REMOTE_ADDR']) > 24:
        print('THROTTLED', end='')
        sys.exit(0)

    paste = form['fdata'].value

    if len(paste) > 2097152:
        print('TOOBIG', end='')
        sys.exit(0)

    fpath = ''
    fname = ''

    # gen file name
    while 1:
        fname = namegen.gen_name() + '.gpg'
        fpath = './pastes/' + fname

        if os.path.exists(fpath):
            continue

        break

    # open and write the file
    fo = open(fpath, 'w')
    fo.write(paste)
    fo.close()

    # log
    log24.log24append(os.environ['REMOTE_ADDR'], time.time())

    # report back to javascript
    print(fname, end='')

elif op == 'read':
    fname = form['fname'].value
    if not re.match(r'^[A-Za-z]+\.gpg$', fname):
        print('MALFORMED', end='')
        sys.exit(-1)

    fpath = os.path.join('.', 'pastes', fname)
    if not os.path.isfile(fpath):
        print('NONEXISTENT', end='')
        sys.exit(-1)

    with open(fpath) as fp:
        print(fp.read())

elif op == 'test':
    print("OK", end='')

#elif op == 'env':
#	print('form: ', form)
#	print('<hr>')
#	print('env: ')
#	print(os.environ)

else:
    print("ERROR: unrecognized op: \"%s\"" % op, end='')

