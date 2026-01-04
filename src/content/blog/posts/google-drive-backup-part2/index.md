---
date: 2025-03-05T08:46:19Z
back_ref: /blog/_index.md
draft: false
title: Google drive backup (part 2)
keywords:
  [
    rclone,
    dropbox,
    google drive,
    encryption,
    backup,
    cloud backup,
    encrypted cloud storage,
    rclone backup,
    google drive encryption,
    dropbox encryption,
    secure cloud storage,
    rclone google drive,
    rclone dropbox setup,
    encrypted backups with rclone,
    data redundancy,
    cloud data security,
    offsite backup,
    automated backups,
    rclone crypt,
    secure file transfer,
    cloud data protection,
    backup encryption best practices,
    restoring encrypted backups,
    google drive to dropbox backup,
    rclone docker,
    backup automation,
    rclone config example
  ]
image: suit-2.jpg
---

This is a continuation of the first
[part]({{< relref "blog/posts/google-drive-backup" >}}), where we built a basic
backup solution using local storage. Now, let's elevate our approach by
integrating another cloud provider and adding robust encryption.

![generate image in anime style where relaxed professional guy in blue suit sitting relaxed with wiskey](suit-2.jpg)

## Dropbox: Setting Up an Additional Cloud Provider

To obtain an access token, you'll need to configure
[rclone](https://rclone.org/remote_setup/) locally (because of web browser).
Here's how I did it using Docker:

```bash
docker run --rm -it \
    -v ./config:/config/rclone \
    -v ./data:/data \
    --net=host \
    rclone/rclone authorize "dropbox"
```

After you've obtained the token, simply add new sections to your `rclone.conf`:

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

### rclone: Executing the Encrypted Backup

Now, let's use our encrypted Dropbox remote to back up our Google Drive data:

```bash
docker run --rm -it \
    -v ./config:/config/rclone \
    -v ./data:/data\
    rclone/rclone --drive-shared-with-me \
    copy google-drive:<SHARED FOLDER> dropbox-crypt:
```

### rclone: Recovering the Encrypted Backup

To restore your encrypted backup, simply reverse the source and destination in
your `rclone copy` command:

```bash
docker run --rm -it \
    -v ./config:/config/rclone \
    -v ./data:/data \
    rclone/rclone --drive-shared-with-me \
    copy dropbox-crypt: google-drive:<SHARED FOLDER>
```

This will decrypt and copy your files back to your Google Drive.

**Note:** Only properly encrypted files will be recovered.

## Conclusion

By adding Dropbox as a secondary backup destination and encrypting our data,
we've significantly improved the security and redundancy of our Google Drive
backup solution. This approach provides an extra layer of protection against
data loss or unauthorized access. While this setup is more secure than our
initial local storage-based solution, remember that the strength of your
encryption hinges on the security of your password. Always use strong, unique
passwords and store them securely.

Additionally, consider implementing regular backup testing to ensure your
recovery process works as expected. Future enhancements could include automated
health checks, notifications, and more sophisticated encryption strategies.
