---
title: 'mavi-chivas: the Minecraft mod that robs your browser'
description: A fake mod from a Discord server, a Dropbox link and an Electron stealer that kills your browser to read its secrets.
date: 2026-11-15
tags: [malware, infostealer, electron, credential-access, sandbox]
attack: [T1204.002, T1497.001, T1012, T1082, T1016, T1059.003, T1059.001, T1027.010, T1564.003, T1555.003, T1539, T1567.004]
status: finished
featured: true
repo: https://github.com/guisosi/mavi-chivas
---

> Sandbox only. No sample is hosted here and every network indicator is defanged.

One of my first real looks at malware. Someone shared a "mod" for Minecraft on a Discord server. Instead of running it, I sent it to a sandbox. It was an infostealer, and a well built one.

The run is public on ANY.RUN, and you can find it by the SHA256 at the end. Everything below comes from it.

## The lure

No exploit. The whole delivery is social: a game, a community that trusts each other, and a file that promises something cool.

The file sat on Dropbox. That is a choice. A trusted domain is almost never blocked by a proxy, and the download looks like any other shared file.

<figure class="fig">
<img src="/img/posts/mavi-chivas/01-download.png" width="1249" height="603" loading="lazy" alt="Edge downloads panel warning that mavi chivas.exe could harm the device, with Keep and Delete buttons. The Dropbox link is removed from the address bar.">
<figcaption class="fig__cap">The browser flags it. One click on Keep and it is gone.</figcaption>
</figure>

<figure class="fig">
<img src="/img/posts/mavi-chivas/02-unknown-publisher.png" width="668" height="460" loading="lazy" alt="Windows security warning: the publisher could not be verified, unknown publisher, file has no valid digital signature, with Run and Cancel buttons.">
<figcaption class="fig__cap">Unsigned, unknown publisher. The second and last chance to say no.</figcaption>
</figure>

Two warnings, two clicks. For a kid who wants the mod, that is no friction at all.

## It is a web app

The first thing it did was open several stacked windows of itself.

<figure class="fig">
<img src="/img/posts/mavi-chivas/03-electron-windows.png" width="1064" height="576" loading="lazy" alt="Three stacked blank windows, all titled with the path of mavi chivas.exe, on the sandbox desktop.">
<figcaption class="fig__cap">Stacked windows of the same binary: the look of an Electron app.</figcaption>
</figure>

Classic C malware does not do that. Electron does. The files it touched confirmed it: `ref-napi` and `ffi-napi`, the Node.js libraries that let JavaScript call native Windows APIs. That is the usual way a stealer written in JavaScript reaches DPAPI to decrypt what the browser protects.

Some of those libraries came with Linux builds inside a Windows sample. A multi-platform package, where only the part for the target ever runs. In the sandbox it ran as six processes of the same binary.

## Look around before acting

Before stealing anything, it checks where it landed:

```text
cmd.exe /d /s /c "reg query "HKLM\HARDWARE\DESCRIPTION\System""
```

That key holds the BIOS strings. In a VM they often say VirtualBox, VMware or QEMU, so it is a cheap sandbox check. (T1497.001, T1012)

It also reads the machine GUID, the computer name and the CPU, and asks `myexternalip[.]com` for its public IP. (T1082, T1016)

## Hide the window

PowerShell starts six times, always with every quiet flag there is:

```text
powershell -NoLogo -NonInteractive -NoProfile -ExecutionPolicy Bypass -Encoded WwBTAHkA...
```

The one I decoded is a wrapper around a second Base64 blob. Two layers, for this:

```powershell
Add-Type -Name Window -Namespace Console -MemberDefinition '
    [DllImport("Kernel32.dll")]
    public static extern IntPtr GetConsoleWindow();

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, Int32 nCmdShow);
'
$consolePtr = [Console.Window]::GetConsoleWindow()
#0 hide
[Console.Window]::ShowWindow($consolePtr, 0)
```

`Add-Type` compiles that C# on the fly, which is why `csc.exe` shows up in the process tree, six times as well. The code itself is tiny: find the console window and hide it, so the victim never sees a black box pop up. (T1059.001, T1027.010, T1564.003)

Seen from the outside, PowerShell compiling C# looks scary. Decoded, it is just stage hygiene.

## The steal

Here is the trick that tells you someone did their homework.

A Chromium browser keeps saved passwords and cookies in SQLite databases. While the browser is open, those files are locked. So the stealer just kills it with `taskkill.exe`. The sandbox saw it go after the browsers again and again.

With the browsers gone, the files are free to read. These are the ones it touched in the Edge profile:

| File | What is inside |
|---|---|
| `Web Data` | saved passwords, autofill, cards |
| `Network\Cookies` | session cookies |
| `History` | browsing history |
| `Last Browser` | which browser was in use |

It also loaded DLLs from the Firefox install, consistent with using Firefox's own crypto library to read its saved logins. The sandbox flagged possible theft of crypto wallets and messenger data too.

The cookies are the real prize. A valid session cookie skips the password and the MFA, and changing the password alone does not always end that session. (T1555.003, T1539)

## Where did it go?

The same processes that read the browser data opened TLS connections to `discord[.]com`. The content is encrypted, so I cannot show what was sent, but a stealer talking to Discord right after the theft is the classic webhook exfiltration. (T1567.004, likely)

Discord brings the victim in and takes the data out.

## The chain

Follow the card: who talks to whom, and what travels. A link goes in, an executable comes down, the loot goes out.

<figure class="fig">
<picture>
<source media="(max-width: 560px)" srcset="/img/posts/mavi-chivas/killchain-tall.svg" width="400" height="532">
<img src="/img/posts/mavi-chivas/killchain-wide.svg" width="760" height="500" loading="lazy" alt="Sequence of the attack between Discord, Dropbox, the victim, the browser and Discord: a link to a mod reaches the victim, the victim gets mavi-chivas.exe from Dropbox, checks for a VM, hides the PowerShell window, kills the browser, reads Web Data and Cookies, and sends the loot to Discord over TLS, likely by webhook.">
</picture>
</figure>

The same path in the process tree:

```text
msedge.exe          downloads mavi chivas.exe from Dropbox
mavi chivas.exe     Electron app, six processes
├─ cmd.exe          reg query HKLM\HARDWARE\DESCRIPTION\System
├─ cmd.exe          powershell -ExecutionPolicy Bypass -Encoded ...
│  └─ powershell    Add-Type -> csc.exe, hides the console
├─ cmd.exe          taskkill on the browsers
├─ reads            Web Data, Network\Cookies, History
└─ TLS              myexternalip[.]com, discord[.]com
```

## ATT&CK

| Technique | ID | Evidence | Confidence |
|---|---|---|---|
| User Execution: Malicious File | T1204.002 | victim runs the fake mod | confirmed |
| Virtualization/Sandbox Evasion: System Checks | T1497.001 | BIOS strings via `reg query` | confirmed |
| Query Registry | T1012 | `HKLM\HARDWARE\DESCRIPTION\System` | confirmed |
| System Information Discovery | T1082 | machine GUID, computer name, CPU | confirmed |
| System Network Configuration Discovery | T1016 | `myexternalip[.]com` | confirmed |
| Windows Command Shell | T1059.003 | `cmd.exe /d /s /c` | confirmed |
| PowerShell | T1059.001 | encoded PowerShell | confirmed |
| Command Obfuscation | T1027.010 | two layers of Base64 | confirmed |
| Hide Artifacts: Hidden Window | T1564.003 | `ShowWindow(console, 0)` | confirmed |
| Credentials from Web Browsers | T1555.003 | read `Web Data` | confirmed |
| Steal Web Session Cookie | T1539 | read `Network\Cookies` | confirmed |
| Exfiltration Over Webhook | T1567.004 | TLS to `discord[.]com` after the theft | likely |

Mappings I dropped after reading the run again:

- **T1027.004, Compile After Delivery.** `csc.exe` does compile, but only the helper that hides the window. The stealer itself ships ready.
- **T1105, Ingress Tool Transfer.** There is no second stage in this run. The browser downloads the file, the victim runs it. That is user execution.
- **T1567.002, Exfiltration to Cloud Storage.** The sandbox suggested it for Dropbox. Right channel, wrong direction: Dropbox only delivered.
- **T1489, Service Stop.** Killing the browsers is not an attack on availability. It is the step that makes the theft possible.

## Indicators

| Type | Value |
|---|---|
| File | `mavi-chivas.exe` |
| MD5 | `71930BF332B6A596468FAC494AD8EA98` |
| SHA1 | `D18539875B0ECDA428B89807AFA263792D6BEEE1` |
| SHA256 | `29269FA6CF19C9114B15D13044B64903C33BC382007EC85FAD8A5277711946F4` |
| Delivery | `hxxps://www.dropbox[.]com/scl/fi/zprhs69ehmegj90tnjdfn/mavi-chivas.exe` |
| Contacted | `myexternalip[.]com`, `discord[.]com` |

## What I took from it

- **A string is not a behavior.** I first called it a downloader because of a `downloadFile` string. The files it touched are what made it a confirmed stealer.
- **Decode before you conclude.** "PowerShell compiles C#" sounded like an in-memory payload. Decoded, it was a window hider. My first write-up got that wrong.
- **The sandbox mapping is a draft.** It got Dropbox's channel right and the direction wrong.
- **Trusted platforms do the heavy lifting.** Discord for the lure and the exit, Dropbox for the file. Nobody blocks either.
- **Kill the lock, then read.** Small, boring and effective. That is what good tradecraft looks like.

The full report, revised with the corrections above, is in the [mavi-chivas repository](https://github.com/guisosi/mavi-chivas).
