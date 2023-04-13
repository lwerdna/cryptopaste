#!/usr/bin/env python

import os
import time
import glob
import log24

DAYS_EXPIRE = 7

def del_old_pastes():
    now = time.time()
    cutoff = now - (DAYS_EXPIRE*24*60*60)

    print('now=%d cutoff=%d' % (now, cutoff))

    for fname in glob.glob('./pastes/*.gpg'):
        if fname.endswith('RedBlueBird.gpg'):
            continue

        ftime = os.stat(fname).st_mtime
        if ftime < cutoff:
            print('deleting %s' % fname)
            os.remove(fname)
        else:
            print('saving %s' % fname)

def maintain():
    log24.log24purge()
    del_old_pastes()

# here so a cron job could call this
if __name__ == '__main__':
    maintain()
