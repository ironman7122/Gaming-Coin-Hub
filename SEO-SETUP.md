# SEO & GEO Setup Guide

## What's Included

### SEO

- **Meta tags** – Unique title, description, and keywords per page
- **Open Graph & Twitter Cards** – For social sharing
- **Canonical URLs** – Prevents duplicate content issues
- **robots.txt** – Crawler guidance
- **sitemap.xml** – Helps search engines discover pages
- **JSON-LD structured data** – Organization & WebSite schema on homepage
- **Semantic HTML** – Proper `header`, `nav`, `main`, `footer`, `section`

### GEO (Geographic Targeting)
- **Target markets**: USA, India, Pakistan, Bangladesh, Nepal
- **hreflang** – `en-US`, `en-IN`, `en-PK`, `en-BD`, `en-NP` + `x-default` on all public pages
- **Schema.org** – `areaServed` and `ContactPoint.areaServed` for all 5 countries
- **Keywords** – Geo-specific terms (e.g. gaming coins USA, Firekirin India)

## Before Going Live

**Update the domain** in these files if your URL is not `https://gamingcoinhub.com`:

1. **robots.txt** – Change sitemap URL
2. **sitemap.xml** – Replace all `https://gamingcoinhub.com` with your domain
3. **All HTML pages** – Update `href` in `<link rel="canonical">` and `og:url`, `og:image`

Search for `gamingcoinhub.com` and replace with your domain.

## Submit to Search Engines

- **Google**: [Search Console](https://search.google.com/search-console) – Add property, submit sitemap
- **Bing**: [Bing Webmaster Tools](https://www.bing.com/webmasters) – Submit sitemap

## GEO: Target Markets

The site targets **USA, India, Pakistan, Bangladesh, Nepal**. To add or change countries:
- Update `hreflang` links in all HTML pages (add `en-XX` for new country)
- Update schema `areaServed` in `index.html` JSON-LD
- Update `contactPoint.areaServed` array
- Add country-specific keywords to meta tags

## Optional Improvements

- Add a **favicon** – Place `favicon.ico` in the root and add `<link rel="icon" href="favicon.ico">` to `<head>`
- Add **BreadcrumbList** JSON-LD on inner pages
- Create **blog post schema** for individual blog entries
- Add **FAQ schema** if you have an FAQ section
