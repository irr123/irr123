---
date: 2025-02-27T20:12:31Z
back_ref: /blog/_index.md
draft: false
title: (Almost) Free Google Drive backup (part 1)
description:
  "An almost-free Google Drive backup with rclone, a Cloud Console service
  account, Docker, and cron. The service account owns the data if your account
  dies."
keywords:
  - rclone Google Drive
  - Google Drive backup
  - service account backup
  - automated backup with cron
  - rclone Docker
  - Google Drive API backup
  - free cloud backup
  - scheduled rclone backup
  - rclone config example
  - Google Cloud Console service account
  - offsite backup automation
  - self-hosted backup
image: suit.jpg
---

I started with the boring question: what happens if Google Drive data
disappears?

![generate image in anime style where white collar in suit grabs his head because he realized that lost his reports](suit.jpg)

I searched for a reliable, out-of-the-box solution. Google's suggestions didn't
land, so I built my own. Lego backup: assemble the necessary components.

## Backup building blocks

- Access to
  [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts)
- rclone.org: A powerful tool that provides rsync-like CLI functionality for
  managing filesystems and cloud storage. It's well-documented; I focus on the
  short path

### Google Cloud Console: create the service account

I started with the most crucial step: credentials to interact with the Google
API. (Remember to enable the
[Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com)
if needed) This involves creating a
[Service Account](https://console.cloud.google.com/iam-admin/serviceaccounts)
and generating a
[JSON private key](https://developers.google.com/workspace/guides/create-credentials#create_credentials_for_a_service_account).

Here's an example of what it looks like:

```json
{
  "type": "service_account",
  "project_id": "<project name>",
  "private_key_id": "<hash>",
  "private_key": "-----BEGIN PRIVATE KEY-----\n<some base64 encoded stuff>\n-----END PRIVATE KEY-----\n",
  "client_email": "<service account name>@<project name>.iam.gserviceaccount.com",
  "client_id": "<another one id>",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/<service account name>%40<project name>.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

### rclone: copy Drive to local storage

Almost there. The next step is to set up rclone for automated execution using
Cron on a host. I'll skip the details of acquiring a hosting environment.

Here's prepared `rclone.conf`:

```toml
[google-drive]
type = drive
service_account_file = /config/rclone/sa.json  # <- The key
```

And here's how to use it with Docker:

```bash
docker run --rm -it \
    -v ./config:/config/rclone \
    -v ./data:/data \
    rclone/rclone --drive-shared-with-me \
    copy google-drive:<SHARED FOLDER> /data/$(date +"%Y-%m-%d")
```

### rclone: restore the backup

To restore the backup, reverse the source and destination paths in the
`rclone copy` command:

```bash
docker run --rm -it \
    -v ./config:/config/rclone \
    -v ./data:/data \
    rclone/rclone --drive-shared-with-me \
    copy /data/$(date +"%Y-%m-%d") google-drive:<SHARED FOLDER>
```

If I recover data, the original permissions will be lost, and the _Service
Account_ will become the owner of all recovered data.

#### Service-account ownership trap

A _Service Account_ is an account with its own folder and permissions within
Google Drive. I have to share the desired folders with it. The `<SHARED FOLDER>`
in the bash command refers to the exact name of the shared folder.

## Next: encryption and offsite storage

This provides a solid foundation for Google Drive backup. Next step: add
[encryption](https://rclone.org/crypt/) and robust, cost-effective
[storage](https://rclone.org/s3/).

Stay tuned, I'm gonna talk about that
[next]({{< relref "blog/posts/google-drive-backup-part2" >}}).
