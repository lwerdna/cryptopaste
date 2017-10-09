#!/usr/bin/env python
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

print "Content-Type: text/html\x0d\x0a\x0d\x0a",

maintenance.maintain()

form = cgi.FieldStorage()

op = ''
if 'op' in form:
    op = form['op'].value

if op == 'upload':
    # uploads limited to 24 in a day (average 1/hour)
    if log24.log24gethits(os.environ['REMOTE_ADDR']) > 24:
        print 'THROTTLED'
        sys.exit(0)
 
    paste = form['fdata'].value
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
    print fname,

elif op == 'test':
    print "OK",

elif op == 'env':
	print 'form: ', form
	print '<hr>'
	print 'env: '
	print os.environ

else:
    print "ERROR: unrecognized op: \"%s\"" % op,

