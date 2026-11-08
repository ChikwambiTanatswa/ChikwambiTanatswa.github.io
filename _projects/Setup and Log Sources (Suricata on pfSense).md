---
layout: default
title: Trace Lab Phase 1
---


## Phase 1 — Setup and Log Sources (Suricata on pfSense)

**Date:** 2026-10-17

### Environment
- Host OS: Windows 11 Pro, connected to home router.
- pfSense (VM) configured as the router/gateway connecting Kali Linux and Metasploitable2 on an internal network.
- Tools in lab: pfSense + Suricata (IDS), Metasploitable2, Kali Linux.

### Initial access issue
Could not reach the pfSense webConfigurator at first — URL was entered as `https://192.168.1.1/24`, which is invalid (the `/24` is a CIDR prefix, not a URL path). Corrected to `https://192.168.1.1`. Confirmed Kali's IP (192.168.1.101/24) was on the correct subnet via `ip a`.

### Suricata installation issues
Package Manager install attempt failed repeatedly with "unable to retrieve package information." Troubleshooting, in the order performed:

1. Ran `ping 8.8.8.8` (Diagnostics > Ping, not DNS Lookup) from pfSense to test raw WAN connectivity — initially showed intermittent loss, later a direct test showed 100% packet loss.
2. Checked Diagnostics > DNS Lookup for `pkg.freebsd.org` — failed to resolve; only the local resolver (127.0.0.1) responded, upstream servers (8.8.8.8, 8.8.4.4) gave no response.
3. Disabled the DNS Resolver and enabled the DNS Forwarder instead — did not fix the issue.
4. Verified System > General Setup DNS server settings were correct (8.8.8.8, 8.8.4.4 listed, override unchecked) — not the cause.
5. Checked Status > Interfaces > WAN — found DHCP status showing "down" despite the link being up, meaning WAN had no lease and no gateway.
6. Clicked "Renew WAN" — this restored the DHCP lease. DNS Lookup for `pkg.freebsd.org` then resolved successfully with multiple A/AAAA records.
7. Package Manager still failed after the DHCP fix. Ran `pkg update -f` directly from the pfSense shell (console option 8) — this succeeded ("All repositories are up to date"), confirming the repo itself was reachable and the GUI was likely showing a stale error.
8. Root cause of the remaining GUI failure was the system clock being out of NTP sync (not just the displayed date, which looked correct) — causing TLS certificate validation to fail on package fetches. Once time sync was corrected, the GUI-based install proceeded further.
9. Even after the clock fix, one install attempt failed mid-way with `pkg-static: An error occured while fetching package` on a specific package (nss-3.93) — treated as transient/intermittent fetch failure, likely related to host resource contention (multiple VMs running on a 16GB laptop) rather than a configuration issue.
10. Installed Suricata directly from the pfSense shell instead of the GUI, which succeeded:
    ```
    pkg install pfSense-pkg-suricata
    ```

### Suricata configuration
1. Services > Suricata > Interfaces — added LAN (em1), the interface facing Metasploitable2.
2. On enabling the LAN interface, pfSense warned that Suricata requires Hardware Checksum Offloading, Hardware TCP Segmentation Offloading, and Hardware Large Receive Offloading to all be disabled for proper operation on this NIC type (VirtualBox e1000). Went to System > Advanced > Networking and checked all three "Disable hardware..." boxes (checksum offload had initially been missed/left unchecked), saved, and rebooted pfSense for the change to take effect.
3. Left default rule categories (ET Open) enabled on the interface — no additional heavy rule sets added.
4. Started the interface and confirmed it showed "running" (green).
5. Generated test traffic from Kali: `ping -c 4 192.168.1.1` and an `nmap -sS 192.168.1.1` scan.
6. Checked Services > Suricata > Alerts for the LAN interface.

### Result
The Nmap scan was logged under Suricata's Alerts for the LAN interface, showing TCP and ICMP entries between 192.168.1.101 (Kali) and 192.168.1.1 (pfSense) (screenshot captured).
<img width="1023" height="312" alt="Pasted image 20261017211034" src="https://github.com/user-attachments/assets/2acb6652-559c-4e19-8fbf-37228d532479" />



---
**Status:** Suricata installed and generating alerts from LAN-side test traffic, after resolving a WAN DHCP lease failure and an NTP/clock sync issue that blocked package installation. **Next:** confirm Metasploitable2 is producing host-side logs as the second log source, then begin Phase 2 (generate real attack traffic against Metasploitable2). **Risk:** the intermittent package-fetch failures (step 9) were never fully root-caused — if they recur during later package installs, retry via shell rather than re-diagnosing network config from scratch.
