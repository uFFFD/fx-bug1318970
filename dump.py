#! /usr/bin/env python
# -*- coding: utf-8 -*-


import argparse
import binascii
import json
import os.path
import sqlite3


def dump(db, out=None, out_json=False, raw=False):
    try:
        with sqlite3.connect(db) as conn:
            version = conn.execute('PRAGMA user_version').fetchone()[0]
            if version == 3:
                stmt = '''select groups.name as domain, settings.name as name, value
                          from prefs
                          join settings on settings.id = prefs.settingID
                          join groups on groups.id = prefs.groupID
                          order by settings.id, groups.name'''
            elif version == 4:
                stmt = '''select groups.name as domain, settings.name as name, value, timestamp
                          from prefs
                          join settings on settings.id = prefs.settingID
                          join groups on groups.id = prefs.groupID
                          order by settings.id, groups.name'''
            else:
                print('not supported user_version: {}'.format(version))
                return 1

            def dict_factory(cursor, row):
                d = {}
                for idx, col in enumerate(cursor.description):
                    if not raw:
                        d[col[0]] = row[idx]
                    else:
                        v = row[idx]
                        if idx == 0 or idx == 1:  # domain or name
                            v = v.decode('utf-8')
                        elif idx == 2:  # prefs.value
                            v = binascii.hexlify(v).decode('utf-8').upper()
                        d[col[0]] = v
                return d

            if raw:
                conn.text_factory = bytes
            conn.row_factory = dict_factory
            results = conn.execute(stmt).fetchall()
        if out_json:
            data = json.dumps(results,
                              ensure_ascii=False,
                              indent=2,
                              separators=(',', ': '),
                              sort_keys=True)
            if out is None:
                print(data)
            else:
                with open(out, mode='wb') as f:
                    f.write(data.encode('utf-8'))
        else:
            if version == 3:
                data = [u'{}\t{}\t{}'.format(row['domain'],
                                             row['name'],
                                             row['value'])
                        for row in results]
            elif version == 4:
                data = [u'{}\t{}\t{}\t{}'.format(row['domain'],
                                                 row['name'],
                                                 row['value'],
                                                 row['timestamp'])
                        for row in results]
            if out is None:
                if version == 3:
                    print(u'domain\tname\tvalue')
                elif version == 4:
                    print(u'domain\tname\tvalue\ttimestamp')
                for line in data:
                    print(line)
            else:
                with open(out, mode='wb') as f:
                    if version == 3:
                        f.write(b'domain\tname\tvalue\n')
                    elif version == 4:
                        f.write(b'domain\tname\tvalue\ttimestamp\n')
                    for line in data:
                        f.write(line.encode('utf-8'))
                        f.write(b'\n')
        print('\ntotal entries: {}'.format(len(results)))
    except Exception as e:
        print(e)
        return 1
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=('dump all content '
                                                  'preferences stored in '
                                                  'content-prefs.sqlite'))
    parser.add_argument('content_prefs',
                        nargs=1,
                        metavar='content-prefs',
                        help='path to content-prefs.sqlite')
    parser.add_argument('-o', '--output',
                        metavar='FILE',
                        help='dump to FILE instead of STDOUT')
    parser.add_argument('-j', '--json',
                        action='store_true',
                        help='output in json format')
    parser.add_argument('-r', '--raw',
                        action='store_true',
                        help='display prefs.value in HEX')

    args = parser.parse_args()

    db = args.content_prefs[0]

    if not os.path.exists(db):
        print('{} does not exist'.format(db))
        exit(1)
    if not os.path.isfile(db):
        print('{} is not a file'.format(db))
        exit(1)
    exit(dump(db, out=args.output, out_json=args.json, raw=args.raw))
