---
date: 2025-02-21T06:31:02Z
draft: false
title: DI Container vs. Service Template (generator)
keywords: [
  golang, architecture, dependency injection, DI container, service template,
  microservices, software design patterns, software architecture,
  Golang dependency injection, DI vs service template,
  Golang microservices, Golang DI container, Go service generator,
  Golang project structure, Golang best practices,
  software scalability, Golang framework, inversion of control,
  Golang IoC, Golang DI example, Golang container pattern,
  microservices best practices, CI/CD for Golang,
  software quality management, Golang software templates
]
image: morpheus.jpg
---

Let's talk about building and evolving [Golang](https://go.dev/) services in
 the enterprise. We'll explore two approaches:

![Create image illustration in anime style with Morpheus from Matrix suggesting you blue and red pills](morpheus.jpg)

- A *Service Template (generator)* is a common approach for unifying and
  quickly bootstrapping new microservices.  Its popularity is evident in the
  community, as demonstrated by examples such as:
  - https://github.com/evrone/go-clean-template
  - https://www.reddit.com/r/golang/comments/1h124ee/rate_my_go_project_template/
  - https://dev.to/protium/github-template-for-golang-services-3o27
  - https://www.youtube.com/watch?v=1ZbQS6pOlSQ
- [Dependency injection](https://en.wikipedia.org/wiki/Dependency_injection)
  (*DI*)[^1] is an approach where objects are constructed by passing
  pre-initialized components to them, rather than having the objects initialize
  those components themselves.[^2]
  - [DI container](https://github.com/irr123/di) automates the dependency
  injection process. While not the most common approach for bootstrapping new
  services, it offers several advantages, which I will outline.


## The problem

The challenge is a timeless one: accelerating the delivery of value to
 production. From a technical perspective, this translates to several key
 requirements:
- **Pre-built components:**  These eliminate the need to reinvent the wheel,
  saving valuable development time.
- **Consistent service structure:**  A uniform structure reduces
  context-switching overhead.
- **Unified interaction interfaces:** Standardized configuration, logging, and
  metrics save significant time for [operations](https://en.wikipedia.org/wiki/DevOps).


### Examples

Imagine a company with a few internal services looking to expand and release
 more. Or consider an outsourcing company developing services for external
 clients and aiming to increase its customer base. In both scenarios,
 efficiency is paramount, and directly related to the problems highlighted earlier.

When examining individual services, we often find that, regardless of the
 specific [layered architecture](https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/ch01.html)
 employed (e.g., [Onion](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/),
 [Clean](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html),
 or [Hexagonal](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software))[^3])
 outer layers tend to be shared across services, whereas the core business
 logic remains distinct[^4]. Specifically, elements such as observability tools,
 database connections, and message broker clients can be identical. These
 constitute the essential pre-built components and contribute to a consistent
 service structure. A unified interaction interface emerges from the
 standardized configuration of these pre-built components. For example, a
 shared database connection operates with consistent configuration parameters,
 providing uniform logging, metrics, and deployment procedures.


#### Straightforward implementation

A common approach is to consolidate all shared code into one or more shared
 libraries. A service template can then be created to generate new services
 that include these libraries as dependencies, along with pre-prepared
 boilerplate code.

Pros:

- This approach works.

Cons:

- While addressing initial setup challenges, this method introduces a new
  problem: a continuously evolving template will inevitably diverge from the
  services it generates.
- The "templating" nature of this approach makes the template itself difficult
  to test and analyze with static analysis tools.


#### [DI container](https://github.com/irr123/di) to the Rescue

Instead of relying on templates, we can retain the shared library approach and
 encapsulate all pre-built components within a container. This allows
 developers to focus solely on adding the business logic, adhering to the
 chosen layered architecture:

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

This approach reduces maintenance costs because it involves well-typed,
 valid code (without templating complexities) that can be effectively covered
 by [quality checks](https://en.wikipedia.org/wiki/Software_quality_management#Software_quality_and_the_software_lifecycle).
 Furthermore, backward compatibility is maintained by following standard coding practices.


## Finishing Uncovered Parts

Continuing the comparison between containers and templates, it's worth noting
 that templates can offer a more comprehensive initial setup. This might
 include project layout, deployment scripts, CI/CD pipelines, VCS hooks,
 monitoring dashboards, alerts, and other elements. It's important to understand
 that templates provide these features only at the initial project creation and
 do not enforce them during subsequent project evolution (whereas containers
 maintain consistency).

In conclusion good to know that these two approaches are not mutually exclusive
 and this article aims to explore the available options.

---
{data-content="footnotes"}

[^1]: [*IoC*](https://en.wikipedia.org/wiki/Inversion_of_control) is close but
 not the same concept, don't be confused. *DI* is a programming technique,
 while *IoC* is a design principle covered broader
 idea (let me know and I'll think about post on this topic).
[^2]: I intentionally will avoid word "class".
[^3]: Does Dr.Alistair Cockburn not pay for [hosting](https://alistair.cockburn.us)?
[^4]: It's important point, imagine opposite way if you're sharing business
 logic between services, what's a purpose of separation than?
