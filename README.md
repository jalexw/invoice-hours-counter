# Invoice Hours Counter

## Welcome 👋

![Icon for the @jalexw/invoice-hours-counter project](./public/icon.png)

This is the code repository for the [`@jalexw/invoice-hours-counter` tool](https://invoice-hours-counter.jalexw.ca). Export an iCalendar calendar and use it to extract how many hours you've recorded on a project!

I built this to allow me to easily track my freelance hours directly in iCalendar-- then I can just export the calendar events, filter to only the appropriate events, and automatically count my hours up to prepare an itemized invoice!

## Web App

Not tech-savvy? No problem! Just upload your files to the [@jalexw/invoice-hours-counter website](https://invoice-hours-counter.jalexw.ca)! We won't save any of your calendar data (all processing happens directly in your browser)!

## Command-Line Interface

Tech-savvy? There's a CLI that you can use to run this locally!

```bash
# download this repository
git clone https://github.com/jalexw/invoice-hours-counter.git && cd invoice-hours-counter
# install dependencies with the 'bun' package manager (https://bun.sh)
bun install
# run the cli, passing the path to your exported .ics file and any filters!
bun run cli count-hours ./inputs/FreelanceWork.ics --project Project1 --after 2025-03-09T00:00:00Z
```

## Development / Adding Features

### Starting a development web server

```bash
# install dependencies first `bun install`
bun run web:dev
# open the development server: http://localhost:3461
```

### Building the web server for production
```bash
# install dependencies first `bun install`
bun run web:build
```

## Contributions

Contributions are welcomed! Feel free to make a pull request! 🤗

Not tech savvy but appreciate the work? Feel free to buy me a coffee at the following link:

[![GIF that acts as a link to buy jalexw a coffee](./public/buymeacoffee.gif)](https://buymeacoffee.com/jalexw)
