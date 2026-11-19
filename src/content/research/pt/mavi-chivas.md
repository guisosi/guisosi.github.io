---
title: 'mavi-chivas: o _mod_ de Minecraft que rouba o seu navegador'
description: Um _mod_ falso de um servidor do Discord, um link do Dropbox e um _stealer_ em Electron que mata o navegador para ler os segredos dele.
date: 2026-11-15
tags: [malware, infostealer, electron, credential-access, sandbox]
attack: [T1204.002, T1497.001, T1012, T1082, T1016, T1059.003, T1059.001, T1027.010, T1564.003, T1555.003, T1539, T1567.004]
status: finished
featured: true
repo: https://github.com/guisosi/mavi-chivas
---

> Só _sandbox_. Nenhuma amostra é hospedada aqui e todo indicador de rede está _defanged_.

Uma das minhas primeiras análises reais de malware. Alguém compartilhou um "_mod_" de Minecraft num servidor do Discord. Em vez de executá-lo, enviei-o para uma _sandbox_. Era um _infostealer_, e bem feito.

A execução é pública no ANY.RUN, e pode ser encontrada pelo SHA256 no final. Tudo abaixo vem dela.

## O _lure_

Nenhum _exploit_. A entrega inteira é social: um jogo, uma comunidade cujos membros confiam uns nos outros e um arquivo que promete algo legal.

O arquivo estava no Dropbox. Isso é uma escolha. Um domínio confiável quase nunca é bloqueado por proxy, e o download parece qualquer outro arquivo compartilhado.

<figure class="fig">
<img src="/img/posts/mavi-chivas/01-download.png" width="1249" height="603" loading="lazy" alt="Painel de downloads do Edge avisando que mavi chivas.exe pode danificar o dispositivo, com os botões Manter e Excluir. O link do Dropbox foi removido da barra de endereço.">
<figcaption class="fig__cap">O navegador avisa. Um clique em Manter e já era.</figcaption>
</figure>

<figure class="fig">
<img src="/img/posts/mavi-chivas/02-unknown-publisher.png" width="668" height="460" loading="lazy" alt="Aviso de segurança do Windows: não foi possível verificar o editor, editor desconhecido, o arquivo não tem assinatura digital válida, com os botões Executar e Cancelar.">
<figcaption class="fig__cap">Sem assinatura, editor desconhecido. A segunda e última chance de dizer não.</figcaption>
</figure>

Dois avisos, dois cliques. Para uma criança que quer o _mod_, isso não é atrito nenhum.

## É um _web app_

A primeira coisa que ele fez foi abrir várias janelas empilhadas de si mesmo.

<figure class="fig">
<img src="/img/posts/mavi-chivas/03-electron-windows.png" width="1064" height="576" loading="lazy" alt="Três janelas em branco empilhadas, todas com o caminho de mavi chivas.exe no título, na área de trabalho da sandbox.">
<figcaption class="fig__cap">Janelas empilhadas do mesmo binário: a cara de um app Electron.</figcaption>
</figure>

Malware clássico em C não faz isso. Electron faz. Os arquivos que ele acessou confirmaram: `ref-napi` e `ffi-napi`, as bibliotecas Node.js que deixam o JavaScript chamar APIs nativas do Windows. É o caminho comum de um _stealer_ em JavaScript chegar à DPAPI e descriptografar o que o navegador protege.

Algumas dessas bibliotecas vieram com _builds_ de Linux dentro de uma amostra de Windows. Um pacote multiplataforma, em que só a parte do alvo chega a rodar. Na _sandbox_ ele rodou como seis processos do mesmo binário.

## Olhar em volta antes de agir

Antes de roubar qualquer coisa, ele confere onde caiu:

```text
cmd.exe /d /s /c "reg query "HKLM\HARDWARE\DESCRIPTION\System""
```

Essa chave guarda as _strings_ da BIOS. Numa VM elas costumam dizer VirtualBox, VMware ou QEMU, então é uma checagem barata de _sandbox_. (T1497.001, T1012)

Ele também lê o GUID da máquina, o nome do computador e a CPU, e pergunta o IP público ao `myexternalip[.]com`. (T1082, T1016)

## Esconder a janela

O PowerShell é executado seis vezes, sempre com todas as _flags_ silenciosas que existem:

```text
powershell -NoLogo -NonInteractive -NoProfile -ExecutionPolicy Bypass -Encoded WwBTAHkA...
```

O que eu decodifiquei é um _wrapper_ em volta de um segundo _blob_ em Base64. Duas camadas, para isto:

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

O `Add-Type` compila esse C# na hora, e é por isso que o `csc.exe` aparece na árvore de processos, também seis vezes. O código em si é minúsculo: acha a janela do console e a esconde, para a vítima nunca ver uma caixa preta piscar. (T1059.001, T1027.010, T1564.003)

Visto de fora, PowerShell compilando C# assusta. Decodificado, é só higiene de _stage_.

## O roubo

Aqui está o truque que mostra que alguém fez o dever de casa.

Um navegador Chromium guarda senhas salvas e cookies em bancos SQLite. Com o navegador aberto, esses arquivos ficam travados. Então o _stealer_ simplesmente mata o navegador com `taskkill.exe`. A _sandbox_ o viu ir atrás dos navegadores repetidas vezes.

Com os navegadores fechados, os arquivos ficam livres para leitura. Estes são os que ele acessou no perfil do Edge:

| Arquivo | O que há dentro |
|---|---|
| `Web Data` | senhas salvas, preenchimento automático, cartões |
| `Network\Cookies` | cookies de sessão |
| `History` | histórico de navegação |
| `Last Browser` | qual navegador estava em uso |

Ele também carregou DLLs da instalação do Firefox, o que é compatível com o uso da biblioteca de criptografia do próprio Firefox para ler os logins salvos. A _sandbox_ ainda apontou possível roubo de carteiras de cripto e de dados de mensageiros.

Os cookies são o prêmio de verdade. Um cookie de sessão válido pula a senha e o MFA, e trocar só a senha nem sempre derruba essa sessão. (T1555.003, T1539)

## Para onde foi?

Os mesmos processos que leram os dados do navegador abriram conexões TLS para `discord[.]com`. O conteúdo é cifrado, então não consigo mostrar o que foi enviado, mas um _stealer_ falando com o Discord logo depois do roubo é a exfiltração clássica por _webhook_. (T1567.004, provável)

O Discord traz a vítima e leva o _loot_.

## A _kill chain_

Siga o cartão: quem fala com quem, e o que viaja. Um link entra, um executável desce, o _loot_ sai.

<figure class="fig">
<picture>
<source media="(max-width: 560px)" srcset="/img/posts/mavi-chivas/killchain-tall.svg" width="400" height="532">
<img src="/img/posts/mavi-chivas/killchain-wide.svg" width="760" height="500" loading="lazy" alt="Sequência do ataque entre Discord, Dropbox, a vítima, o navegador e o Discord: um link para um mod chega à vítima, a vítima baixa mavi-chivas.exe do Dropbox, ele checa se é VM, esconde a janela do PowerShell, mata o navegador, lê Web Data e Cookies e envia o loot para o Discord por TLS, provavelmente por webhook.">
</picture>
</figure>

O mesmo caminho na árvore de processos:

```text
msedge.exe          baixa mavi chivas.exe do Dropbox
mavi chivas.exe     app Electron, seis processos
├─ cmd.exe          reg query HKLM\HARDWARE\DESCRIPTION\System
├─ cmd.exe          powershell -ExecutionPolicy Bypass -Encoded ...
│  └─ powershell    Add-Type -> csc.exe, esconde o console
├─ cmd.exe          taskkill nos navegadores
├─ lê               Web Data, Network\Cookies, History
└─ TLS              myexternalip[.]com, discord[.]com
```

## ATT&CK

| Técnica | ID | Evidência | Confiança |
|---|---|---|---|
| User Execution: Malicious File | T1204.002 | a vítima roda o _mod_ falso | confirmada |
| Virtualization/Sandbox Evasion: System Checks | T1497.001 | _strings_ da BIOS via `reg query` | confirmada |
| Query Registry | T1012 | `HKLM\HARDWARE\DESCRIPTION\System` | confirmada |
| System Information Discovery | T1082 | GUID da máquina, nome do computador, CPU | confirmada |
| System Network Configuration Discovery | T1016 | `myexternalip[.]com` | confirmada |
| Windows Command Shell | T1059.003 | `cmd.exe /d /s /c` | confirmada |
| PowerShell | T1059.001 | PowerShell codificado | confirmada |
| Command Obfuscation | T1027.010 | duas camadas de Base64 | confirmada |
| Hide Artifacts: Hidden Window | T1564.003 | `ShowWindow(console, 0)` | confirmada |
| Credentials from Web Browsers | T1555.003 | leitura do `Web Data` | confirmada |
| Steal Web Session Cookie | T1539 | leitura do `Network\Cookies` | confirmada |
| Exfiltration Over Webhook | T1567.004 | TLS para `discord[.]com` depois do roubo | provável |

Mapeamentos que eu descartei depois de reler a execução:

- **T1027.004, Compile After Delivery.** O `csc.exe` compila, sim, mas só o ajudante que esconde a janela. O _stealer_ já vem pronto.
- **T1105, Ingress Tool Transfer.** Não existe segundo _stage_ nessa execução. O navegador baixa o arquivo, a vítima roda. Isso é execução pelo usuário.
- **T1567.002, Exfiltration to Cloud Storage.** A _sandbox_ sugeriu por causa do Dropbox. Canal certo, direção errada: o Dropbox só entregou.
- **T1489, Service Stop.** Matar os navegadores não é um ataque à disponibilidade. É o passo que torna o roubo possível.

## Indicadores

| Tipo | Valor |
|---|---|
| Arquivo | `mavi-chivas.exe` |
| MD5 | `71930BF332B6A596468FAC494AD8EA98` |
| SHA1 | `D18539875B0ECDA428B89807AFA263792D6BEEE1` |
| SHA256 | `29269FA6CF19C9114B15D13044B64903C33BC382007EC85FAD8A5277711946F4` |
| Entrega | `hxxps://www.dropbox[.]com/scl/fi/zprhs69ehmegj90tnjdfn/mavi-chivas.exe` |
| Contatados | `myexternalip[.]com`, `discord[.]com` |

## O que eu tirei disso

- **Uma _string_ não é um comportamento.** No começo eu chamei de _downloader_ por causa de uma _string_ `downloadFile`. Foram os arquivos que ele acessou que confirmaram o _stealer_.
- **Decodifique antes de concluir.** "PowerShell compila C#" parecia _payload_ em memória. Decodificado, só escondia a janela. Meu primeiro _write-up_ errou nisso.
- **O mapeamento da _sandbox_ é um rascunho.** Acertou o canal do Dropbox e errou a direção.
- **Plataformas confiáveis fazem o trabalho pesado.** Discord para o _lure_ e para a saída, Dropbox para o arquivo. Ninguém bloqueia nenhum dos dois.
- **Mate o _lock_, depois leia.** Pequeno, chato e eficaz. É assim que um bom _tradecraft_ se parece.

O relatório completo, revisado com as correções acima, está no [repositório mavi-chivas](https://github.com/guisosi/mavi-chivas).
