---
date: 2025-02-21T06:31:02Z
back_ref: /blog/_index.md
draft: false
title: Go DI container vs. service template generator
description:
  "DI containers beat service-template generators in Go on the long arc: typed,
  consistent, and immune to the slow drift template-spawned services suffer."
image: morpheus.jpg
---

Service templates are fine on day one. DI containers age better in Go services.

![Create image illustration in anime style with Morpheus from Matrix suggesting you blue and red pills](morpheus.jpg)

- A _Service Template (generator)_ bootstraps new microservices from a shared
  starting point. Common examples:
  - https://github.com/evrone/go-clean-template
  - https://www.reddit.com/r/golang/comments/1h124ee/rate_my_go_project_template/
  - https://dev.to/protium/github-template-for-golang-services-3o27
  - https://www.youtube.com/watch?v=1ZbQS6pOlSQ
- [Dependency injection](https://grokipedia.com/page/Dependency_injection)
  (_DI_)[^1] means code receives ready components instead of creating them
  itself.[^2]
  - [DI container](https://github.com/irr123/di) automates that wiring. It isn't
    the most common Go bootstrap path, but it keeps the shared boot code typed.

## The problem: service drift

The goal is boring: ship services faster without making each service a one-off
snowflake. That means:

- **Pre-built components:** no new logging, metrics, config, DB, or broker code
  in every service.
- **Consistent service structure:** less context switching between services.
- **Unified interaction interfaces:** same config, logs, metrics, and deploy
  hooks for ops.

### Where templates start to drift

The drift starts when the second, fifth, and tenth service appear. The template
keeps moving, but the generated services don't move with it.

When I inspect services, I usually find the same split. Whatever the
[layered architecture](https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/ch01.html)
is called:
[Onion](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/),
[Clean](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html),
or
[Hexagonal](<https://grokipedia.com/page/Hexagonal_architecture_(software)>)[^3])
the outer layers repeat. Business logic changes.[^4] Observability, database
connections, message broker clients, config, and metrics can be shared. That's
the part worth typing and testing once.

#### Straightforward implementation

A common approach is a shared library plus a service template. The template
creates a new service with the library and prepared boilerplate.

Pros:

- This approach works.

Cons:

- The template fixes initial setup, then drifts away from the services it
  created.
- The template itself is harder to test and analyze than normal Go code.

#### DI container: typed shared bootstrapping

Instead of relying on templates, I keep the shared library and put the shared
components inside a container. The service adds business logic around it:

```go
import (
    "github.com/irr123/di"
    ...
    "internal.lib/bootstrap"
)

func main() {
    c := di.New()
    bootstrap.PutItAllTogether(c)

    di.Set(c, di.OptMiddleware(func(e *echo.Echo) (*echo.Echo, error) {
        // echo srv here is already fully configured and only needs to attach handlers
        e.GET("/", func(c echo.Context) error {
            return c.JSON(http.StatusOK, "")
        })
    }))

    di.Get[*echo.Echo](c).Start(":8080")
}
```

[Live example](https://go.dev/play/p/vxWijBAc3lC).

This costs less to maintain because it's typed Go code, not a text template.
Tests, static analysis, and normal compatibility rules apply.

## What templates still cover

Templates still cover more on day one: project layout, deployment scripts,
CI/CD, VCS hooks, dashboards, alerts. That's useful. The limit is enforcement.
Templates provide those pieces at creation time. Containers keep shared wiring
consistent while the service evolves.

Use both if needed. Template the folder. Put the living bootstrapping code in a
container.

{data-content="footnotes"}

[^1]:
    [_IoC_](https://grokipedia.com/page/Inversion_of_control) is close but not
    the same concept. _DI_ is a programming technique. _IoC_ is a broader design
    principle.

[^2]: I intentionally will avoid word "class".

[^3]:
    Does Dr.Alistair Cockburn not pay for
    [hosting](https://alistair.cockburn.us)?

[^4]:
    Important point: if business logic is shared between services, what's the
    purpose of separation then?
