---
date: 2025-02-27T20:12:31Z
draft: false
title: (Almost) Free Google Drive Backup
keywords:
  [
    rclone,
    google drive,
    backup,
    cron,
    google drive backup,
    automated backup,
    rclone google drive,
    google cloud console,
    google drive API,
    service account,
    rclone service account,
    cloud storage backup,
    secure backups,
    data recovery,
    rclone automation,
    google drive data protection,
    backup with cron,
    google drive service account,
    rclone docker,
    encrypted cloud backup,
    google drive disaster recovery,
    cloud storage automation,
    scheduled backups,
    rclone config example,
    rclone tutorial,
    data redundancy,
    backup and restore google drive,
    rclone setup,
    google drive security,
    backup best practices
  ]
image: suit.jpg
---

Have you _truly_ considered the catastrophic risks of losing all your Google
Drive data? Can your business afford such a loss?

![generate image in anime style where white collar in suit grabs his head because he realized that lost his reports](suit.jpg)

Let me guide you in mitigating those risks. I asked myself the same question and
searched for a reliable, out-of-the-box solution. Disappointed with Google's
suggestions, I decided to build my own. Think of it as playing with
Lego-assembling the necessary components.

## What building blocks do we need?

- Access to your
  [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts)
- rclone.org: A powerful tool that provides rsync-like CLI functionality for
  managing filesystems and cloud storage. It's well-documented, but we'll focus
  on a streamlined approach

### Google Cloud Console: Setting Up the Service Account

We'll start with the most crucial step: obtaining the necessary credentials to
interact with the Google API. (Remember to enable the
[Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com)
if you haven't already) This involves creating a
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

### rclone: Configuring and Executing the Backup

We're almost there! The next step is to set up rclone for automated execution
using Cron on a host of your choice. I'll skip the details of acquiring a
hosting environment.

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

### rclone: Recovering the Backup

To restore your backup, simply reverse the source and destination paths in the
rclone copy command:

```bash
docker run --rm -it \
    -v ./config:/config/rclone \
    -v ./data:/data \
    rclone/rclone --drive-shared-with-me \
    copy /data/$(date +"%Y-%m-%d") google-drive:<SHARED FOLDER>
```

Be aware that if you recover data, the original permissions will be lost, and
the _Service Account_ will become the owner of all recovered data.

#### Important Note

A _Service Account_ is essentially an account with its own folder and
permissions within Google Drive. Therefore, you must share the desired folders
with it. The `<SHARED FOLDER>` in the bash command refers to the exact name of
the shared folder.

## Conclusion

This provides a solid foundation for Google Drive backup. To enhance its
enterprise-level security and reliability, consider implementing additional
[encryption](https://rclone.org/crypt/) and robust, cost-effective
[storage](https://rclone.org/s3/) solutions.

Stay tuned, we're gonna talk about that
[next]({{< relref "posts/google-drive-backup-part2" >}}).
