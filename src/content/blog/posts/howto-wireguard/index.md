---
date: 2025-07-12T11:04:35Z
back_ref: /blog/_index.md
draft: false
title: Private WireGuard VPN with selective Tor routing
description:
  "A private WireGuard VPN connecting laptop, phone, and servers. Laptop and
  phone exit through Tor. Configs for Ubuntu, Windows, and Podman."
image: hero.jpg
---

I use WireGuard to join my servers, laptop, and phone into one private network.
Laptop and phone traffic goes through Tor. Server-to-server traffic stays
normal.

![model, harness, intent](hero.jpg)

## The WireGuard server (Ubuntu)

This server is the WireGuard endpoint. Clients connect to it. It routes traffic.

### System optimization (sysctl)

First, tune the server network settings. Many of these settings are from my
previous article about [VPNs]({{< relref "blog/posts/shadowsocks-to-tor" >}})
([here](https://github.com/irr123/shadowsocks-to-tor/blob/main/server.yaml#L18-L37));
add the following to `/etc/sysctl.conf`:

```ini
net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=hybla
fs.file-max=51200
net.core.netdev_max_backlog=250000
net.core.rmem_max=67108864
net.core.somaxconn=4096
net.core.wmem_max=67108864
net.ipv4.ip_forward=1
net.ipv4.ip_local_port_range=10000 65000
net.ipv4.tcp_fastopen=3
net.ipv4.tcp_fin_timeout=30
net.ipv4.tcp_keepalive_time=1200
net.ipv4.tcp_max_syn_backlog=8192
net.ipv4.tcp_max_tw_buckets=5000
net.ipv4.tcp_mem=25600 51200 102400
net.ipv4.tcp_mtu_probing=1
net.ipv4.tcp_rmem=4096 87380 67108864
net.ipv4.tcp_syncookies=1
net.ipv4.tcp_tw_reuse=1
net.ipv4.tcp_wmem=4096 65536 67108864
```

At a minimum, `net.ipv4.ip_forward=1` is required to allow the server to route
traffic. The other settings are performance optimizations. I apply them with
`sudo sysctl -p`.

### WireGuard installation

```bash
sudo apt install wireguard wireguard-tools
mkdir -p /etc/wireguard/ && cd /etc/wireguard/
wg genkey | tee server-privatekey | wg pubkey > server-publickey
```

Now, create the server's configuration file at
[`/etc/wireguard/wg0.conf`](https://www.wireguard.com/#cryptokey-routing):

```ini
[Interface]
Address = 192.168.42.1/24
ListenPort = 51820
PrivateKey = <paste content of server-privatekey here>
```

Start the WireGuard service and enable it to launch on boot
`sudo systemctl start wg-quick@wg0 && sudo systemctl enable wg-quick@wg0`.

I check its status with `sudo journalctl -eu wg-quick@wg0.service`.

### Generating peer configurations

With the server running, I generate keys for clients and add them as peers:

```bash
wg genkey | tee client1-privatekey | wg pubkey > client1-publickey
wg genkey | tee raspberrypi-privatekey | wg pubkey > raspberrypi-publickey
wg genkey | tee myphone-privatekey | wg pubkey > myphone-publickey
wg genkey | tee mypc-privatekey | wg pubkey > mypc-publickey
```

### Integrating Tor and firewall rules

{{< details summary="Previous-previous version with local TOR daemon" >}}

My Tor installation was already described
[here]({{< relref "blog/posts/shadowsocks-to-tor" >}}#tor-daemon). The crucial
step is to ensure Tor's listeners are bound to the WireGuard interface IP,
`/etc/tor/torrc`:

```ini
AutomapHostsOnResolve 1
AutomapHostsSuffixes .onion,.exit
AvoidDiskWrites 1
DNSPort 192.168.42.1:9053
TransPort 192.168.42.1:9040
```

{{< /details >}}

{{< details summary="Previous version with TOR daemon in docker" >}}

```bash
mkdir -p /opt/tor/data
chown -R 100:101 /opt/tor/data
mkdir -p /etc/tor
cat > /etc/tor/torrc << 'EOF'
AutomapHostsOnResolve 1
AutomapHostsSuffixes .onion,.exit
AvoidDiskWrites 1
DNSPort 192.168.42.1:9053
TransPort 192.168.42.1:9040
DataDirectory /var/lib/tor
EOF

docker run -d --name tor \
  --restart unless-stopped \
  --network host \
  -v /etc/tor/torrc:/etc/tor/torrc:ro \
  -v /opt/tor/data:/var/lib/tor \
  docker.io/dockurr/tor:0.4.8.21

docker logs tor -f
...
...
...
Nov 17 18:04:07.000 [notice] Bootstrapped 100% (done): Done
```

{{< /details >}}

This time I set up Tor in
[podman]({{< relref "blog/posts/the-actual-state-of-self-hosting-on-a-vps" >}})
and route traffic through it.

```bash
mkdir -p /opt/tor/data
chown -R 100:101 /opt/tor/data
mkdir -p /etc/tor
cat > /etc/tor/torrc << 'EOF'
AutomapHostsOnResolve 1
AutomapHostsSuffixes .onion,.exit
AvoidDiskWrites 1
DNSPort 192.168.42.1:9053
TransPort 192.168.42.1:9040
DataDirectory /var/lib/tor
EOF

mkdir -p /etc/containers/systemd

cat > /etc/containers/systemd/tor.container << 'EOF'
[Unit]
Description=Tor (dockurr/tor) via Podman Quadlet
Wants=network-online.target
After=network-online.target

[Container]
Image=docker.io/dockurr/tor:0.4.8.21
Network=host

Volume=/etc/tor/torrc:/etc/tor/torrc:ro
Volume=/opt/tor/data:/var/lib/tor:Z

ContainerName=tor

[Service]
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start tor.service
systemctl enable tor.service

journalctl -u tor.service -f
...
...
...
Nov 17 18:04:07.000 [notice] Bootstrapped 100% (done): Done
```

> **Security Note**: Nobody audits this for me. I checked exact
> `docker.io/dockurr/tor:0.4.8.21`; responsibility stays mine.

The noticeable part here is `--network host`. Routing matches the local daemon
case. Now I update `/etc/wireguard/wg0.conf` with iptables rules to route client
traffic to Tor and lock down the server:

```ini
[Interface]
Address = 192.168.42.1/24
ListenPort = 51820
PrivateKey = <paste content of server-privatekey here>

PostUp = iptables -t nat -A PREROUTING -i %i -p tcp --syn -j REDIRECT --to-ports 9040
PostUp = iptables -t nat -A PREROUTING -i %i -p udp --dport 53 -j REDIRECT --to-ports 9053
PostUp = iptables -A INPUT -i %i -p tcp --dport 9040 -j ACCEPT
PostUp = iptables -A INPUT -i %i -p udp --dport 9053 -j ACCEPT
PostUp = iptables -A FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
PostUp = iptables -A FORWARD -i %i -p udp -j DROP
PostUp = iptables -t nat -A POSTROUTING -o ens3 -j MASQUERADE

PostDown = iptables -t nat -D POSTROUTING -o ens3 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -p udp -j DROP
PostDown = iptables -D FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
PostDown = iptables -D INPUT -i %i -p udp --dport 9053 -j ACCEPT
PostDown = iptables -D INPUT -i %i -p tcp --dport 9040 -j ACCEPT
PostDown = iptables -t nat -D PREROUTING -i %i -p udp --dport 53 -j REDIRECT --to-ports 9053
PostDown = iptables -t nat -D PREROUTING -i %i -p tcp --syn -j REDIRECT --to-ports 9040

[Peer]
PublicKey = <paste content of client1-publickey>
AllowedIPs = 192.168.42.2/32

[Peer]
PublicKey = <paste content of raspberrypi-publickey>
AllowedIPs = 192.168.42.3/32

[Peer]
PublicKey = <paste content of myphone-publickey>
AllowedIPs = 192.168.42.4/32

[Peer]
PublicKey = <paste content of mypc-publickey>
AllowedIPs = 192.168.42.5/32
```

**Note**: Replace _ens3_ with the server's public-facing network interface
(e.g., _eth0_).

Finally, apply all the changes by restarting the services
`sudo systemctl restart tor && sudo systemctl restart wg-quick@wg0`.

## Client configs: split tunnel vs Tor full tunnel

### Client type A: split-tunnel (Ubuntu/Raspberry Pi)

These clients only use the VPN to access other devices on the _192.168.42.0/24_
network. Their regular internet traffic will not go through the VPN.

Install WireGuard, `sudo apt install wireguard wireguard-tools`, create
`/etc/wireguard/wg0.conf`:

```ini
[Interface]
PrivateKey = <paste private key for this specific client>
Address = 192.168.42.3/24

[Peer]
PublicKey = <paste content of server-publickey>
Endpoint = your.server.public.ip:51820
AllowedIPs = 192.168.42.0/24
PersistentKeepalive = 25
```

The _AllowedIPs = 192.168.42.0/24_ setting is the key here. It tells the client
to only route traffic for the VPN subnet through the tunnel.
_PersistentKeepalive_ helps maintain the connection through NAT firewalls.

Don't forget to start and enable the service:
`sudo systemctl start wg-quick@wg0 && sudo systemctl enable wg-quick@wg0`.

### Client type B: full-tunnel over Tor (Windows/GrapheneOS)

These clients route all internet traffic through the VPN. The server then sends
that traffic through Tor.

Create the configuration file and import it into the WireGuard app:

```ini
[Interface]
PrivateKey = <paste private key for mypc or myphone>
Address = 192.168.42.5/24
DNS = 192.168.42.1

[Peer]
PublicKey = <paste content of server-publickey>
Endpoint = your.server.public.ip:51820
AllowedIPs = 0.0.0.0/0
```

_AllowedIPs = 0.0.0.0/0_, this is the standard "full-tunnel" setting that
directs all IPv4 traffic through the VPN. _DNS = 192.168.42.1_ is **critical**.
It forces the client to use my server for all DNS requests, which are then
resolved securely by Tor. This prevents "DNS leaks" where requests might bypass
the VPN.

#### Windows AllowedIPs note

While _AllowedIPs = 0.0.0.0/0_ is the most secure setting, some Windows users
prefer _AllowedIPs = 0.0.0.0/1, 128.0.0.0/1_ to avoid certain issues with local
network access. With this alternative, setting the DNS directive as shown above
is absolutely essential to prevent DNS leaks.

## Verify VPN connectivity and Tor exit

I verify two things:

1. Check Internal VPN Connectivity, from one client (e.g., my PC at
   192.168.42.5), ping another client (e.g., my phone at 192.168.42.4):

   ```bash
   ping 192.168.42.4
   PING 192.168.42.4 (192.168.42.4) 56(84) bytes of data.
   64 bytes from 192.168.42.4: icmp_seq=1 ttl=64 time=40.6 ms
   ...
   ```

   A successful reply means the private network is up.

1. Check Tor Routing on a Full-Tunnel Client, on my PC or phone, open a terminal
   or browser and check my public IP:

   ```bash
   curl https://wtfismyip.com/json
   ```

   The output should show an IP address belonging to a Tor exit node:

   ```json
   {
     "YourFuckingIPAddress": "185.34.33.2",
     "YourFuckingLocation": "France",
     "YourFuckingHostname": "tor.laquadrature.net",
     "YourFuckingISP": "Octopuce s.a.r.l.",
     "YourFuckingTorExit": true,
     "YourFuckingCity": "",
     "YourFuckingCountry": "France",
     "YourFuckingCountryCode": "FR"
   }
   ```

   If `YourFuckingTorExit` is `true`, the setup works.

Once private keys are transferred to their respective client devices, remove
them from the server, `rm -rf client1* mypc-* myphone-* raspberrypi-* server-*`.
