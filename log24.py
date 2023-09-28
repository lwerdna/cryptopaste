#!/usr/bin/env python3

# keeps a simple list of (ip, time) tuples in text file so that frequency of
# use policies can be implemented (ie: can't use 1000's of times in a day)

import os
import time

LOG24_FNAME = 'log24.txt'

# from:
#   129.129.129.129 1507547602
#   129.129.129.129 1507547302
#   ...
# to:
# [
#   ['129.129.129.129', 1507547602],
#   ['129.129.129.129', 1507547602],
#   ...
# ]
def log24get():
    entries = []
    with open(LOG24_FNAME, 'r') as fp:
        entries = fp.readlines()

    # special case: empty file
    if len(entries) == 1 and entries[0] == '':
        return []

    entries = filter(lambda x: x.strip(), entries)
    entries = map(lambda x: x.split(), entries)
    entries = map(lambda x: [x[0], int(x[1])], entries)
    return entries

# from:
# [
#   ['129.129.129.129', 1507547602],
#   ['129.129.129.129', 1507547602],
#   ...
# ]
# to:
#   129.129.129.129 1507547602
#   129.129.129.129 1507547302
#   ...
def log24set(entries):
    entries = map(lambda x: '%s %d' % (x[0], x[1]), entries)
    with open(LOG24_FNAME, 'w') as fp:
        fp.write('\n'.join(entries) + '\n')
    fp.close()

# clear anything in log24 that's over 24 hours old
def log24purge():
    cutoff = time.time() - 24*60*60
    entries = log24get()
    entries = filter(lambda x: x[1] > cutoff, entries)
    log24set(entries)

# append new entry
def log24append(ip, t):
    mode = 'a'

    # if no records, start anew
    if os.path.getsize(LOG24_FNAME) < 4:
        mode = 'w'

    with open(LOG24_FNAME, mode) as fp:
        fp.write('%s %d\n' % (ip, t))

# return how many times ip visited in last 24 hours
def log24gethits(ip):
    entries = log24get()
    count = 0
    for e in entries:
        if e[0] == ip:
            count += 1
    return count

def log24print():
    entries = log24get()

    now = time.time()
    for e in entries:
        [ip, t] = e

        ago_str = ''
        delta = float(now - t)
        if delta < 60:
            ago_str = '%f seconds ago' % delta
        elif delta < 3600:
            ago_str = '%f minutes ago' % (delta/60)
        elif delta < 24*3600:
            ago_str = '%f hours ago' % (delta/3600)
        else:
            ago_str = '%f days ago' % (delta/(24*3600))

        print('%s %d (%s)' % (ip, t, ago_str))

# for testing
if __name__ == '__main__':
    oneday = 24*60*60
    twodays = 2*oneday

    now = time.time()

    # create some fake logs
    entries = []

    # 129.129.129.129 visits every 5 minutes
    for i in range(twodays // 300):
        log24append('129.129.129.129', now - i*300)

    # 130.130.130.130 visits every 20 minutes
    for i in range(twodays // 1200):
        log24append('130.130.130.130', now - i*1200)

    # 131.131.131.131 visits every hour
    for i in range(twodays // 3600):
        log24append('131.131.131.131', now - i*3600)

    # 132.132.132.132 visits every two hours
    for i in range(twodays // 7200):
        log24append('132.132.132.132', now - i*7200)

    # print 'em
    log24print()

    # try some queries
    print('66.66.66.66 visited %d times' % log24gethits('66.66.66.66'))
    print('129.129.129.129 visited %d times' % log24gethits('129.129.129.129'))
    print('130.130.130.130 visited %d times' % log24gethits('130.130.130.130'))
    print('131.131.131.131 visited %d times' % log24gethits('131.131.131.131'))
    print('132.132.132.132 visited %d times' % log24gethits('132.132.132.132'))

    # purge  then print
    print('--------PURGING--------')
    log24purge()
    log24print()
    print('66.66.66.66 visited %d times' % log24gethits('66.66.66.66'))
    print('129.129.129.129 visited %d times' % log24gethits('129.129.129.129'))
    print('130.130.130.130 visited %d times' % log24gethits('130.130.130.130'))
    print('131.131.131.131 visited %d times' % log24gethits('131.131.131.131'))
    print('132.132.132.132 visited %d times' % log24gethits('132.132.132.132'))
