---
title: Migrating From Gatsby To Scully
description: I decided to refactor my blog. I did it by using an angular-based jamstack framework - Scully
thumbnail: assets/images/scully.png
date: 03/02/2022
tags:
  - angular
  - jamstack
keywords: Programming, Blog, Jamstack, Gatsby, Scully
published: true
---

Recently I decided to focus more on writing. My goal was to post more
regularly, at least 1 article per month. I didn't write an article for
more than a year! I was very excited and happy to start! But when I
started going through my blog's source code I ran into a couple of problems.

Problem #1 - I had a hard time figuring things out. My blog was implemented
with [Gatsby](https://www.gatsbyjs.com/), which is not a bad framework, but it
does require some familiarity with the way it works before one can be
productive. Apparently, I have lost that familiarity because it has been
quite a while since I wrote anything. I also didn't use React for a while, for
almost two years I was doing everything using Angular.

Problem #2 - I really started to dislike my initial design. I am more inclined
towards back-end technologies - yes, but boy, my blog looked really basic and
old. I wanted to make design it from scratch, and make it more minimalistic.

## Solution

After some research, I found a very nice solution. I discovered
[Scully](https://scully.io/), a static site generator for Angular projects.
With it, I could address both of my problems.

Scully uses Angular, which I was really familiar with. But it's not just that,
it seems to me that Scully doesn't have as many 'blackbox' mechanisms
underneath as Gatsby does. It's kind of more lightweight, which I like.
It's almost like you use just Angular - there aren't a lot of things you should
worry about.

Anyway, I will not provide a how-to guide, there are plenty of those on the
internet, like [this one](https://blog.bitsrc.io/scully-the-first-static-site-generator-for-angular-1600ead0b8e1).
I just want to give kudos to the Scully maintainers, really good job
guys! 👏👏👏 You have a star ⭐️ from me!

For those of you who are interested, my new blog is already active - just
look around and see the design. If you want to dig into the code, here's a [link](https://github.com/DarkMannn/darkmannn-blog) for that.
