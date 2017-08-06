#!/usr/bin/python
#
# cryptopaste backend (for storing data, etc.)
# 
# Copyright 2013-2017 Andrew Lamoureux
# 
# This file is a part of cryptopaste
# 
# cryptopaste is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

import os
import cgi
import random

# if running on localhost, enable debugging
if ('HTTP_HOST' in os.environ) and (os.environ['HTTP_HOST'] == 'localhost'):
    import cgitb
    cgitb.enable()

def genFileName(ext='', nChars=8):
    random.seed()
    lookup = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    fname = ''
    for i in range(nChars):
        fname += lookup[random.randint(0,len(lookup)-1)]
    fname += ext
    return fname

#------------------------------------------------------------------------------
# MAIN
#------------------------------------------------------------------------------

print "Content-Type: text/html\x0d\x0a\x0d\x0a",

form = cgi.FieldStorage()

op = ''
if 'op' in form:
    op = form['op'].value

if op == 'upload':
    paste = form['paste'].value
    fpath = ''
    fname = ''

    # gen file name
    while 1:
        fname = genFileName('.gpg', 4)
        fpath = './pastes/' + fname

        if os.path.exists(fpath):
            continue

        break

    # open and write the file
    fo = open(fpath, 'w')
    fo.write(paste)
    fo.close()

    # report back to javascript
    print 'OK:%s' % fname

elif op == 'test':
    print "OK"

else:
    print "ERROR: unrecognized op: \"%s\"" % op

