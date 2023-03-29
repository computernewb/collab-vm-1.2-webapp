# CollabVM 1.2 Webapp 2.0

![CollabVM Web App](/webapp.png)

The CollabVM Web App is the viewer for the CollabVM Server, currently in beta

## Building
Make sure you filled out common.js, then:
1. `npm i`
2. `npm run build`

The build output directory is `dist/`

## Serving

Just drop the contents of `dist/` somewhere into our webroot. For testing purposes, you can throw up a quick test webserver with the following command

`npm run serve`
