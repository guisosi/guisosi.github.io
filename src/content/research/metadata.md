---
title: 'Metadata: their recon, your OPSEC'
description: What files leak, how to read it from a target and how to strip it from your own.
date: 2026-11-15
tags: [opsec, recon, metadata, exiftool]
attack: [T1589.003, T1592.002]
status: finished
---

> Own files, public documents within scope, or written authorization.

Every file carries more than its content. Author, username, software and version, internal paths, GPS, the printer it went through. For the attacker that is free recon. For the operator it is a leak waiting to happen.

## What leaks

| File | Usual suspects |
|---|---|
| JPEG / PNG / HEIC | camera, GPS, date, software, thumbnail |
| PDF | Author, Creator, Producer, old revisions |
| DOCX / XLSX / PPTX | author, last modified by, company, template path, comments, tracked changes |
| AI generated images | generator tags, C2PA manifest |
| git commits | name, email, timezone |
| the file name | date, time, device, system language |

## Their recon

Public documents from a target are a goldmine. Pull them within scope and read them in bulk.

```bash
exiftool -r -csv -Author -Creator -LastModifiedBy -Producer -Software docs/ > meta.csv
```

<figure class="fig">
<ol class="flow">
<li><span class="flow__n">01</span><b>public docs</b>pdf, docx and xlsx from the target's own site</li>
<li><span class="flow__n">02</span><b>exiftool -csv</b>Author, Creator, LastModifiedBy, Producer</li>
<li><span class="flow__n">03</span><b>raw leaks</b><code>j.silva</code><code>Word 2013</code><code>C:\Users\j.silva\</code></li>
<li><span class="flow__n">04</span><b>what you get</b>username format, old software, hosts and shares</li>
</ol>
<figcaption class="fig__cap">From a folder of public files to a target list. The values are made up.</figcaption>
</figure>

What comes out:

- **Usernames** like `j.silva` or `jsilva`. That is the username format for spraying.
- **Software and versions**, like an old Office or a PDF library with known bugs.
- **Internal paths** like `\\fs01\templates\` or `C:\Users\j.silva\`, with hostnames and shares.

## Read before you strip

```bash
# everything, with the group each tag lives in
exiftool -a -G1 -s file.jpg
```

## Strip it

A JPEG is a row of segments. Metadata lives in some of them, the image in others. Pick a tool and see what is left.

<figure class="fig anatomy">
<input class="sr-only" type="radio" name="jpg" id="jpg-orig" checked>
<input class="sr-only" type="radio" name="jpg" id="jpg-exif">
<input class="sr-only" type="radio" name="jpg" id="jpg-magick">
<div class="anatomy__tabs"><label for="jpg-orig">original</label><label for="jpg-exif">exiftool -all=</label><label for="jpg-magick">magick -strip</label></div>
<ol class="anatomy__segs">
<li class="seg seg--meta"><b>APP1 · Exif</b><span class="seg__desc">camera, date, software, GPS, thumbnail</span><span class="seg__tag"></span></li>
<li class="seg seg--meta"><b>APP1 · XMP</b><span class="seg__desc">author, edit history, generator tags</span><span class="seg__tag"></span></li>
<li class="seg seg--meta"><b>APP2 · ICC</b><span class="seg__desc">color profile, can name the device or the editor</span><span class="seg__tag"></span></li>
<li class="seg seg--meta"><b>APP11 · C2PA</b><span class="seg__desc">provenance manifest, who made it and how</span><span class="seg__tag"></span></li>
<li class="seg seg--sig"><b>DQT</b><span class="seg__desc">quantization tables, a signature of the camera or software</span><span class="seg__tag"></span></li>
<li class="seg"><b>SOF · DHT</b><span class="seg__desc">size and coding of the image</span><span class="seg__tag"></span></li>
<li class="seg seg--pix"><b>SOS · pixels</b><span class="seg__desc">the image itself, sensor noise included</span><span class="seg__tag"></span></li>
</ol>
<p class="anatomy__note note-orig">Everything in red is metadata. The orange ones are not, and still talk.</p>
<p class="anatomy__note note-exif">Metadata gone. The pixels are untouched, so the original quantization tables stay. Whoever compares them still sees the source.</p>
<p class="anatomy__note note-magick">Metadata gone and the image re-encoded, so the tables now belong to the tool. The sensor noise is still in the pixels.</p>
</figure>

### exiftool

```bash
# all metadata, keeps a file.jpg_original backup
exiftool -all= file.jpg

# no backup
exiftool -all= -overwrite_original file.jpg

# a whole folder
exiftool -all= -overwrite_original -r dir/

# keep the rotation, or the photo ends up sideways
exiftool -all= -tagsfromfile @ -Orientation file.jpg
```

<figure class="fig">
<img src="/img/posts/metadata/demo-image.svg" width="800" height="404" loading="lazy" alt="exiftool shows Artist j.silva, Model EOS 80D, Software Adobe Photoshop 2024, the original date and GPS position. After exiftool -all= the same query returns nothing and ls shows photo.jpg_original next to photo.jpg.">
<figcaption class="fig__cap">Real run, ExifTool 12.57 on Debian 12, fake data.</figcaption>
</figure>

Without `-overwrite_original`, the dirty copy stays next to the clean one as `file.jpg_original`. Delete it. And deleting is not erasing: on an unencrypted disk the old bytes stay until something writes over them.

### PDF needs one more step

ExifTool edits on PDF are incremental. The old metadata is still inside and can be recovered. ExifTool even warns you, and one flag undoes the cleaning:

<figure class="fig">
<img src="/img/posts/metadata/demo-pdf.svg" width="800" height="378" loading="lazy" alt="exiftool -all:all= removes Author j.silva and Creator Microsoft Word 2013 from doc.pdf with a warning that PDF edits are reversible. exiftool -PDF-update:all= then brings both tags back.">
</figure>

Rewrite the file after:

```bash
exiftool -all:all= file.pdf
qpdf --linearize file.pdf clean.pdf
```

<figure class="fig">
<img src="/img/posts/metadata/demo-qpdf.svg" width="800" height="309" loading="lazy" alt="After qpdf --linearize, exiftool -PDF-update:all= fails with no previous ExifTool update and the tags stay gone.">
<figcaption class="fig__cap">Same file, qpdf 11.3.0. Nothing left to roll back.</figcaption>
</figure>

### mat2, for office files and the rest

ExifTool reads Office files but does not clean them. mat2 does: images, PDF, office, audio.

```bash
mat2 --show file.docx     # what is there
mat2 file.docx            # writes file.cleaned.docx
mat2 --inplace file.docx  # overwrites
```

On PDF, mat2 renders the pages as images by default. Text becomes unselectable. `-L` keeps the text, but cleans less.

### Re-encode

When in doubt, rebuild the image. Every tag goes away, and so do the JPEG quantization tables. Those tables depend on the camera or the software that saved the file, so they work as a signature. Saving again swaps them for the tool's own.

```bash
magick in.jpg -strip out.jpg     # ImageMagick 7
convert in.jpg -strip out.jpg    # ImageMagick 6, still the default on Debian
```

ExifTool can read the tables and name the encoder. Stripping leaves them alone, re-encoding does not:

<figure class="fig">
<img src="/img/posts/metadata/demo-dqt.svg" width="800" height="321" loading="lazy" alt="JPEGDigest reports Independent JPEG Group library, quality 92 before and after exiftool -all=. After re-encoding with -quality 75 it reports quality 75.">
</figure>

## Your own commits

```bash
git config user.email "ID+user@users.noreply.github.com"
```

The timezone still goes with every commit. So does the time: commit at 2 a.m. for a year and your history draws your routine.

## Check again

```bash
exiftool -a -G1 -s clean.jpg
strings clean.pdf | grep -iE 'author|creator|producer|users'
```

## What no tool removes

- **The file name.** `IMG_20261114_231502.jpg` carries the date and time it was taken. A screenshot saved as `Captura de tela 2026-11-14...` gives away the system language too. Rename before you publish.
- **What is on the screen.** Screenshots show the taskbar, usernames, tabs and hostnames. Crop them.
- **Tracked changes and comments** in office files. Accept, delete, then clean.
- **The sensor itself.** Every camera sensor leaves its own noise pattern (PRNU) in the pixels. Forensics can tie a photo to the device that took it. Re-encoding does not remove it.
- **Watermarks in the pixels.** Some generators mark the image itself. That is not metadata, so nothing above touches it.
