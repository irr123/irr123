---
date: 2025-03-05T08:46:19Z
back_ref: /blog/_index.md
draft: false
title: Encrypted Google Drive backup with rclone crypt (part 2)
description:
  "Part 2: encrypt the rclone backup with crypt, mirror to Dropbox for offsite
  redundancy. A boring, restorable disaster-recovery plan that costs nothing."
image: suit-2.jpg
---

This is a continuation of the first
[part]({{< relref "blog/posts/google-drive-backup" >}}), where I built a basic
backup solution using local storage. Now I add another cloud provider and
encryption.

![generate image in anime style where relaxed professional guy in blue suit sitting relaxed with wiskey](suit-2.jpg)

## Dropbox: add an offsite target

To obtain an access token, I need to configure
[rclone](https://rclone.org/remote_setup/) locally (because of web browser).
Here's how I did it using Docker:

```bash
docker run --rm -it \
    -v ./config:/config/rclone \
    -v ./data:/data \
    --net=host \
    rclone/rclone authorize "dropbox"
```

After obtaining the token, add new sections to `rclone.conf`:

```toml
[dropbox]
type = dropbox
token = {"access_token":"<...>"}  # whole obtained string

[dropbox-crypt]
type = crypt
remote = dropbox:
filename_encryption = obfuscate
directory_name_encryption = false
password = <PASSWORD>
```

**Important:** Remember to replace `<PASSWORD>` with a strong, secure password,
rclone [helps with it](https://rclone.org/crypt/#configuration).

### rclone: run encrypted backup

Now use the encrypted Dropbox remote to back up Google Drive data:

```bash
docker run --rm -it \
    -v ./config:/config/rclone \
    -v ./data:/data\
    rclone/rclone --drive-shared-with-me \
    copy google-drive:<SHARED FOLDER> dropbox-crypt:
```

### rclone: restore encrypted backup

To restore the encrypted backup, reverse the source and destination in the
`rclone copy` command:

```bash
docker run --rm -it \
    -v ./config:/config/rclone \
    -v ./data:/data \
    rclone/rclone --drive-shared-with-me \
    copy dropbox-crypt: google-drive:<SHARED FOLDER>
```

This decrypts and copies files back to Google Drive.

**Note:** Only properly encrypted files will be recovered.

## Verdict: encrypted, cheap, restorable

By adding Dropbox as a secondary backup destination and encrypting data, this
setup improves redundancy for my Google Drive backup. Extra layer against data
loss or unauthorized access. The weak point stays boring: password quality.
Strong, unique password. Stored properly.

Next boring task: regular restore tests. Then health checks and notifications.
