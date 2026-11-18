---
title: 'Metadados: o recon deles, a sua OPSEC'
description: O que os arquivos vazam, como ler isso de um alvo e como apagar dos seus.
date: 2026-11-15
tags: [opsec, recon, metadata, exiftool]
attack: [T1589.003, T1592.002]
status: finished
---

> Arquivos seus, documentos públicos dentro do escopo ou autorização por escrito.

Todo arquivo carrega mais do que o conteúdo. Autor, usuário, software e versão, caminhos internos, GPS, a impressora por onde passou. Para o atacante, isso é recon de graça. Para o operador, é um vazamento esperando acontecer.

## O que vaza

| Arquivo | Suspeitos de sempre |
|---|---|
| JPEG / PNG / HEIC | câmera, GPS, data, software, thumbnail |
| PDF | Author, Creator, Producer, revisões antigas |
| DOCX / XLSX / PPTX | autor, última modificação por, empresa, caminho do template, comentários, track changes |
| imagens geradas por IA | tags do gerador, manifesto C2PA |
| commits do git | nome, e-mail, fuso horário |
| o nome do arquivo | data, hora, aparelho, idioma do sistema |

## O recon deles

Documentos públicos de um alvo são uma mina de ouro. Baixe dentro do escopo e leia em lote.

```bash
exiftool -r -csv -Author -Creator -LastModifiedBy -Producer -Software docs/ > meta.csv
```

<figure class="fig">
<ol class="flow">
<li><span class="flow__n">01</span><b>docs públicos</b>pdf, docx e xlsx do próprio site do alvo</li>
<li><span class="flow__n">02</span><b>exiftool -csv</b>Author, Creator, LastModifiedBy, Producer</li>
<li><span class="flow__n">03</span><b>leaks crus</b><code>j.silva</code><code>Word 2013</code><code>C:\Users\j.silva\</code></li>
<li><span class="flow__n">04</span><b>o que você ganha</b>formato de usuário, software antigo, hosts e shares</li>
</ol>
<figcaption class="fig__cap">De uma pasta de arquivos públicos a uma lista de alvos. Os valores são inventados.</figcaption>
</figure>

O que sai:

- **Usuários** como `j.silva` ou `jsilva`. Esse é o formato de usuário para o spraying.
- **Software e versões**, como um Office antigo ou uma biblioteca de PDF com bugs conhecidos.
- **Caminhos internos** como `\\fs01\templates\` ou `C:\Users\j.silva\`, com hostnames e shares.

## Leia antes de fazer o strip

```bash
# tudo, com o grupo de cada tag
exiftool -a -G1 -s file.jpg
```

## Strip

Um JPEG é uma fila de segmentos. Os metadados ficam em alguns, a imagem em outros. Escolha uma ferramenta e veja o que sobra.

<figure class="fig anatomy">
<input class="sr-only" type="radio" name="jpg" id="jpg-orig" checked>
<input class="sr-only" type="radio" name="jpg" id="jpg-exif">
<input class="sr-only" type="radio" name="jpg" id="jpg-magick">
<div class="anatomy__tabs"><label for="jpg-orig">original</label><label for="jpg-exif">exiftool -all=</label><label for="jpg-magick">magick -strip</label></div>
<ol class="anatomy__segs">
<li class="seg seg--meta"><b>APP1 · Exif</b><span class="seg__desc">câmera, data, software, GPS, thumbnail</span><span class="seg__tag"></span></li>
<li class="seg seg--meta"><b>APP1 · XMP</b><span class="seg__desc">autor, histórico de edição, tags do gerador</span><span class="seg__tag"></span></li>
<li class="seg seg--meta"><b>APP2 · ICC</b><span class="seg__desc">perfil de cor, pode nomear o aparelho ou o editor</span><span class="seg__tag"></span></li>
<li class="seg seg--meta"><b>APP11 · C2PA</b><span class="seg__desc">manifesto de procedência, quem fez e como</span><span class="seg__tag"></span></li>
<li class="seg seg--sig"><b>DQT</b><span class="seg__desc">tabelas de quantização, uma assinatura da câmera ou do software</span><span class="seg__tag"></span></li>
<li class="seg"><b>SOF · DHT</b><span class="seg__desc">tamanho e codificação da imagem</span><span class="seg__tag"></span></li>
<li class="seg seg--pix"><b>SOS · pixels</b><span class="seg__desc">a imagem em si, ruído do sensor incluso</span><span class="seg__tag"></span></li>
</ol>
<p class="anatomy__note note-orig">Tudo em vermelho é metadado. Os laranjas não são, e mesmo assim falam.</p>
<p class="anatomy__note note-exif">Metadados apagados. Os pixels ficam intactos, então as tabelas de quantização originais continuam. Quem comparar ainda vê a origem.</p>
<p class="anatomy__note note-magick">Metadados apagados e a imagem re-encodada, então as tabelas agora são da ferramenta. O ruído do sensor continua nos pixels.</p>
</figure>

### exiftool

```bash
# todos os metadados, guarda um backup file.jpg_original
exiftool -all= file.jpg

# sem backup
exiftool -all= -overwrite_original file.jpg

# uma pasta inteira
exiftool -all= -overwrite_original -r dir/

# mantém a rotação, senão a foto fica de lado
exiftool -all= -tagsfromfile @ -Orientation file.jpg
```

<figure class="fig">
<img src="/img/posts/metadata/demo-image.svg" width="800" height="404" loading="lazy" alt="O exiftool mostra Artist j.silva, Model EOS 80D, Software Adobe Photoshop 2024, a data original e a posição GPS. Depois do exiftool -all= a mesma consulta não retorna nada e o ls mostra photo.jpg_original ao lado de photo.jpg.">
<figcaption class="fig__cap">Execução real, ExifTool 12.57 no Debian 12, dados falsos.</figcaption>
</figure>

Sem `-overwrite_original`, a cópia suja fica ao lado da limpa como `file.jpg_original`. Apague. E apagar não é destruir: num disco sem criptografia os bytes antigos ficam lá até algo escrever por cima.

### PDF precisa de mais um passo

As edições do ExifTool em PDF são incrementais. Os metadados antigos continuam dentro e podem ser recuperados. O próprio ExifTool avisa, e uma flag desfaz a limpeza:

<figure class="fig">
<img src="/img/posts/metadata/demo-pdf.svg" width="800" height="378" loading="lazy" alt="O exiftool -all:all= remove Author j.silva e Creator Microsoft Word 2013 do doc.pdf, com um aviso de que edições em PDF são reversíveis. Em seguida o exiftool -PDF-update:all= traz as duas tags de volta.">
</figure>

Reescreva o arquivo depois:

```bash
exiftool -all:all= file.pdf
qpdf --linearize file.pdf clean.pdf
```

<figure class="fig">
<img src="/img/posts/metadata/demo-qpdf.svg" width="800" height="309" loading="lazy" alt="Depois do qpdf --linearize, o exiftool -PDF-update:all= falha por não haver atualização anterior do ExifTool, e as tags continuam apagadas.">
<figcaption class="fig__cap">Mesmo arquivo, qpdf 11.3.0. Nada para desfazer.</figcaption>
</figure>

### mat2, para arquivos de office e o resto

O ExifTool lê arquivos do Office, mas não limpa. O mat2 limpa: imagens, PDF, office, áudio.

```bash
mat2 --show file.docx     # o que tem
mat2 file.docx            # gera file.cleaned.docx
mat2 --inplace file.docx  # sobrescreve
```

Em PDF, o mat2 por padrão transforma as páginas em imagens. O texto deixa de ser selecionável. O `-L` mantém o texto, mas limpa menos.

### Re-encode

Na dúvida, reconstrua a imagem. Todas as tags somem, e as tabelas de quantização do JPEG também. Essas tabelas dependem da câmera ou do software que salvou o arquivo, então funcionam como assinatura. Salvar de novo troca elas pelas da ferramenta.

```bash
magick in.jpg -strip out.jpg     # ImageMagick 7
convert in.jpg -strip out.jpg    # ImageMagick 6, ainda o padrão no Debian
```

O ExifTool consegue ler as tabelas e dizer o encoder. O strip não mexe nelas, o re-encode mexe:

<figure class="fig">
<img src="/img/posts/metadata/demo-dqt.svg" width="800" height="321" loading="lazy" alt="O JPEGDigest informa Independent JPEG Group library, qualidade 92, antes e depois do exiftool -all=. Depois do re-encode com -quality 75, informa qualidade 75.">
</figure>

## Os seus commits

```bash
git config user.email "ID+user@users.noreply.github.com"
```

O fuso horário vai junto em todo commit. A hora também: faça commit às 2 da manhã por um ano e o seu histórico desenha a sua rotina.

## Confira de novo

```bash
exiftool -a -G1 -s clean.jpg
strings clean.pdf | grep -iE 'author|creator|producer|users'
```

## O que nenhuma ferramenta remove

- **O nome do arquivo.** `IMG_20261114_231502.jpg` carrega a data e a hora da foto. Um print salvo como `Captura de tela 2026-11-14...` ainda entrega o idioma do sistema. Renomeie antes de publicar.
- **O que está na tela.** Prints mostram a barra de tarefas, usuários, abas e hostnames. Corte.
- **Track changes e comentários** em arquivos de office. Aceite, apague, depois limpe.
- **O próprio sensor.** Todo sensor de câmera deixa o seu padrão de ruído (PRNU) nos pixels. A forense consegue ligar uma foto ao aparelho que tirou. O re-encode não remove.
- **Watermarks nos pixels.** Alguns geradores marcam a própria imagem. Isso não é metadado, então nada acima mexe nisso.
