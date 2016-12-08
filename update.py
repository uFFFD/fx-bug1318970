#! /usr/bin/env python
# -*- coding: utf-8 -*-


import argparse
import os.path
import sqlite3
import sys


def update_browser_upload_lastdir(db, last_dir):
    try:
        with sqlite3.connect(db) as conn:
            pass
            stmt = '''update prefs set value=(?)
                      where id=(select id from settings
                                where name='browser.upload.lastDir')'''
            cur = conn.execute(stmt, (last_dir, ))
            print('{} rows updated'.format(cur.rowcount))
    except Exception as e:
        print(e)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=('update all '
                                                  'browser.upload.lastDir in '
                                                  'content-prefs.sqlite'))
    parser.add_argument('content_prefs',
                        nargs=1,
                        metavar='content-prefs',
                        help='path to content-prefs.sqlite')
    parser.add_argument('last_dir',
                        nargs=1,
                        metavar='lastDir',
                        help='browser.upload.lastDir value to set')

    args = parser.parse_args()

    db = args.content_prefs[0]

    if not os.path.exists(db):
        print('{} does not exist'.format(db))
        exit(1)
    if not os.path.isfile(db):
        print('{} is not a file'.format(db))
        exit(1)
    last_dir = args.last_dir[0]
    if sys.hexversion < 0x03000000:
        last_dir = last_dir.decode(sys.stdin.encoding)
    update_browser_upload_lastdir(db, last_dir)
