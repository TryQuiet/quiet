# Run Quiet Loki as a SNApp

Quiet is not a SNApp until **system Lokinet** has a persistent client identity and your libp2p port is reachable on `lokitun0`. Tor onions are not SNApps.

## 1. Install Lokinet (Arch)

Use your working package (`lokinet` / `lokinet-aur2`), not a second daemon spawned by Quiet.

```bash
sudo pacman -S --needed lokinet   # or makepkg -si from unmellow/lokinet-aur2
sudo systemctl enable --now lokinet
```

Confirm:

```bash
systemctl is-active lokinet          # active
ip addr show lokitun0               # inet 172.16.0.1/16 (or similar)
host localhost.loki 127.3.2.1       # must print YOURNAME.loki and 172.16.0.1
```

If `host localhost.loki` **without** `127.3.2.1` is NXDOMAIN, that is normal. Only Lokinet’s stub (`127.3.2.1`) knows `.loki`.

Do **not** enable HTTP on `:1190`. OxenMQ is unused for this path.

## 2. Persistent SNApp key

Edit the unit config (often `/etc/loki/lokinet.ini` or `/var/lib/lokinet/lokinet.ini`):

```ini
[network]
enabled=true
ifname=lokitun0
ifaddr=172.16.0.1/16
keyfile=/var/lib/lokinet/snappkey.private
```

```bash
sudo touch /var/lib/lokinet/snappkey.private
sudo chown lokinet:lokinet /var/lib/lokinet/snappkey.private
sudo chmod 600 /var/lib/lokinet/snappkey.private
sudo systemctl restart lokinet
host localhost.loki 127.3.2.1
```

That `.loki` name is the SNApp. It must stay the same across reboots (the keyfile).

## 3. Open the Quiet port on the TUN

Quiet libp2p listens as `/dns4/<name>.loki/tcp/80/ws`. The process must accept TCP **80** (or whatever you put in the multiaddr) on `172.16.0.1`, not only `127.0.0.1`.

If a firewall blocks `lokitun0`, allow it:

```bash
sudo nft add rule inet filter input iifname lokitun0 tcp dport 80 accept
```

## 4. Quiet Loki package

Rebuild Quiet after the invite URL / DNS changes so QR and copy-link are `quiet-loki://join#…`.

Official `https://tryquiet.org/join#…` will not work for this fork.

## 5. New community

Old communities already stored an onion in `inviteData.pairs`. Create a **new** community after Lokinet DNS works, or the QR will still encode the onion.
