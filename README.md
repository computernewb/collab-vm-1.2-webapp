# CollabVM 1.2 Webapp 2.0

![CollabVM Web App](/webapp.png)

The CollabVM Web App is the viewer for the CollabVM Server.

## Building

Edit Config.ts to your needs, then:

## yarn
- `yarn`
- `yarn build`

## npm
- `npm i`
- `npm run build`

The build output directory is `dist/`.

## Unit testing

This is very minimal and only tests a single standalone part at the moment:

- `yarn test`

## Serving

Just drop the contents of `dist/` somewhere into your webroot. 

For **testing or development purposes only**, you can throw up a quick test webserver with the following command:

## yarn

`yarn serve`

## npm

`npm run serve`
