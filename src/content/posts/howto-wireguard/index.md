---
date: 2025-07-12T11:04:35Z
draft: false
title: "How-to: A private WireGuard VPN with selective Tor routing"
image: "wireguard.png"
keywords: ["wireguard", "vpn", "tor", "privacy", "networking", "ubuntu",
"windows", "podman"]
---

When planning a VPN, _OpenVPN_ is often the default choice. However, in this
post, I'll document the process of building a private VPN using **WireGuard** to
unite different devices (servers, a notebook, and a phone) into a single, secure
network. Additionally, I will selectively route all internet traffic from my
notebook and phone through the Tor network, while allowing other servers on the
VPN to communicate normally without being routed through Tor.

## The WireGuard Server (Ubuntu)

This central server will act as the WireGuard endpoint, terminating connections
from all clients and routing traffic.

### System Optimization (sysctl)

First, it's a good practice to optimize the server's network settings for better
performance. Many of these settings are from my previous article about
[VPNs]({{< relref "posts/shadowsocks-to-tor" >}})
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

At a minimum, you will need `net.ipv4.ip_forward=1` to allow the server to route
traffic. The other settings are performance optimizations. Apply them with
`sudo sysctl -p`.

### WireGuard Installation

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

You can check its status with `sudo journalctl -eu wg-quick@wg0.service`.

### Generating Peer Configurations

With the server running, let's generate keys for our clients and add them as
peers:

```bash
wg genkey | tee client1-privatekey | wg pubkey > client1-publickey
wg genkey | tee raspberrypi-privatekey | wg pubkey > raspberrypi-publickey
wg genkey | tee myphone-privatekey | wg pubkey > myphone-publickey
wg genkey | tee mypc-privatekey | wg pubkey > mypc-publickey
```

### Integrating Tor and Firewall Rules

{{< details summary="Previous-previous version with local TOR daemon" >}}

My Tor installation was already described
[here]({{< relref "posts/shadowsocks-to-tor" >}}#tor). The crucial step is to
ensure Tor's listeners are bound to the WireGuard interface IP,
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

This time I'll setup TOR in
[podman]({{< relref "posts/the-actual-state-of-self-hosting-on-a-vps" >}}) and
route traffic thru it.

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

> **Security Note**: No one except yourself could audit the stuff you're using;
> I've checked exact `docker.io/dockurr/tor:0.4.8.21`, but only you are
> responsible for you security.

The noticeable part here -- `--network host`, that's why there is no difference
in routing, comparing it with local daemon. Now, we will update
`/etc/wireguard/wg0.conf` with robust iptables rules to route client traffic to
Tor and secure the server:

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

**Note**: Replace _ens3_ with your server's public-facing network interface
(e.g., _eth0_).

Finally, apply all the changes by restarting the services
`sudo systemctl restart tor && sudo systemctl restart wg-quick@wg0`.

## Part 2: Client Configurations

### Client Type A: Split-Tunnel (Ubuntu/Raspberry Pi)

These clients will only use the VPN to access other devices on the
_192.168.42.0/24_ network. Their regular internet traffic will not go through
the VPN.

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

### Client Type B: Full-Tunnel over Tor (Windows/GrapheneOS)

These clients will route all their internet traffic through the VPN, which then
gets funneled through the Tor network by the server.

Create the configuration file and import it into your WireGuard app:

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
It forces the client to use our server for all DNS requests, which are then
resolved securely by Tor. This prevents "DNS leaks" where requests might bypass
the VPN.

#### Note for Windows Users

While _AllowedIPs = 0.0.0.0/0_ is the most secure setting, some Windows users
prefer _AllowedIPs = 0.0.0.0/1, 128.0.0.0/1_ to avoid certain issues with local
network access. If you use this alternative, setting the DNS directive as shown
above is absolutely essential to prevent DNS leaks.

## Conclusion

To verify everything is working as expected, you can perform two checks:

1. Check Internal VPN Connectivity, from one client (e.g., your PC at
   192.168.42.5), ping another client (e.g., your phone at 192.168.42.4):

   ```bash
   ping 192.168.42.4
   PING 192.168.42.4 (192.168.42.4) 56(84) bytes of data.
   64 bytes from 192.168.42.4: icmp_seq=1 ttl=64 time=40.6 ms
   ...
   ```

   A successful reply means your private network is up!

1. Check Tor Routing on a Full-Tunnel Client, on your PC or phone, open a
   terminal or browser and check your public IP:

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

   If `YourFuckingTorExit` is `true`, your setup is a success.

Once you have securely transferred all private keys to their respective client
devices, be sure to remove them from the server,
`rm -rf client1* mypc-* myphone-* raspberrypi-* server-*`.
