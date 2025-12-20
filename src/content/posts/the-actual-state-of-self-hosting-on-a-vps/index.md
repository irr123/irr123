---
date: 2025-12-18T12:44:19Z
draft: false
title: The actual state of self-hosting on a VPS
image: cursed_Kubernetes_cathedral.png
keywords:
  - self-hosting
  - VPS
  - docker-compose
  - docker
  - kubernetes
  - k3s
  - podman
  - quadlet
  - systemd
  - rootless-containers
  - container-orchestration
  - boring-infrastructure
  - price-sensitive-infra
  - devops-pragmatism
  - anti-hype
  - container-runtime
---

I recently ran into a claim: Docker Compose is outdated and K3s is the king for
my 1Gb VPS.

At the same time, `docker-compose.py` is effectively deprecated, with Compose
now shipped as a built-in `docker compose` command. That alone is not a problem,
but it raised a reasonable question: has the role of Docker Compose actually
changed, or is this just noise from the Kubernetes church?

<video autoplay loop muted playsinline preload="metadata" style="width:100%; height:auto;">
  <source src="cursed_Kubernetes_cathedral.mp4" type="video/mp4">
</video>

This post is about self-hosted setups:

- one or a few VPS
- price sensitivity
- limited ops time, bordering on laziness
- preference for boring, anti-hype infra

Within that landscape, I'm overviewing:

1. [Docker Compose](#docker-compose)
2. [K3s](#k3s)
3. [Podman + Quadlet](#podman--quadlet)
4. ...
5. Profit!

## Docker Compose

No need to explain, here's the `docker-compose.yaml`.

### Deployment entity example

```yaml
services:
  redis:
    image: valkey/valkey:latest
    restart: unless-stopped
    command: valkey-server --port 6379
    ports:
      - "127.0.0.1:6379:6379"
    healthcheck:
      test: ["CMD", "valkey-cli", "ping"]
      interval: 5s
      timeout: 3s

  python:
    build:
      context: .
      dockerfile: Dockerfile.python
    restart: always
    environment:
      REDIS_HOST: redis
    ports:
      - "8080:8080"
    healthcheck:
      test:
        - CMD
        - python
        - -c
        - "import http.client,sys;
          c=http.client.HTTPConnection('127.0.0.1',8080,timeout=2);
          c.request('GET','/healthz'); r=c.getresponse(); sys.exit(0 if
          r.status==200 else 1)"
      interval: 5s
      timeout: 3s
    depends_on:
      redis:
        condition: service_healthy
```

{{< details summary="Dockerfile.python" >}}

```
ARG BASE_IMAGE=python:3.14-slim-trixie
ARG UV_VERSION=0.9.18-python3.14-trixie-slim

FROM ghcr.io/astral-sh/uv:$UV_VERSION AS uv_carrier
FROM $BASE_IMAGE AS builder

COPY --from=uv_carrier /usr/local/bin/uv /usr/local/bin/
RUN uv venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH

COPY ./requirements.txt requirements.txt
RUN uv pip install -r requirements.txt

FROM $BASE_IMAGE

WORKDIR /opt/app

ENV PYTHONUNBUFFERED=1 \
    PATH=/opt/venv/bin:$PATH

COPY --from=builder /opt/venv /opt/venv
COPY . ./

CMD ["python", "-m", "python.main"]
```

{{< /details >}}

{{< details summary="python/main.py" >}}

```python
import asyncio
import os

from redis.asyncio import Redis

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
SRV_HOST = "0.0.0.0"
SRV_PORT = 8080


def handler(redis: Redis):
    async def fn(_: asyncio.StreamReader, w: asyncio.StreamWriter):
        try:
            await redis.ping()
            response = (
                f"HTTP/1.1 200 OK\r\n"
                f"Content-Type: text/plain\r\n"
                f"Content-Length: 0\r\n"
                f"\r\n"
                f""
            )

            w.write(response.encode())
            await w.drain()
        finally:
            w.close()
            await w.wait_closed()

    return fn


async def main():
    redis = Redis(host=REDIS_HOST, port=int(REDIS_PORT))
    server = await asyncio.start_server(handler(redis), host=SRV_HOST, port=SRV_PORT)

    try:
        async with server:
            await server.serve_forever()
    finally:
        await redis.aclose()


if __name__ == "__main__":
    asyncio.run(main())
```

{{< /details >}}

{{< details summary="docker compose ps" >}}

```bash
NAME               IMAGE                  COMMAND                  SERVICE   CREATED       STATUS                 PORTS
example-python-1   example-python         "python -m python.ma…"   python    2 hours ago   Up 2 hours (healthy)
example-redis-1    valkey/valkey:latest   "docker-entrypoint.s…"   redis     2 hours ago   Up 2 hours (healthy)   127.0.0.1:6379->6379/tcp
```

{{< /details >}}

### Pros

It definitely works. It's simple, supports health checks, and has restart
policies.

### Cons

Compose is not part of the system, has poor integration with systemd and
journald. Broad permissions, a rootful daemon, and a continuous CPU/RAM tax.

Health checks are mostly informational and don't automatically trigger restarts.

It's just a fine baseline for a single VPS.

## K3s

A few words from the official sites:

> What is K3s? Lightweight Kubernetes.
>
> Easy to install, half the memory, all in a binary of less than 100 MB.

Setup is basically `curl -sfL https://get.k3s.io | sh -`. I already like it -
just run, as root, trust me 😈

{{< details summary="Cluster overview" >}}

```sh
root@qemu:/home/user# systemctl status k3s
● k3s.service - Lightweight Kubernetes
     Loaded: loaded (/etc/systemd/system/k3s.service; enabled; preset: enabled)
     Active: active (running) since Fri 2025-12-19 14:57:54 UTC; 4min 49s ago
       Docs: https://k3s.io
    Process: 1140 ExecStartPre=/sbin/modprobe br_netfilter (code=exited, status=0/SUCCESS)
    Process: 1141 ExecStartPre=/sbin/modprobe overlay (code=exited, status=0/SUCCESS)
   Main PID: 1143 (k3s-server)
      Tasks: 90
     Memory: 1.4G (peak: 1.5G)
        CPU: 35.823s
     CGroup: /system.slice/k3s.service
             ├─1143 "/usr/local/bin/k3s server"
             ├─1168 "containerd "
             ├─1732 /var/lib/rancher/k3s/data/7b97d417878d140a607ac677a82c2562e863279de825743bbdb137cff0b48877/bin/containerd-shim-runc-v2 -namespace k8s.io -id ba799f11f2b2d99b2a153257380ff9755>
             ├─1766 /var/lib/rancher/k3s/data/7b97d417878d140a607ac677a82c2562e863279de825743bbdb137cff0b48877/bin/containerd-shim-runc-v2 -namespace k8s.io -id ff37d03c651fc8d57defe3d5493195fdd>
             ├─1777 /var/lib/rancher/k3s/data/7b97d417878d140a607ac677a82c2562e863279de825743bbdb137cff0b48877/bin/containerd-shim-runc-v2 -namespace k8s.io -id a2b64c80ff6b0546113338e4426c31ccb>
             ├─2773 /var/lib/rancher/k3s/data/7b97d417878d140a607ac677a82c2562e863279de825743bbdb137cff0b48877/bin/containerd-shim-runc-v2 -namespace k8s.io -id a0538126449c9c4ff76f05aec8f2da487>
             └─2862 /var/lib/rancher/k3s/data/7b97d417878d140a607ac677a82c2562e863279de825743bbdb137cff0b48877/bin/containerd-shim-runc-v2 -namespace k8s.io -id 5be4562c4eb8e79d0f8282ed74eb04b76>

Dec 19 14:58:59 qemu k3s[1143]: I1219 14:58:59.845233    1143 resource_quota_monitor.go:227] "QuotaMonitor created object count evaluator" resource="tlsoptions.traefik.io"
Dec 19 14:58:59 qemu k3s[1143]: I1219 14:58:59.845249    1143 resource_quota_monitor.go:227] "QuotaMonitor created object count evaluator" resource="apiportalauths.hub.traefik.io"
Dec 19 14:58:59 qemu k3s[1143]: I1219 14:58:59.845267    1143 resource_quota_monitor.go:227] "QuotaMonitor created object count evaluator" resource="apiportals.hub.traefik.io"
Dec 19 14:58:59 qemu k3s[1143]: I1219 14:58:59.845284    1143 resource_quota_monitor.go:227] "QuotaMonitor created object count evaluator" resource="middlewaretcps.traefik.io"
Dec 19 14:58:59 qemu k3s[1143]: I1219 14:58:59.845297    1143 resource_quota_monitor.go:227] "QuotaMonitor created object count evaluator" resource="ingressrouteudps.traefik.io"
Dec 19 14:58:59 qemu k3s[1143]: I1219 14:58:59.845313    1143 resource_quota_monitor.go:227] "QuotaMonitor created object count evaluator" resource="apiplans.hub.traefik.io"
Dec 19 14:58:59 qemu k3s[1143]: I1219 14:58:59.845329    1143 resource_quota_monitor.go:227] "QuotaMonitor created object count evaluator" resource="apiratelimits.hub.traefik.io"
Dec 19 14:58:59 qemu k3s[1143]: I1219 14:58:59.845341    1143 resource_quota_monitor.go:227] "QuotaMonitor created object count evaluator" resource="serverstransporttcps.traefik.io"
Dec 19 14:58:59 qemu k3s[1143]: I1219 14:58:59.845489    1143 shared_informer.go:350] "Waiting for caches to sync" controller="resource quota"
Dec 19 14:58:59 qemu k3s[1143]: I1219 14:58:59.845520    1143 shared_informer.go:357] "Caches are synced" controller="resource quota"
```

```sh
root@qemu:/home/user# sudo kubectl get all -n kube-system
NAME                                          READY   STATUS      RESTARTS   AGE
pod/coredns-6d668d687-6lhpl                   1/1     Running     0          4m48s
pod/helm-install-traefik-crd-rsd4s            0/1     Completed   0          4m48s
pod/helm-install-traefik-ttdrr                0/1     Completed   1          4m48s
pod/local-path-provisioner-869c44bfbd-k6ct2   1/1     Running     0          4m48s
pod/metrics-server-7bfffcd44-4xtb7            1/1     Running     0          4m48s
pod/svclb-traefik-091968ea-wb98r              2/2     Running     0          4m17s
pod/traefik-865bd56545-b5qkm                  1/1     Running     0          4m17s

NAME                     TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)                      AGE
service/kube-dns         ClusterIP      10.43.0.10     <none>        53/UDP,53/TCP,9153/TCP       4m51s
service/metrics-server   ClusterIP      10.43.249.39   <none>        443/TCP                      4m51s
service/traefik          LoadBalancer   10.43.154.80   10.0.2.15     80:30206/TCP,443:31853/TCP   4m17s

NAME                                    DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
daemonset.apps/svclb-traefik-091968ea   1         1         1       1            1           <none>          4m17s

NAME                                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/coredns                  1/1     1            1           4m51s
deployment.apps/local-path-provisioner   1/1     1            1           4m51s
deployment.apps/metrics-server           1/1     1            1           4m51s
deployment.apps/traefik                  1/1     1            1           4m17s

NAME                                                DESIRED   CURRENT   READY   AGE
replicaset.apps/coredns-6d668d687                   1         1         1       4m48s
replicaset.apps/local-path-provisioner-869c44bfbd   1         1         1       4m48s
replicaset.apps/metrics-server-7bfffcd44            1         1         1       4m48s
replicaset.apps/traefik-865bd56545                  1         1         1       4m17s

NAME                                 STATUS     COMPLETIONS   DURATION   AGE
job.batch/helm-install-traefik       Complete   1/1           34s        4m51s
job.batch/helm-install-traefik-crd   Complete   1/1           33s        4m51s
```

{{< /details >}}

### Deployment

Here's the same Valkey & Python app with the same Dockerfile. Let's deploy it.
Helm isn't included by default, so I'll use raw YAML manifests.

{{< details summary="namespace.yaml" >}}

```bash
kubectl apply -f - <<'YAML'
apiVersion: v1
kind: Namespace
metadata:
  name: selfhosted
YAML
```

{{< /details >}}

{{< details summary="deployment-valkey.yaml" >}}

```bash
kubectl apply -f - <<'YAML'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: selfhosted
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: valkey/valkey:latest
          args: ["valkey-server", "--port", "6379"]
          ports:
            - containerPort: 6379
          readinessProbe:
            exec:
              command: ["sh", "-c", "valkey-cli ping | grep -q PONG"]
            initialDelaySeconds: 2
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          livenessProbe:
            exec:
              command: ["sh", "-c", "valkey-cli ping | grep -q PONG"]
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 5
YAML
```

{{< /details >}}

{{< details summary="service-valkey.yaml" >}}

```bash
kubectl apply -f - <<'YAML'
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: selfhosted
spec:
  selector:
    app: redis
  ports:
    - name: redis
      port: 6379
      targetPort: 6379
  type: ClusterIP
YAML
```

{{< /details >}}

{{< details summary="deployment-python.yaml" >}}

```bash
kubectl apply -f - <<'YAML'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python
  namespace: selfhosted
spec:
  replicas: 1
  selector:
    matchLabels:
      app: python
  template:
    metadata:
      labels:
        app: python
    spec:
      containers:
        - name: python
          image: localhost/local/python-app:dev
          imagePullPolicy: IfNotPresent
          env:
            - name: REDIS_HOST
              value: redis
            - name: REDIS_PORT
              value: "6379"
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 2
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 5
YAML
```

{{< /details >}}

{{< details summary="service-python.yaml" >}}

```bash
kubectl apply -f - <<'YAML'
apiVersion: v1
kind: Service
metadata:
  name: python
  namespace: selfhosted
spec:
  selector:
    app: python
  ports:
    - name: http
      port: 8080
      targetPort: 8080
  type: ClusterIP
YAML
```

{{< /details >}}

{{< details summary="ingress.yaml" >}}

```bash
kubectl apply -f - <<'YAML'
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: python
  namespace: selfhosted
spec:
  rules:
    - host: python.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: python
                port:
                  number: 8080
YAML
```

{{< /details >}}

{{< details summary="additional trick to bring docker image into ctr" >}}

```bash
podman build -f Dockerfile.python -t local/python-app:dev .
podman save --format docker-archive local/python-app:dev | sudo k3s ctr images import -
```

{{< /details >}}

All of this recreates what Docker Compose already gives you:

```bash
kubectl -n selfhosted get pods -o wide
NAME                      READY   STATUS    RESTARTS   AGE     IP           NODE   NOMINATED NODE   READINESS GATES
python-59b66ccf6b-xwng2   1/1     Running   0          3m51s   10.42.0.12   qemu   <none>           <none>
redis-68764c78c5-xjplm    1/1     Running   0          30m     10.42.0.9    qemu   <none>           <none>
```

On a single VPS.

### Pros & Cons

Pros: it provides `/usr/local/bin/k3s-uninstall.sh`.

Jokes aside: on the one hand it gives you the full Kubernetes experience, even
with built-in ingress controller, so you could simply reuse existing manifests
to full-fledged cluster and _scale_ things up (actually no, but needs to
believe, see non-clusterized `deployment-valkey.yaml`).

On the other hand, you pay high operational costs and high CPU/RAM overhead.
Will you ever recoup that investment?

## Podman + Quadlet

The dark horse. I'd never heard of it before I started writing this article, but
it looks the most promising.

Firstly, _Podman_ is a engine that runs containers without a permanent
privileged daemon. It uses OCI runtimes, rootless by design, Docker-compatible.

Second, _Quadlet_ generates systemd units, so containers integrate cleanly with
systemd and journald.

### Deployment

Podman itself already exists in Ubuntu repos (no need to add Docker's signing
key and repo).

1. as root: `sudo apt update && sudo apt install podman`
2. as regular user:
   `podman build -f Dockerfile.python -t local/python-app:dev .` (without
   docker's requred manual group/permission management; images differs from one
   user to another)
3. `mkdir -p ~/.config/containers/systemd`
4. `podman network create selfhosted` (it's quite strange but in default podman
   network DNS disabled)

Preparation is done. Add the units and you're ok.

{{< details summary="~/.config/containers/systemd/redis.container" >}}

```ini
[Unit]
Description=Valkey (redis)
Wants=network-online.target
After=network-online.target

[Container]
Image=docker.io/valkey/valkey:latest
Network=selfhosted
Exec=valkey-server --port 6379
PublishPort=127.0.0.1:6379:6379

HealthCmd=valkey-cli ping
HealthInterval=5s
HealthTimeout=3s
HealthRetries=5

[Service]
Restart=always

[Install]
WantedBy=default.target
```

{{< /details >}}

{{< details summary="~/.config/containers/systemd/python.container" >}}

```ini
[Unit]
Description=Python app
Wants=redis.service
After=redis.service

[Container]
Image=localhost/local/python-app:dev
Network=selfhosted
Environment=REDIS_HOST=systemd-redis
PublishPort=127.0.0.1:8080:8080

HealthCmd=python -c "import http.client,sys; c=http.client.HTTPConnection('127.0.0.1',8080,timeout=2); c.request('GET','/healthz'); r=c.getresponse(); sys.exit(0 if r.status==200 else 1)"
HealthInterval=5s
HealthTimeout=3s
HealthRetries=5

[Service]
Restart=always

[Install]
WantedBy=default.target
```

{{< /details >}}

Validate configs by `/usr/libexec/podman/quadlet --user --dryrun`. If it looks
good, run `systemctl --user daemon-reload`.

{{< details summary="systemctl --user status  redis python --no-pager" >}}

```bash
● redis.service - Valkey (redis)
     Loaded: loaded (/home/user/.config/containers/systemd/redis.container; generated)
     Active: active (running) since Sat 2025-12-20 13:32:38 UTC; 8min ago
   Main PID: 85139 (conmon)
      Tasks: 21 (limit: 9370)
     Memory: 8.6M (peak: 20.0M)
        CPU: 2.047s
     CGroup: /user.slice/user-1000.slice/user@1000.service/app.slice/redis.service
             ├─libpod-payload-e8c29da1a2f6c4bb032304f7dfbc5a767e026092c4a2fcbc830e58565f972f54
             │ └─85141 "valkey-server *:6379"
             └─runtime
               ├─85124 rootlessport
               ├─85130 rootlessport-child
               └─85139 /usr/bin/conmon --api-version 1 -c e8c29da1a2f6c4bb032304f7dfbc5a767e026092c4a2fcbc830e58565f972f54 -u e8c29da1a2f6c4bb032304f7dfbc5a767e026092c4a2fcbc830e58565f972f54 -r …

Dec 20 13:32:38 qemu podman[85050]: 2025-12-20 13:32:38.398858374 +0000 UTC m=+0.013421623 image pull d422224bf6e2d405c51aa2fa092855478543f21872a9b1a8125d184095f5aa25 docker.io/v…ey/valkey:latest
Dec 20 13:32:38 qemu systemd-redis[85139]: 1:M 20 Dec 2025 13:32:38.497 * oO0OoO0OoO0Oo Valkey is starting oO0OoO0OoO0Oo
Dec 20 13:32:38 qemu systemd-redis[85139]: 1:M 20 Dec 2025 13:32:38.497 * Valkey version=9.0.1, bits=64, commit=00000000, modified=0, pid=1, just started
Dec 20 13:32:38 qemu systemd-redis[85139]: 1:M 20 Dec 2025 13:32:38.497 * Configuration loaded
Dec 20 13:32:38 qemu podman[85050]: 2025-12-20 13:32:38.496286417 +0000 UTC m=+0.110849666 container start e8c29da1a2f6c4bb032304f7dfbc5a767e026092c4a2fcbc830e58565f972f54 (image…T=redis.service)
Dec 20 13:32:38 qemu systemd-redis[85139]: 1:M 20 Dec 2025 13:32:38.497 * monotonic clock: POSIX clock_gettime
Dec 20 13:32:38 qemu systemd-redis[85139]: 1:M 20 Dec 2025 13:32:38.497 * Running mode=standalone, port=6379.
Dec 20 13:32:38 qemu systemd-redis[85139]: 1:M 20 Dec 2025 13:32:38.498 * Server initialized
Dec 20 13:32:38 qemu systemd-redis[85139]: 1:M 20 Dec 2025 13:32:38.498 * Ready to accept connections tcp
Dec 20 13:32:38 qemu redis[85050]: e8c29da1a2f6c4bb032304f7dfbc5a767e026092c4a2fcbc830e58565f972f54

● python.service - Python app
     Loaded: loaded (/home/user/.config/containers/systemd/python.container; generated)
     Active: active (running) since Sat 2025-12-20 13:32:38 UTC; 8min ago
   Main PID: 85244 (conmon)
      Tasks: 16 (limit: 9370)
     Memory: 38.3M (peak: 46.6M)
        CPU: 2.721s
     CGroup: /user.slice/user-1000.slice/user@1000.service/app.slice/python.service
             ├─libpod-payload-8a390a010658563033af8b8e7be8c0984e03eb109eee54fdf2e7a7688ee7ca90
             │ └─85246 python -m python.main
             └─runtime
               ├─85218 rootlessport
               ├─85232 rootlessport-child
               └─85244 /usr/bin/conmon --api-version 1 -c 8a390a010658563033af8b8e7be8c0984e03eb109eee54fdf2e7a7688ee7ca90 -u 8a390a010658563033af8b8e7be8c0984e03eb109eee54fdf2e7a7688ee7ca90 -r …

Dec 20 13:32:38 qemu systemd[782]: Starting python.service - Python app container (rootless)...
Dec 20 13:32:38 qemu podman[85146]: 2025-12-20 13:32:38.516813999 +0000 UTC m=+0.021024836 container create 8a390a010658563033af8b8e7be8c0984e03eb109eee54fdf2e7a7688ee7ca90 (imag…=python.service)
Dec 20 13:32:38 qemu podman[85146]: 2025-12-20 13:32:38.568795185 +0000 UTC m=+0.073006064 container init 8a390a010658563033af8b8e7be8c0984e03eb109eee54fdf2e7a7688ee7ca90 (image=….version=1.33.7)
Dec 20 13:32:38 qemu systemd[782]: Started python.service - Python app container (rootless).
Dec 20 13:32:38 qemu podman[85146]: 2025-12-20 13:32:38.583186772 +0000 UTC m=+0.087397609 container start 8a390a010658563033af8b8e7be8c0984e03eb109eee54fdf2e7a7688ee7ca90 (image….version=1.33.7)
Dec 20 13:32:38 qemu python[85146]: 8a390a010658563033af8b8e7be8c0984e03eb109eee54fdf2e7a7688ee7ca90
Dec 20 13:32:38 qemu podman[85146]: 2025-12-20 13:32:38.508078113 +0000 UTC m=+0.012288991 image pull 5ab432c25a0bea88ed2ac7b636a0a44eeff6e5cb44c03f63e275ac736475c4eb localhost/l…l/python-app:dev
Hint: Some lines were ellipsized, use -l to show in full.
```

{{< /details >}}

The result: container isolation without the overhead and complexity. It runs as
a regular user. Updates are predictable via
`systemctl --user restart python.service`. Health checks actually restart the
service, and logs rotate out of the box.

## Conclusion

| Metric            |  Docker Compose   |       K3s        | Podman + Quadlet  |
| :---------------- | :---------------: | :--------------: | :---------------: |
| Idle RAM (Engine) |    ~100-200MB     |      ~1.4GB      | ~0MB (daemonless) |
| Orchestrator      |   Docker daemon   | "Control plane"© |      systemd      |
| Permissions       | Rootful (default) |     Rootful      |     Rootless      |
| Observability     |    docker logs    |   kubectl logs   |    journalctl     |

I started on the Docker Compose side, mostly intending to joke about Kubernetes
being dragged into everything. Instead, I ended up replacing Docker with
Podman + Quadlet on my VPS in the name of simplicity!

---

I intentionally omitted persistent volumes, because it would make the comparison
(especially K3s vs Quadlet) unfair in terms of operational cost.

The surprise: everything worked fine on arm64 (macOS → qemu-system-aarch64 →
ubuntu-24.04.3-live-server-arm64).
