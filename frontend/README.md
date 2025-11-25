# Wallegacy front end project

This project contains the implementation of the DApp of the Alyra project Wallegacy

## Stack

- NextJS
- TailwindCSS
- Wagmi
- RainbowKit
- SQLite
- Prisma (ORM)

## Install

- clone the project
- in a shell, run:
```sh
npm install
```

### DB migration
We use Prisma to manage SQLite database interactions

First you will need to setup env variables:
- Copy paste the `.env.example` file and rename it `.env`
- Add your own values

If you modify schemas (`./prisma/schema.prisma`) don't forget to apply it:
```sh
npx prisma migrate dev
```

and to re-generate the client:
```sh
npx prisma generate
```

### Project launching

- to test the project locally:
```sh
npm run dev
```

- go to http://localhost:3000
- Enjoy

## Considerations

If you use a linux distribution like Debian as OS, you will need to disable the npm audit feature to avoid dependencies installation infinity loop

to do this, in a shell:
```sh
npm config set audit false
# then install dependencies
npm install
```